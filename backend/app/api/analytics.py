from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.utils.database import get_db
from app.models.user import User
from app.models.interview import Interview, Evaluation
from app.api.auth import get_current_user
from app.api.auth import get_current_user, get_current_user_optional
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_analytics(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard analytics"""
    
    # Overall statistics
    total_interviews = db.query(func.count(Interview.id)).filter(
        Interview.user_id == current_user.id
    ).scalar() or 0
    
    completed_interviews = db.query(func.count(Interview.id)).filter(
        Interview.user_id == current_user.id,
        Interview.status == "completed"
    ).scalar() or 0
    
    # Score statistics
    score_stats = db.query(
        func.avg(Evaluation.overall_score).label("avg_score"),
        func.max(Evaluation.overall_score).label("max_score"),
        func.min(Evaluation.overall_score).label("min_score")
    ).filter(
        Evaluation.user_id == current_user.id
    ).first()
    
    avg_score = round(score_stats.avg_score, 2) if score_stats.avg_score else 0
    max_score = round(score_stats.max_score, 2) if score_stats.max_score else 0
    min_score = round(score_stats.min_score, 2) if score_stats.min_score else 0
    
    # Category scores
    category_scores = db.query(
        func.avg(Evaluation.communication_score).label("communication"),
        func.avg(Evaluation.technical_score).label("technical"),
        func.avg(Evaluation.problem_solving_score).label("problem_solving"),
        func.avg(Evaluation.confidence_score).label("confidence")
    ).filter(
        Evaluation.user_id == current_user.id
    ).first()
    
    # Progress over time (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    progress_data = db.query(
        func.date(Interview.completed_at).label("date"),
        func.avg(Evaluation.overall_score).label("avg_score")
    ).join(
        Evaluation, Interview.id == Evaluation.interview_id
    ).filter(
        Interview.user_id == current_user.id,
        Interview.completed_at >= thirty_days_ago,
        Interview.status == "completed"
    ).group_by(
        func.date(Interview.completed_at)
    ).order_by(
        func.date(Interview.completed_at)
    ).all()
    
    # Role-wise performance
    role_performance = db.query(
        Interview.role,
        func.count(Interview.id).label("count"),
        func.avg(Evaluation.overall_score).label("avg_score")
    ).join(
        Evaluation, Interview.id == Evaluation.interview_id
    ).filter(
        Interview.user_id == current_user.id,
        Interview.status == "completed"
    ).group_by(
        Interview.role
    ).all()
    
    # Common strengths and weaknesses
    all_evaluations = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id
    ).all()
    
    all_strengths = []
    all_weaknesses = []
    
    for eval in all_evaluations:
        all_strengths.extend(eval.strengths or [])
        all_weaknesses.extend(eval.weaknesses or [])
    
    # Count frequency
    from collections import Counter
    strength_counter = Counter(all_strengths)
    weakness_counter = Counter(all_weaknesses)
    
    top_strengths = [
        {"area": strength, "count": count}
        for strength, count in strength_counter.most_common(5)
    ]
    
    top_weaknesses = [
        {"area": weakness, "count": count}
        for weakness, count in weakness_counter.most_common(5)
    ]
    
    return {
        "overview": {
            "total_interviews": total_interviews,
            "completed_interviews": completed_interviews,
            "avg_score": avg_score,
            "max_score": max_score,
            "min_score": min_score
        },
        "category_scores": {
            "communication": round(category_scores.communication, 2) if category_scores.communication else 0,
            "technical": round(category_scores.technical, 2) if category_scores.technical else 0,
            "problem_solving": round(category_scores.problem_solving, 2) if category_scores.problem_solving else 0,
            "confidence": round(category_scores.confidence, 2) if category_scores.confidence else 0
        },
        "progress_over_time": [
            {
                "date": item.date if isinstance(item.date, str) else item.date.isoformat(),
                "avg_score": round(item.avg_score, 2)
            }
            for item in progress_data
        ],
        "role_performance": [
            {
                "role": item.role,
                "count": item.count,
                "avg_score": round(item.avg_score, 2)
            }
            for item in role_performance
        ],
        "top_strengths": top_strengths,
        "top_weaknesses": top_weaknesses
    }

@router.get("/evaluations/{evaluation_id}")
def get_evaluation_details(
    evaluation_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get detailed evaluation report"""
    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id,
        Evaluation.user_id == current_user.id
    ).first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    # Get associated interview
    interview = db.query(Interview).filter(
        Interview.id == evaluation.interview_id
    ).first()
    
    return {
        "id": evaluation.id,
        "interview": {
            "id": interview.id,
            "role": interview.role,
            "difficulty": interview.difficulty,
            "completed_at": interview.completed_at.isoformat() if interview.completed_at else None
        },
        "scores": {
            "overall": round(evaluation.overall_score, 2),
            "communication": round(evaluation.communication_score, 2) if evaluation.communication_score else 0,
            "technical": round(evaluation.technical_score, 2) if evaluation.technical_score else 0,
            "problem_solving": round(evaluation.problem_solving_score, 2) if evaluation.problem_solving_score else 0,
            "confidence": round(evaluation.confidence_score, 2) if evaluation.confidence_score else 0
        },
        "strengths": evaluation.strengths or [],
        "weaknesses": evaluation.weaknesses or [],
        "improvement_areas": evaluation.improvement_areas or [],
        "question_feedback": evaluation.question_feedback or [],
        "recommendations": evaluation.recommendations,
        "created_at": evaluation.created_at.isoformat()
    }

