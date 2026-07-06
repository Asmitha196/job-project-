from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import String, Integer, ForeignKey, Text, Float, DateTime, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from backend.app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    saved_jobs: Mapped[List["SavedJob"]] = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    content_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parsed_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    parsed_experience: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="resumes")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="resume", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills_required: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    experience_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    salary_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    saved_by_users: Mapped[List["SavedJob"]] = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="job", cascade="all, delete-orphan")

class SavedJob(Base):
    __tablename__ = "saved_jobs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_jobs")
    job: Mapped["Job"] = relationship("Job", back_populates="saved_by_users")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id: Mapped[int] = mapped_column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills_gap: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recommendations")
    resume: Mapped["Resume"] = relationship("Resume", back_populates="recommendations")
    job: Mapped["Job"] = relationship("Job", back_populates="recommendations")
