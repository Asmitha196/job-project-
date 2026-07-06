import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app import models
from backend.app.routes.auth_routes import router as auth_router

print("DATABASE_URL =", settings.DATABASE_URL)
from backend.app.routes.job_routes import router as job_router
from backend.app.routes.resume_routes import router as resume_router
from backend.app.routes.recommendation_routes import router as recommendation_router
from backend.app.routes.ai_routes import router as ai_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI-Powered Job Recommendation Assistant",
    version="0.1.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Automatically create the upload directory at startup
    upload_dir = os.path.join(settings.BASE_DIR, "backend", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    # Create database tables if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Initialize Qdrant collection and sync Postgres jobs to Qdrant
    from backend.app.services import init_qdrant_collection, sync_db_jobs_to_qdrant
    from backend.app.database import AsyncSessionLocal
    
    init_qdrant_collection()
    async with AsyncSessionLocal() as session:
        await sync_db_jobs_to_qdrant(session)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV
    }

# Register all routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(job_router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resume_router, prefix="/api/resumes", tags=["Resume"])
app.include_router(recommendation_router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Verification"])


