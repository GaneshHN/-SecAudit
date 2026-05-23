"""
SecAudit — Utilities: Validators
URL, file, IP, and input validation helpers.
"""

import re
import ipaddress
from urllib.parse import urlparse
from typing import Optional


# ── URL Validation ───────────────────────────────────────

_URL_REGEX = re.compile(
    r"^https?://"
    r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}\.?|"
    r"localhost|"
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
    r"(?::\d+)?"
    r"(?:/?|[/?]\S+)$",
    re.IGNORECASE,
)


def is_valid_url(url: str) -> bool:
    """Check if a string is a valid HTTP/HTTPS URL."""
    if not url or len(url) > 2048:
        return False
    return bool(_URL_REGEX.match(url))


def sanitize_url(url: str) -> Optional[str]:
    """Sanitize and normalize a URL."""
    url = url.strip()
    if not url:
        return None
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.hostname:
        return None
    return url


# ── IP Validation ────────────────────────────────────────

def is_valid_ip(ip: str) -> bool:
    """Validate IPv4 or IPv6 address."""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def is_private_ip(ip: str) -> bool:
    """Check if an IP address is private/internal."""
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False


# ── Input Sanitization ──────────────────────────────────

_DANGEROUS_CHARS = re.compile(r"[<>\"';\\]")
_CMD_INJECTION = re.compile(r"[;&|`$(){}]")


def sanitize_input(text: str, max_length: int = 1024) -> str:
    """Strip dangerous characters from user input."""
    text = text[:max_length].strip()
    text = _DANGEROUS_CHARS.sub("", text)
    return text


def is_safe_command_input(text: str) -> bool:
    """Check that input doesn't contain command injection characters."""
    return not bool(_CMD_INJECTION.search(text))


# ── File Validation ──────────────────────────────────────

ALLOWED_SCAN_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".php",
    ".c", ".cpp", ".h", ".cs", ".rs", ".swift", ".kt",
    ".html", ".htm", ".xml", ".json", ".yaml", ".yml", ".toml",
    ".sh", ".bash", ".ps1", ".bat", ".cmd",
    ".sql", ".env", ".tf", ".hcl",
    ".dockerfile", ".dockerignore", ".gitignore",
    ".zip", ".tar", ".gz", ".tgz",
    ".apk", ".ipa",
}

MAX_FILE_SIZE_MB = 500


def is_allowed_file(filename: str) -> bool:
    """Check if a filename has an allowed extension."""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_SCAN_EXTENSIONS or filename.lower() in {"dockerfile", "makefile", "gemfile"}


def validate_file_size(size_bytes: int) -> bool:
    """Check if file size is within limits."""
    return 0 < size_bytes <= MAX_FILE_SIZE_MB * 1024 * 1024


# ── Email Validation ─────────────────────────────────────

_EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def is_valid_email(email: str) -> bool:
    """Validate email format."""
    return bool(_EMAIL_REGEX.match(email)) and len(email) <= 320


# ── Password Strength ────────────────────────────────────

def check_password_strength(password: str) -> dict:
    """Check password strength. Returns score and issues."""
    issues = []
    if len(password) < 8:
        issues.append("Must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        issues.append("Must contain uppercase letter")
    if not re.search(r"[a-z]", password):
        issues.append("Must contain lowercase letter")
    if not re.search(r"\d", password):
        issues.append("Must contain a digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        issues.append("Must contain a special character")

    score = max(0, 5 - len(issues))
    return {"score": score, "max_score": 5, "strong": score >= 4, "issues": issues}
