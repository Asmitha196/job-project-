import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.dependencies import get_current_active_user
from backend.app.config import settings

router = APIRouter()

# Helper list of common skills to mock extract from text
COMMON_SKILLS = [
    "python", "javascript", "typescript", "react", "vue", "angular", "node", "express", 
    "fastapi", "django", "flask", "sql", "postgresql", "mysql", "sqlite", "mongodb", 
    "redis", "docker", "kubernetes", "aws", "gcp", "azure", "html", "css", "git", 
    "machine learning", "deep learning", "nlp", "langchain", "qdrant", "java", "c++"
]

def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract matching skills from plain text case-insensitively.
    """
    text_lower = text.lower()
    found_skills = []
    for skill in COMMON_SKILLS:
        # Match as word boundary if possible, or simple inclusion
        if skill in text_lower:
            found_skills.append(skill.capitalize())
    return found_skills

@router.post("/upload", response_model=schemas.ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Upload a resume file (PDF, TXT, or DOCX), extract basic text and skills,
    and save it in the database.
    """
    allowed_extensions = {".pdf", ".txt", ".docx"}
    _, file_ext = os.path.splitext(file.filename)
    if file_ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # Setup local upload directory
    upload_dir = os.path.join(settings.BASE_DIR, "backend", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the file to disk
    file_path = os.path.join(upload_dir, f"{current_user.id}_{file.filename}")
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    # Simple extraction logic based on file type
    content_text = ""
    if file_ext.lower() == ".txt":
        try:
            content_text = content.decode("utf-8")
        except UnicodeDecodeError:
            content_text = content.decode("latin-1", errors="ignore")
    else:
        # Mock extraction for PDF/DOCX at route level until the AI service/Langchain parses it
        content_text = f"Binary content of {file.filename}. Ready for AI service parsing."
    
    # Extract skills
    parsed_skills = extract_skills_from_text(content_text)
    if not parsed_skills:
        # Default fallback skills if none found
        parsed_skills = ["Python", "SQL"]
        
    parsed_experience = {
        "summary": "Extracted automatically upon upload",
        "file_size_bytes": len(content),
        "file_type": file_ext
    }
    
    db_resume = models.Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        content_text=content_text,
        parsed_skills=parsed_skills,
        parsed_experience=parsed_experience
    )
    
    db.add(db_resume)
    await db.commit()
    await db.refresh(db_resume)
    
    return db_resume

@router.get("/", response_model=List[schemas.ResumeResponse])
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    List all uploaded resumes of the logged-in user.
    """
    query = select(models.Resume).where(models.Resume.user_id == current_user.id).order_by(desc(models.Resume.created_at))
    result = await db.execute(query)
    resumes = result.scalars().all()
    return resumes

@router.get("/active", response_model=schemas.ResumeResponse)
async def get_active_resume(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieve the user's latest active (most recently uploaded) resume.
    """
    query = select(models.Resume).where(models.Resume.user_id == current_user.id).order_by(desc(models.Resume.created_at))
    result = await db.execute(query)
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resumes uploaded yet"
        )
    return resume
