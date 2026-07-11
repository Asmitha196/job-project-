import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # App Settings
    BASE_DIR: Path = BASE_DIR
    APP_ENV: str = "development"
    APP_NAME: str = "AI-Powered Job Recommendation Assistant"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database Settings
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/job_recommendation_db"

    # Security Settings
    JWT_SECRET_KEY: str = "your_super_secret_jwt_key_here"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI Service Settings
    GROQ_API_KEY: str = "your_groq_api_key_here"
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant"
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str | None = None
    EMBEDDINGS_MODEL_NAME: str = "sentence-transformers/all-mpnet-base-v2"

    # Configure env file reading from the root workspace directory
    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings(_env_file=os.path.join(BASE_DIR, ".env"))

print("========================================")
print("DATABASE_URL =", settings.DATABASE_URL)
print("GROQ_API_KEY =", settings.GROQ_API_KEY)
print("========================================")
