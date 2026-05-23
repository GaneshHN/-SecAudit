"""
SecAudit AI Vulnerability Scanner — Configuration
Pydantic BaseSettings with environment variable support.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "SecAudit AI Vulnerability Scanner"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    ENV: str = Field(default="development", description="development | staging | production")
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    LOG_LEVEL: str = "INFO"

    # ── Security ─────────────────────────────────────────
    SECRET_KEY: str = Field(default="change-me-in-production-use-openssl-rand-hex-32")
    JWT_SECRET: str = Field(default="change-me-jwt-secret-key-use-openssl-rand-hex-64")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: str = Field(default="0" * 64, description="64-char hex AES-256 key")
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── PostgreSQL ───────────────────────────────────────
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "secaudit"
    POSTGRES_PASSWORD: str = "secaudit_pass"
    POSTGRES_DB: str = "secaudit"
    DATABASE_URL: Optional[str] = None

    @property
    def pg_dsn(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def pg_dsn_sync(self) -> str:
        return self.pg_dsn.replace("+asyncpg", "")

    # ── MongoDB ──────────────────────────────────────────
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "secaudit"

    # ── Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None

    # ── Rate Limiting ────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10

    # ── External Scanners ────────────────────────────────
    ZAP_API_URL: str = "http://localhost:8080"
    ZAP_API_KEY: Optional[str] = None
    NUCLEI_PATH: str = "nuclei"
    NIKTO_PATH: str = "nikto"
    NMAP_PATH: str = "nmap"
    TRIVY_PATH: str = "trivy"
    SEMGREP_PATH: str = "semgrep"
    SONARQUBE_URL: str = "http://localhost:9000"
    SONARQUBE_TOKEN: Optional[str] = None
    MOBSF_URL: str = "http://localhost:8001"
    MOBSF_API_KEY: Optional[str] = None

    # ── AI Engine ────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    AI_PROVIDER: str = Field(default="openai", description="openai | ollama | local")

    # ── Cloud Credentials ────────────────────────────────
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AZURE_SUBSCRIPTION_ID: Optional[str] = None
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    GCP_PROJECT_ID: Optional[str] = None
    GCP_CREDENTIALS_PATH: Optional[str] = None

    # ── Alerts ───────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "noreply@secaudit.io"
    SLACK_WEBHOOK_URL: Optional[str] = None
    DISCORD_WEBHOOK_URL: Optional[str] = None

    # ── Celery ───────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
