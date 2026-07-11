import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base

# Import routers
from backend.app.routes.auth_routes import router as auth_router
from backend.app.routes.job_routes import router as job_router
from backend.app.routes.resume_routes import router as resume_router
from backend.app.routes.recommendation_routes import router as recommendation_router
from backend.app.routes.ai_routes import router as ai_router
from backend.app.routes.rag_routers import router as rag_router
from backend.app.routes.chatbot import router as chatbot_router
from backend.app.routes.s3_demo import router as s3_demo_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI-Powered Job Recommendation Assistant",
    version="0.1.0",
)


# -------------------------------------------------------
# CORS
# -------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------
# Startup
# -------------------------------------------------------

@app.on_event("startup")
async def startup_event():

    upload_dir = os.path.join(
        settings.BASE_DIR,
        "backend",
        "uploads",
    )

    os.makedirs(upload_dir, exist_ok=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Optional: Initialize Qdrant
    try:

        from backend.app.services import (
            init_qdrant_collection,
            sync_db_jobs_to_qdrant,
        )

        from backend.app.database import AsyncSessionLocal

        init_qdrant_collection()

        async with AsyncSessionLocal() as session:
            await sync_db_jobs_to_qdrant(session)

        print("Qdrant initialized successfully.")

    except Exception as e:

        print(f"Startup Warning: {e}")


# -------------------------------------------------------
# Health
# -------------------------------------------------------

@app.get("/health", tags=["Health"])
async def health_check():

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


# -------------------------------------------------------
# Register Routers
# -------------------------------------------------------

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    job_router,
    prefix="/api/jobs",
    tags=["Jobs"],
)

app.include_router(
    resume_router,
    prefix="/api/resumes",
    tags=["Resume"],
)

app.include_router(
    recommendation_router,
    prefix="/api/recommendations",
    tags=["Recommendations"],
)

app.include_router(
    ai_router,
    prefix="/api/ai",
    tags=["AI Verification"],
)

# Chatbot
app.include_router(chatbot_router)

# RAG
app.include_router(rag_router)
app.include_router(s3_demo_router)