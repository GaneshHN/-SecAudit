"""
SecAudit AI Vulnerability Scanner — Utilities: Logger
Structured JSON logging with correlation IDs.
"""

import logging
import json
import sys
import uuid
from datetime import datetime, timezone
from contextvars import ContextVar

# Correlation ID for request tracing
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")


class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter for production."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        cid = correlation_id.get("")
        if cid:
            log_entry["correlation_id"] = cid

        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "extra_data"):
            log_entry["data"] = record.extra_data

        return json.dumps(log_entry)


class ConsoleFormatter(logging.Formatter):
    """Colored console formatter for development."""

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[1;31m",  # Bold Red
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        cid = correlation_id.get("")
        cid_str = f" [{cid[:8]}]" if cid else ""
        return (
            f"{color}{record.levelname:8s}{self.RESET}"
            f" {datetime.now().strftime('%H:%M:%S')}"
            f"{cid_str} {record.name}: {record.getMessage()}"
        )


def setup_logging(level: str = "INFO", json_output: bool = False):
    """Configure application logging."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers
    for handler in root.handlers[:]:
        root.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter() if json_output else ConsoleFormatter())
    root.addHandler(handler)

    # Suppress noisy libraries
    for lib in ["urllib3", "httpcore", "httpx", "asyncio", "aiosqlite"]:
        logging.getLogger(lib).setLevel(logging.WARNING)

    logging.getLogger("secaudit").info("Logging initialized [%s]", level)


def get_logger(name: str) -> logging.Logger:
    """Get a named logger."""
    return logging.getLogger(f"secaudit.{name}")


def new_correlation_id() -> str:
    """Generate and set a new correlation ID."""
    cid = uuid.uuid4().hex
    correlation_id.set(cid)
    return cid
