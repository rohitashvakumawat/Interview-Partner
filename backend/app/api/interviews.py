from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from app.utils.database import get_db
from app.models.user import User
from app.models.interview import Interview, Evaluation
from app.api.auth import get_current_user
from app.agents.interview_graph import interview_graph, InterviewState
from app.services.evaluation_service import evaluation_service
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service
from app.utils.redis_client import redis_client
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio
import os
import tempfile

router = APIRouter(prefix="/interviews", tags=["Interviews"])

class InterviewCreate(BaseModel):
    role: str
    difficulty: str = "medium"
    duration_minutes: int = 30

class InterviewResponse(BaseModel):
    id: int
    role: str
    difficulty: str
    status: str
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

class MessageInput(BaseModel):
    message: str
    audio_data: Optional[str] = None

@router.post("/create", response_model=InterviewResponse)
def create_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new interview session"""
    
    # Validate role
    valid_roles = [
        "Software Engineer", "Data Scientist", "Product Manager",
        "Sales Manager", "Marketing Manager", "Business Analyst",
        "UI/UX Designer", "DevOps Engineer", "Project Manager",
        "Customer Success Manager", "Retail Associate", "HR Manager"
    ]
    
    if interview_data.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Choose from: {', '.join(valid_roles)}"
        )
    
    # Create interview
    interview = Interview(
        user_id=current_user.id,
        role=interview_data.role,
        difficulty=interview_data.difficulty,
        duration_minutes=interview_data.duration_minutes,
        status="pending"
    )
    
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    return InterviewResponse(
        id=interview.id,
        role=interview.role,
        difficulty=interview.difficulty,
        status=interview.status,
        created_at=interview.created_at,
        started_at=interview.started_at,
        completed_at=interview.completed_at
    )

@router.get("/", response_model=List[InterviewResponse])
def get_user_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    limit: int = 10
):
    """Get user's interviews"""
    query = db.query(Interview).filter(Interview.user_id == current_user.id)
    
    if status:
        query = query.filter(Interview.status == status)
    
    interviews = query.order_by(Interview.created_at.desc()).limit(limit).all()
    
    return [
        InterviewResponse(
            id=interview.id,
            role=interview.role,
            difficulty=interview.difficulty,
            status=interview.status,
            created_at=interview.created_at,
            started_at=interview.started_at,
            completed_at=interview.completed_at
        )
        for interview in interviews
    ]

@router.get("/{interview_id}")
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interview details"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    return {
        "id": interview.id,
        "role": interview.role,
        "difficulty": interview.difficulty,
        "status": interview.status,
        "duration_minutes": interview.duration_minutes,
        "conversation_history": interview.conversation_history or [],
        "transcript": interview.transcript,
        "created_at": interview.created_at.isoformat(),
        "started_at": interview.started_at.isoformat() if interview.started_at else None,
        "completed_at": interview.completed_at.isoformat() if interview.completed_at else None
    }

@router.post("/{interview_id}/start")
def start_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start an interview session"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status != "pending":
        raise HTTPException(status_code=400, detail="Interview already started or completed")
    
    # Update interview status
    interview.status = "in_progress"
    interview.started_at = datetime.utcnow()
    
    # Initialize interview state
    initial_state = InterviewState(
        role=interview.role,
        difficulty=interview.difficulty,
        user_profile={
            "skills": current_user.skills or [],
            "experience_years": current_user.experience_years or 0,
            "target_roles": current_user.target_roles or [],
            "education": current_user.education or {}
        },
        conversation_history=[],
        current_question="",
        question_count=0,
        max_questions=10,
        evaluation_notes=[],
        thinking_process="",
        user_response="",
        should_end=False
    )
    
    # Store state in Redis
    redis_client.set(f"interview_state:{interview_id}", initial_state, expire=3600)
    
    db.commit()
    
    # Generate first question
    result = interview_graph.graph.invoke(initial_state)
    
    # Update Redis with new state
    redis_client.set(f"interview_state:{interview_id}", result, expire=3600)
    
    # Save to database
    interview.conversation_history = result.get("conversation_history", [])
    db.commit()
    
    return {
        "message": "Interview started",
        "question": result.get("current_question", ""),
        "thinking_process": result.get("thinking_process", "")
    }

