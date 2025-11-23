from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.utils.database import Base

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Interview Configuration
    role = Column(String, nullable=False)  # e.g., "Software Engineer", "Sales Manager"
    difficulty = Column(String, default="medium")  # easy, medium, hard
    duration_minutes = Column(Integer, default=30)
    
    # Session Data
    status = Column(String, default="pending")  # pending, in_progress, completed, cancelled
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Conversation
    conversation_history = Column(JSON, default=list)
    transcript = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="interviews")
    evaluation = relationship("Evaluation", back_populates="interview", uselist=False)

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    
    # Overall Scores
    overall_score = Column(Float, nullable=False)
    communication_score = Column(Float)
    technical_score = Column(Float)
    problem_solving_score = Column(Float)
    confidence_score = Column(Float)
    
    # Detailed Analysis
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    improvement_areas = Column(JSON, default=list)
    
    # Question-wise Feedback
    question_feedback = Column(JSON, default=list)
    
    # Recommendations
    recommendations = Column(Text)
    next_steps = Column(JSON, default=list)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="evaluations")
    interview = relationship("Interview", back_populates="evaluation")