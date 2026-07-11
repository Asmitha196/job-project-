from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from backend.app.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True if settings.APP_ENV == "development" else False,
    future=True,
    connect_args={
        "statement_cache_size": 0,
    }
)

# Create session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Dependency to get database session in routers
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