@router.get("/improvement-trends")
def get_improvement_trends(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
    days: int = 90
):
    """Get improvement trends over time"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all evaluations in time range
    evaluations = db.query(Evaluation).join(
        Interview, Evaluation.interview_id == Interview.id
    ).filter(
        Evaluation.user_id == current_user.id,
        Interview.completed_at >= start_date
    ).order_by(Interview.completed_at).all()
    
    if not evaluations:
        return {
            "message": "No data available for the specified time range",
            "trends": []
        }
    
    trends = []
    for eval in evaluations:
        interview = db.query(Interview).filter(
            Interview.id == eval.interview_id
        ).first()
        
        trends.append({
            "date": interview.completed_at.isoformat() if interview.completed_at else None,
            "overall_score": round(eval.overall_score, 2),
            "communication_score": round(eval.communication_score, 2) if eval.communication_score else 0,
            "technical_score": round(eval.technical_score, 2) if eval.technical_score else 0,
            "problem_solving_score": round(eval.problem_solving_score, 2) if eval.problem_solving_score else 0,
            "confidence_score": round(eval.confidence_score, 2) if eval.confidence_score else 0
        })
    
    return {
        "trends": trends,
        "summary": {
            "total_evaluations": len(evaluations),
            "improvement": round(trends[-1]["overall_score"] - trends[0]["overall_score"], 2) if len(trends) > 1 else 0
        }
    }

@router.get("/recommendations")
def get_personalized_recommendations(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get personalized recommendations based on performance"""
    
    # Get latest evaluations
    latest_evaluations = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id
    ).order_by(Evaluation.created_at.desc()).limit(5).all()
    
    if not latest_evaluations:
        return {
            "message": "Complete some interviews to get personalized recommendations",
            "recommendations": []
        }
    
    # Aggregate improvement areas
    all_improvement_areas = []
    for eval in latest_evaluations:
        all_improvement_areas.extend(eval.improvement_areas or [])
    
    # Get unique areas with priority
    from collections import defaultdict
    area_priority = defaultdict(list)
    
    for area in all_improvement_areas:
        if isinstance(area, dict):
            area_priority[area.get("area", "")].append(area.get("priority", "medium"))
    
    recommendations = []
    for area, priorities in area_priority.items():
        high_priority_count = priorities.count("high")
        
        recommendations.append({
            "area": area,
            "frequency": len(priorities),
            "priority": "high" if high_priority_count > len(priorities) / 2 else "medium",
            "action_items": [
                item.get("action_plan", "")
                for eval in latest_evaluations
                for item in (eval.improvement_areas or [])
                if isinstance(item, dict) and item.get("area") == area
            ][:1]  # Get first action plan
        })
    
    # Sort by frequency and priority
    recommendations.sort(
        key=lambda x: (x["priority"] == "high", x["frequency"]),
        reverse=True
    )
    
    return {
        "recommendations": recommendations[:10],  # Top 10
        "total_areas": len(recommendations)
    }