@router.post("/{interview_id}/respond")
async def respond_to_question(
    interview_id: int,
    message_input: MessageInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit response to interview question"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status != "in_progress":
        raise HTTPException(status_code=400, detail="Interview is not in progress")
    
    # Get current state from Redis
    state = redis_client.get(f"interview_state:{interview_id}")
    
    if not state:
        raise HTTPException(status_code=400, detail="Interview state not found")
    
    # Process audio if provided
    user_response = message_input.message
    
    if message_input.audio_data:
        # Decode base64 audio and transcribe
        import base64
        audio_bytes = base64.b64decode(message_input.audio_data)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
        
        try:
            # Transcribe
            transcription = stt_service.transcribe(temp_audio_path)
            user_response = transcription["text"]
        finally:
            # Clean up
            os.unlink(temp_audio_path)
    
    # Update state with user response
    state["user_response"] = user_response
    state["conversation_history"].append({
        "role": "user",
        "content": user_response,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Process through graph
    result = interview_graph.graph.invoke(state)
    
    # Update Redis
    redis_client.set(f"interview_state:{interview_id}", result, expire=3600)
    
    # Save to database
    interview.conversation_history = result.get("conversation_history", [])
    db.commit()
    
    # Check if interview should end
    if result.get("should_end", False):
        return await complete_interview(interview_id, current_user, db)
    
    # Generate TTS for response
    response_text = result.get("current_question", "")
    audio_path = None
    
    if response_text:
        audio_dir = os.path.join(settings.UPLOAD_DIR, "audio", str(interview_id))
        os.makedirs(audio_dir, exist_ok=True)
        audio_path = os.path.join(audio_dir, f"response_{result['question_count']}.wav")
        
        try:
            tts_service.synthesize(response_text, audio_path)
        except Exception as e:
            print(f"TTS generation failed: {e}")
            audio_path = None
    
    return {
        "question": response_text,
        "thinking_process": result.get("thinking_process", ""),
        "question_count": result.get("question_count", 0),
        "max_questions": result.get("max_questions", 10),
        "audio_url": f"/audio/{interview_id}/response_{result['question_count']}.wav" if audio_path else None
    }

async def complete_interview(
    interview_id: int,
    current_user: User,
    db: Session
):
    """Complete interview and generate evaluation"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Get final state
    state = redis_client.get(f"interview_state:{interview_id}")
    
    if not state:
        raise HTTPException(status_code=400, detail="Interview state not found")
    
    # Update interview status
    interview.status = "completed"
    interview.completed_at = datetime.utcnow()
    
    # Generate transcript
    transcript = "\n\n".join([
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in state.get("conversation_history", [])
    ])
    interview.transcript = transcript
    
    # Generate evaluation
    evaluation_data = evaluation_service.evaluate_interview(
        conversation_history=state.get("conversation_history", []),
        evaluation_notes=state.get("evaluation_notes", []),
        role=interview.role,
        user_profile={
            "skills": current_user.skills or [],
            "experience_years": current_user.experience_years or 0,
            "target_roles": current_user.target_roles or []
        }
    )
    
    # Save evaluation
    evaluation = Evaluation(
        user_id=current_user.id,
        interview_id=interview.id,
        overall_score=evaluation_data["overall_score"],
        communication_score=evaluation_data["communication_score"],
        technical_score=evaluation_data["technical_score"],
        problem_solving_score=evaluation_data["problem_solving_score"],
        confidence_score=evaluation_data["confidence_score"],
        strengths=evaluation_data["strengths"],
        weaknesses=evaluation_data["weaknesses"],
        improvement_areas=evaluation_data["improvement_areas"],
        question_feedback=evaluation_data["question_feedback"],
        recommendations=evaluation_data["recommendations"]
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    # Clean up Redis
    redis_client.delete(f"interview_state:{interview_id}")
    
    return {
        "message": "Interview completed",
        "evaluation_id": evaluation.id,
        "overall_score": evaluation.overall_score
    }

@router.post("/{interview_id}/complete")
async def complete_interview_endpoint(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually complete an interview"""
    return await complete_interview(interview_id, current_user, db)

@router.delete("/{interview_id}")
def delete_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an interview"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Delete associated evaluation
    db.query(Evaluation).filter(Evaluation.interview_id == interview_id).delete()
    
    # Delete interview
    db.delete(interview)
    db.commit()
    
    # Clean up Redis
    redis_client.delete(f"interview_state:{interview_id}")
    
    return {"message": "Interview deleted successfully"}

# WebSocket endpoint for real-time interview
@router.websocket("/ws/{interview_id}")
async def websocket_interview(
    websocket: WebSocket,
    interview_id: int,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time interview interaction"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            message_type = data.get("type")
            
            if message_type == "audio":
                # Handle audio input
                audio_data = data.get("audio")
                
                # Send thinking indicator
                await websocket.send_json({
                    "type": "thinking",
                    "message": "Processing your response..."
                })
                
                # Process audio (transcribe, generate response, etc.)
                # ... (implementation similar to respond_to_question)
                
                # Send response
                await websocket.send_json({
                    "type": "response",
                    "question": "Next question...",
                    "audio_url": "/path/to/audio"
                })
            
            elif message_type == "text":
                # Handle text input
                text = data.get("text")
                
                await websocket.send_json({
                    "type": "thinking",
                    "message": "Analyzing your response..."
                })
                
                # Process text
                # ...
                
                await websocket.send_json({
                    "type": "response",
                    "question": "Next question..."
                })
            
            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for interview {interview_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()