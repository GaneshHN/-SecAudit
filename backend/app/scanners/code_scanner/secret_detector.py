"""SecAudit — Code Scanner: Secret Detector"""

import re
import math
import os
from pathlib import Path
from ...utils.logger import get_logger

logger = get_logger("scanner.secrets")

SECRET_PATTERNS = [
    ("AWS Access Key", r"AKIA[0-9A-Z]{16}", "Critical", 9.5),
    ("AWS Secret Key", r"(?i)aws_secret_access_key\s*[=:]\s*['\"]?([A-Za-z0-9/+=]{40})", "Critical", 9.5),
    ("GitHub Token", r"gh[ps]_[A-Za-z0-9_]{36,}", "Critical", 9.0),
    ("Generic API Key", r"(?i)(api[_-]?key|apikey)\s*[=:]\s*['\"]?([A-Za-z0-9_\-]{20,})", "High", 8.0),
    ("Private Key", r"-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----", "Critical", 9.5),
    ("JWT Token", r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}", "High", 7.5),
    ("Database URL", r"(?i)(postgres|mysql|mongodb)://[^\s'\"]+:[^\s'\"]+@", "Critical", 9.0),
    ("Password in Code", r"(?i)(password|passwd|pwd)\s*[=:]\s*['\"]([^'\"]{8,})['\"]", "High", 8.0),
    ("Slack Webhook", r"https://hooks\.slack\.com/services/[A-Za-z0-9/]+", "High", 7.0),
    ("Google API Key", r"AIza[0-9A-Za-z_-]{35}", "High", 7.5),
    ("Stripe Key", r"(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,}", "Critical", 9.0),
    ("SendGrid Key", r"SG\.[A-Za-z0-9_-]{22,}\.[A-Za-z0-9_-]{43,}", "High", 8.0),
    ("Twilio Key", r"SK[0-9a-fA-F]{32}", "High", 7.5),
    ("Heroku API Key", r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", "Medium", 5.0),
]


def _entropy(s: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not s:
        return 0
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    length = len(s)
    return -sum((count / length) * math.log2(count / length) for count in freq.values())


async def detect_secrets(target_path: str) -> dict:
    """Scan files for hardcoded secrets and high-entropy strings."""
    vulnerabilities = []
    scanned = 0

    try:
        root = Path(target_path)
        files = root.rglob("*") if root.is_dir() else [root]
        skip_dirs = {"node_modules", ".git", "venv", "__pycache__", "dist", "build"}

        for filepath in files:
            if not filepath.is_file():
                continue
            if any(d in filepath.parts for d in skip_dirs):
                continue
            if filepath.stat().st_size > 1_000_000:
                continue

            try:
                content = filepath.read_text(errors="ignore")
            except Exception:
                continue

            scanned += 1
            rel = str(filepath.relative_to(root)) if root.is_dir() else filepath.name

            for line_num, line in enumerate(content.split("\n"), 1):
                for name, pattern, severity, cvss in SECRET_PATTERNS:
                    if re.search(pattern, line):
                        vulnerabilities.append({
                            "name": f"Hardcoded Secret: {name}",
                            "severity": severity, "cvss": cvss,
                            "description": f"{name} detected in source code.",
                            "file": rel, "line": line_num,
                            "snippet": line.strip()[:120],
                            "owasp": "A02:2021 - Cryptographic Failures",
                            "remediation": "Use environment variables or a secrets manager. Never commit secrets.",
                            "scanner": "Secret Detector",
                        })
                        break

                # High entropy string detection
                tokens = re.findall(r'["\']([A-Za-z0-9+/=_-]{32,})["\']', line)
                for token in tokens:
                    if _entropy(token) > 4.5:
                        already = any(v["file"] == rel and v["line"] == line_num for v in vulnerabilities)
                        if not already:
                            vulnerabilities.append({
                                "name": "High-Entropy String (Possible Secret)",
                                "severity": "Medium", "cvss": 5.0,
                                "description": f"High-entropy string (entropy={_entropy(token):.1f}) found.",
                                "file": rel, "line": line_num,
                                "snippet": line.strip()[:120],
                                "remediation": "Review if this is a secret. Move to environment variables if so.",
                                "scanner": "Secret Detector",
                            })

        logger.info("Secret scan complete: %d secrets in %d files", len(vulnerabilities), scanned)
        return {"scanner": "secret_detector", "target": target_path, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "files_scanned": scanned, "status": "completed"}

    except Exception as e:
        logger.error("Secret detector error: %s", e)
        return {"scanner": "secret_detector", "target": target_path, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
