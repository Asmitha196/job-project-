from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.dependencies import get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: schemas.JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new job listing. (Requires an active logged-in user)
    """
    db_job = models.Job(
        title=job_in.title,
        company=job_in.company,
        location=job_in.location,
        description=job_in.description,
        requirements=job_in.requirements,
        skills_required=job_in.skills_required,
        experience_level=job_in.experience_level,
        salary_range=job_in.salary_range,
        is_active=job_in.is_active if job_in.is_active is not None else True
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    
    # Sync to Qdrant vector DB
    from backend.app.services import upsert_job_vector
    upsert_job_vector(db_job)
    
    return db_job

@router.get("/", response_model=List[schemas.JobResponse])
async def list_jobs(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all job listings with pagination.
    """
    query = select(models.Job)
    if active_only:
        query = query.where(models.Job.is_active == True)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()
    return jobs

@router.get("/{job_id}", response_model=schemas.JobResponse)
async def get_job_by_id(job_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get details of a single job listing by ID.
    """
    query = select(models.Job).where(models.Job.id == job_id)
    result = await db.execute(query)
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    return job

@router.put("/{job_id}", response_model=schemas.JobResponse)
async def update_job(
    job_id: int,
    job_in: schemas.JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a job listing. (Requires an active logged-in user)
    """
    # Verify job exists
    query = select(models.Job).where(models.Job.id == job_id)
    result = await db.execute(query)
    db_job = result.scalars().first()
    if not db_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    
    # Update fields that were provided
    update_data = job_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_job, field, value)
        
    await db.commit()
    await db.refresh(db_job)
    
    # Sync updated job details to Qdrant vector DB
    from backend.app.services import upsert_job_vector
    upsert_job_vector(db_job)
    
    return db_job

@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a job listing. (Requires an active logged-in user)
    """
    query = select(models.Job).where(models.Job.id == job_id)
    result = await db.execute(query)
    db_job = result.scalars().first()
    if not db_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    
    await db.delete(db_job)
    await db.commit()
    
    # Delete job vector from Qdrant
    from backend.app.services import delete_job_vector
    delete_job_vector(job_id)
    
    return {"detail": "Job successfully deleted", "id": job_id}
