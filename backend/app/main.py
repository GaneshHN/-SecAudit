"""
SecAudit AI Vulnerability Scanner — FastAPI Application
Production-grade entry point with middleware, lifecycle, and API versioning.
"""

import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import init_db, close_db, close_mongo, close_redis
from .utils.logger import setup_logging, new_correlation_id, get_logger

logger = get_logger("main")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Lifecycle
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    settings = get_settings()
    setup_logging(level=settings.LOG_LEVEL, json_output=settings.ENV == "production")
    logger.info("Starting %s v%s [%s]", settings.APP_NAME, settings.APP_VERSION, settings.ENV)

    # Initialize databases
    try:
        await init_db()
    except Exception as e:
        logger.warning("DB init warning: %s", e)

    yield

    # Shutdown
    logger.info("Shutting down...")
    await close_db()
    await close_mongo()
    await close_redis()
    logger.info("Shutdown complete")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# App Factory
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade AI-powered vulnerability scanning platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Middleware ───────────────────────────────────
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """Add correlation ID, timing, and security headers."""
    cid = new_correlation_id()
    start = time.perf_counter()

    response = await call_next(request)

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Correlation-ID"] = cid
    response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if elapsed_ms > 5000:
        logger.warning("Slow request: %s %s took %sms", request.method, request.url.path, elapsed_ms)

    return response


# ── Global Exception Handlers ───────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Resource not found", "path": str(request.url.path)})


@app.exception_handler(422)
async def validation_handler(request: Request, exc):
    return JSONResponse(status_code=422, content={"error": "Validation error", "details": str(exc)})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    logger.error("Internal server error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"error": "An unexpected error occurred"})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Health Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENV,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Register Routers (API v1)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

from .routes.auth_routes import router as auth_router
from .routes.scan_routes import router as scan_router
from .routes.report_routes import router as report_router
from .routes.webhook_routes import router as webhook_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(scan_router, prefix="/api/v1", tags=["Scanning"])
app.include_router(report_router, prefix="/api/v1", tags=["Reports"])
app.include_router(webhook_router, prefix="/api/v1", tags=["Webhooks"])


@app.get("/api/v1", tags=["System"])
async def api_root():
    """API v1 root — list available endpoints."""
    return {
        "api": "v1",
        "endpoints": {
            "auth": "/api/v1/auth",
            "scans": "/api/v1/scans",
            "reports": "/api/v1/reports",
            "webhooks": "/api/v1/webhooks",
            "health": "/health",
            "docs": "/docs",
        },
    }
