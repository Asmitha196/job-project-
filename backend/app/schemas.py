from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ==========================================
# Authentication Schemas
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ==========================================
# User Schemas
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Resume Schemas
# ==========================================

class ResumeBase(BaseModel):
    file_name: str

class ResumeCreate(ResumeBase):
    file_path: str
    content_text: Optional[str] = None
    parsed_skills: Optional[List[str]] = None
    parsed_experience: Optional[Dict[str, Any]] = None

class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    file_path: str
    content_text: Optional[str] = None
    parsed_skills: Optional[List[str]] = None
    parsed_experience: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Job Schemas
# ==========================================

class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    skills_required: Optional[List[str]] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    is_active: Optional[bool] = True

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[List[str]] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    is_active: Optional[bool] = None

class JobResponse(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Saved Job Schemas
# ==========================================

class SavedJobCreate(BaseModel):
    job_id: int

class SavedJobResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    saved_at: datetime
    job: Optional[JobResponse] = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Recommendation Schemas
# ==========================================

class RecommendationCreate(BaseModel):
    resume_id: int
    job_id: int
    match_score: float
    explanation: Optional[str] = None
    skills_gap: Optional[List[str]] = None

class RecommendationResponse(BaseModel):
    id: int
    user_id: int
    resume_id: int
    job_id: int
    match_score: float
    explanation: Optional[str] = None
    skills_gap: Optional[List[str]] = None
    created_at: datetime
    job: Optional[JobResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Chatbot Schemas
# ==========================================

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., example="user123")
    message: str = Field(
        ...,
        example="Suggest Python Backend Developer jobs for me."
    )


class ChatResponse(BaseModel):
    success: bool = Field(..., example=True)
    response: str = Field(
        ...,
        example="Based on your profile, I recommend Backend Python Developer roles."
    )


class ClearMemoryResponse(BaseModel):
    success: bool = Field(..., example=True)
    message: str = Field(
        ...,
        example="Conversation history cleared successfully."
    )

    