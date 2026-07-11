from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from collections import Counter

from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.dependencies import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[schemas.RecommendationResponse])
async def get_recommendations(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get job recommendations based on the user's latest uploaded resume.
    Computes a matching score based on skill overlaps, saves the log,
    and returns recommendations sorted by match score.
    """
    # 1. Fetch latest resume
    resume_query = select(models.Resume).where(models.Resume.user_id == current_user.id).order_by(desc(models.Resume.created_at))
    result = await db.execute(resume_query)
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a resume first before requesting recommendations."
        )
        
    # 2. Retrieve job records
    # Try semantic search first via Qdrant vector DB
    from backend.app.services import search_similar_jobs, generate_match_reasoning, generate_learning_path
    
    hits = search_similar_jobs(
        resume_skills=resume.parsed_skills or [],
        resume_text=resume.content_text or "",
        limit=limit
    )
    
    if hits:
        job_ids = [hit["id"] for hit in hits]
        # Query only the semantically similar jobs, retaining is_active flag check
        jobs_query = select(models.Job).where(models.Job.id.in_(job_ids), models.Job.is_active == True)
        jobs_result = await db.execute(jobs_query)
        jobs = jobs_result.scalars().all()
        # Keep track of mapping for sorting if needed, but we will sort by matching score at the end
    else:
        # Fallback: retrieve all active jobs from PostgreSQL
        jobs_query = select(models.Job).where(models.Job.is_active == True)
        jobs_result = await db.execute(jobs_query)
        jobs = jobs_result.scalars().all()
        
    if not jobs:
        return []
        
    # Fetch all existing recommendations for this resume in bulk to avoid N database queries
    recs_query = select(models.Recommendation).where(
        models.Recommendation.user_id == current_user.id,
        models.Recommendation.resume_id == resume.id
    )
    recs_result = await db.execute(recs_query)
    existing_recs = {r.job_id: r for r in recs_result.scalars().all()}
    
    # 3. Compute match scores via LLM / Fallback reasoning
    for job in jobs:
        # Generate reasoning and score using the AI service wrapper (with built-in fallback)
        match_info = generate_match_reasoning(
            resume_skills=resume.parsed_skills or [],
            resume_text=resume.content_text or "",
            job_title=job.title,
            job_company=job.company,
            job_description=job.description,
            job_skills=job.skills_required or []
        )
        
        match_score = match_info["match_score"]
        explanation = match_info["explanation"]
        skills_gap = match_info["skills_gap"]
            
        # 4. Check if recommendation record already exists in our pre-fetched dictionary
        db_rec = existing_recs.get(job.id)
        
        if db_rec:
            # Update existing recommendation log
            db_rec.match_score = match_score
            db_rec.explanation = explanation
            db_rec.skills_gap = skills_gap
        else:
            # Create a new recommendation log
            db_rec = models.Recommendation(
                user_id=current_user.id,
                resume_id=resume.id,
                job_id=job.id,
                match_score=match_score,
                explanation=explanation,
                skills_gap=skills_gap
            )
            db.add(db_rec)
        
    await db.commit()
    
    # 5. Fetch final recommendations preloading the related Job records via selectinload
    from sqlalchemy.orm import selectinload
    
    final_query = select(models.Recommendation).options(
        selectinload(models.Recommendation.job)
    ).where(
        models.Recommendation.user_id == current_user.id,
        models.Recommendation.resume_id == resume.id
    ).order_by(desc(models.Recommendation.match_score)).limit(limit)
    
    final_result = await db.execute(final_query)
    recommendations_list = final_result.scalars().all()
    
    return recommendations_list

@router.get("/skills-gap", status_code=status.HTTP_200_OK)
async def get_skills_gap_analysis(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Generate an aggregated skills gap analysis showing which skills the user
    is missing across top matching jobs, along with recommendations on what to learn.
    """
    from backend.app.services import generate_learning_path

    # 1. Fetch latest resume
    resume_query = select(models.Resume).where(models.Resume.user_id == current_user.id).order_by(desc(models.Resume.created_at))
    result = await db.execute(resume_query)
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a resume first before requesting skill gap analysis."
        )
        
    # 2. Fetch the top 10 recommendations to perform analysis
    rec_query = select(models.Recommendation).where(
        models.Recommendation.user_id == current_user.id,
        models.Recommendation.resume_id == resume.id
    ).order_by(desc(models.Recommendation.match_score)).limit(10)
    
    rec_result = await db.execute(rec_query)
    recommendations = rec_result.scalars().all()
    
    if not recommendations:
        return {
            "resume_skills": resume.parsed_skills or [],
            "total_jobs_evaluated": 0,
            "skill_gaps": [],
            "advice": "No recommendations available. Generate job recommendations first."
        }
        
    # 3. Aggregate missing skills
    missing_counter = Counter()
    total_jobs_evaluated = len(recommendations)
    
    for rec in recommendations:
        for skill in (rec.skills_gap or []):
            missing_counter[skill] += 1
            
    # Format the aggregated gaps
    gaps = [
        {
            "skill": skill,
            "missing_in_jobs_count": count,
            "percentage_of_jobs": round((count / total_jobs_evaluated) * 100, 1)
        }
        for skill, count in missing_counter.most_common()
    ]
    
    # 4. Generate step-by-step career path using LLM
    skills_gap_list = [gap["skill"] for gap in gaps]
    advice = generate_learning_path(skills_gap_list)
        
    return {
        "resume_skills": resume.parsed_skills or [],
        "total_jobs_evaluated": total_jobs_evaluated,
        "skill_gaps": gaps,
        "advice": advice
    }
