"""
SecAudit AI Vulnerability Scanner — Database Connections
Async engines for PostgreSQL (SQLAlchemy), MongoDB (Motor), Redis (aioredis).
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings

logger = logging.getLogger("secaudit.database")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SQLAlchemy Async (PostgreSQL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all ORM models."""
    pass


_async_engine = None
_async_session_factory = None


def get_async_engine():
    """Get or create the async SQLAlchemy engine."""
    global _async_engine
    if _async_engine is None:
        settings = get_settings()
        try:
            _async_engine = create_async_engine(
                settings.pg_dsn,
                echo=settings.DEBUG,
                pool_size=20,
                max_overflow=10,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            logger.info("PostgreSQL async engine created")
        except Exception as e:
            logger.warning(f"PostgreSQL unavailable: {e}. Using SQLite fallback.")
            _async_engine = create_async_engine(
                "sqlite+aiosqlite:///./secaudit.db",
                echo=settings.DEBUG,
            )
    return _async_engine


def get_session_factory():
    """Get or create the async session factory."""
    global _async_session_factory
    if _async_session_factory is None:
        engine = get_async_engine()
        _async_session_factory = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
    return _async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async DB session."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Create all tables (call on startup)."""
    engine = get_async_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")


async def close_db():
    """Dispose engine (call on shutdown)."""
    global _async_engine, _async_session_factory
    if _async_engine:
        await _async_engine.dispose()
        _async_engine = None
        _async_session_factory = None
        logger.info("PostgreSQL engine disposed")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MongoDB Async (Motor)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_mongo_client = None
_mongo_db = None


async def get_mongo():
    """Get MongoDB database instance."""
    global _mongo_client, _mongo_db
    if _mongo_db is None:
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            settings = get_settings()
            _mongo_client = AsyncIOMotorClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=5000,
                maxPoolSize=50,
            )
            _mongo_db = _mongo_client[settings.MONGO_DB]
            # Verify connection
            await _mongo_client.admin.command("ping")
            logger.info("MongoDB connected")
        except Exception as e:
            logger.warning(f"MongoDB unavailable: {e}. Scan results will use PostgreSQL only.")
            _mongo_db = None
    return _mongo_db


async def close_mongo():
    """Close MongoDB connection."""
    global _mongo_client, _mongo_db
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        _mongo_db = None
        logger.info("MongoDB connection closed")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Redis Async
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_redis_client = None


async def get_redis():
    """Get Redis client instance."""
    global _redis_client
    if _redis_client is None:
        try:
            import redis.asyncio as aioredis
            settings = get_settings()
            _redis_client = aioredis.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD,
                decode_responses=True,
                max_connections=20,
            )
            await _redis_client.ping()
            logger.info("Redis connected")
        except Exception as e:
            logger.warning(f"Redis unavailable: {e}. Rate limiting and caching disabled.")
            _redis_client = None
    return _redis_client


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")
