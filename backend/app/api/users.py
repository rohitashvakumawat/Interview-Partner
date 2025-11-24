from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.utils.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.services.resume_parser import resume_parser
from app.config import get_settings
from pydantic import BaseModel
import os
import shutil

router = APIRouter(prefix="/users", tags=["Users"])
settings = get_settings()

class UserProfile(BaseModel):
    full_name: str
    email: str
    phone: str
    skills: List[str]
    experience_years: int
    target_roles: List[str]
    education: dict

class UserProfileUpdate(BaseModel):
    full_name: str = None
    skills: List[str] = None
    experience_years: int = None
    target_roles: List[str] = None
    education: dict = None

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        skills=current_user.skills or [],
        experience_years=current_user.experience_years or 0,
        target_roles=current_user.target_roles or [],
        education=current_user.education or {}
    )

@router.put("/me")
def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if profile_update.full_name:
        current_user.full_name = profile_update.full_name
    if profile_update.skills is not None:
        current_user.skills = profile_update.skills
    if profile_update.experience_years is not None:
        current_user.experience_years = profile_update.experience_years
    if profile_update.target_roles is not None:
        current_user.target_roles = profile_update.target_roles
    if profile_update.education is not None:
        current_user.education = profile_update.education
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile updated successfully"}

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and parse resume"""
    
    # Validate file type
    allowed_extensions = ['.pdf', '.docx']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_dir, f"resume{file_ext}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Parse resume
    try:
        parsed_data = resume_parser.parse_resume(file_path)
        
        # Update user profile with parsed data
        if parsed_data.get('skills'):
            current_user.skills = list(set((current_user.skills or []) + parsed_data['skills']))
        
        if parsed_data.get('experience_years'):
            current_user.experience_years = max(
                current_user.experience_years or 0,
                parsed_data['experience_years']
            )
        
        current_user.resume_path = file_path
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Resume uploaded and parsed successfully",
            "parsed_data": {
                "skills": parsed_data.get('skills', []),
                "experience_years": parsed_data.get('experience_years', 0),
                "email": parsed_data.get('email', ''),
                "phone": parsed_data.get('phone', '')
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@router.delete("/resume")
def delete_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user's resume"""
    if current_user.resume_path and os.path.exists(current_user.resume_path):
        try:
            os.remove(current_user.resume_path)
        except Exception as e:
            print(f"Failed to delete file: {e}")
    
    current_user.resume_path = None
    db.commit()
    
    return {"message": "Resume deleted successfully"}

@router.get("/stats")
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    from app.models.interview import Interview, Evaluation
    from sqlalchemy import func
    
    total_interviews = db.query(func.count(Interview.id)).filter(
        Interview.user_id == current_user.id
    ).scalar()
    
    completed_interviews = db.query(func.count(Interview.id)).filter(
        Interview.user_id == current_user.id,
        Interview.status == "completed"
    ).scalar()
    
    avg_score = db.query(func.avg(Evaluation.overall_score)).filter(
        Evaluation.user_id == current_user.id
    ).scalar()
    
    recent_interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id
    ).order_by(Interview.created_at.desc()).limit(5).all()
    
    return {
        "total_interviews": total_interviews or 0,
        "completed_interviews": completed_interviews or 0,
        "average_score": round(avg_score, 2) if avg_score else 0,
        "recent_interviews": [
            {
                "id": interview.id,
                "role": interview.role,
                "status": interview.status,
                "created_at": interview.created_at.isoformat()
            }
            for interview in recent_interviews
        ]
    }