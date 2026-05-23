"""SecAudit — Code Scanner: Insecure Code Pattern Detection"""

import re
from pathlib import Path
from ...utils.logger import get_logger

logger = get_logger("scanner.insecure_code")

PATTERNS = [
    # Language-agnostic
    {"name": "eval() Usage", "pattern": r"\beval\s*\(", "severity": "High", "cvss": 8.0,
     "langs": {"py", "js", "ts", "rb", "php"}, "fix": "Avoid eval. Use safe parsing (JSON.parse, ast.literal_eval)."},
    {"name": "Command Injection Risk", "pattern": r"(?:os\.system|subprocess\.call|exec\(|child_process|shell_exec|system\()",
     "severity": "High", "cvss": 9.0, "langs": {"py", "js", "ts", "php", "rb", "c", "cpp"},
     "fix": "Use parameterized commands. Never pass user input to shell."},
    {"name": "Weak Cryptography (MD5/SHA1)", "pattern": r"(?:md5|sha1)\s*\(", "severity": "Medium", "cvss": 5.5,
     "langs": {"py", "js", "ts", "php", "java", "go", "rb"},
     "fix": "Use SHA-256 or better. Use bcrypt/scrypt/argon2 for passwords."},
    {"name": "Hardcoded Password", "pattern": r"(?i)password\s*=\s*['\"][^'\"]{4,}['\"]", "severity": "High", "cvss": 8.0,
     "langs": {"py", "js", "ts", "java", "php", "go", "rb"},
     "fix": "Use environment variables or a secrets manager."},
    {"name": "SQL String Concatenation", "pattern": r"(?:SELECT|INSERT|UPDATE|DELETE).*\+\s*(?:req\.|request\.|params|input)",
     "severity": "High", "cvss": 8.5, "langs": {"py", "js", "ts", "java", "php", "go", "rb"},
     "fix": "Use parameterized queries / prepared statements."},
    {"name": "Unsafe Deserialization", "pattern": r"(?:pickle\.loads|yaml\.load\(|unserialize\(|ObjectInputStream|JSON\.parse.*eval)",
     "severity": "High", "cvss": 8.0, "langs": {"py", "js", "java", "php", "rb"},
     "fix": "Use safe deserialization (yaml.safe_load, JSON.parse without eval)."},
    {"name": "Insecure Random", "pattern": r"(?:Math\.random|random\.random|rand\(\)|srand\()",
     "severity": "Medium", "cvss": 4.0, "langs": {"py", "js", "ts", "php", "c", "cpp", "rb"},
     "fix": "Use cryptographically secure random: secrets, crypto.randomBytes."},
    {"name": "Debug Mode Enabled", "pattern": r"(?:DEBUG\s*=\s*True|debug:\s*true|app\.debug)",
     "severity": "Medium", "cvss": 5.0, "langs": {"py", "js", "ts", "java", "rb"},
     "fix": "Disable debug mode in production."},
    {"name": "Insecure File Read", "pattern": r"(?:open\(.*\+|readFile.*\+|file_get_contents.*\$)",
     "severity": "Medium", "cvss": 6.0, "langs": {"py", "js", "ts", "php"},
     "fix": "Validate and sanitize file paths. Use path.resolve to prevent traversal."},
    {"name": "Buffer Overflow Risk", "pattern": r"(?:strcpy|strcat|sprintf|gets)\s*\(",
     "severity": "Critical", "cvss": 9.0, "langs": {"c", "cpp"},
     "fix": "Use safe alternatives: strncpy, strncat, snprintf, fgets."},
    {"name": "Format String Vulnerability", "pattern": r"printf\s*\([^\"]*\bvar\b",
     "severity": "High", "cvss": 8.0, "langs": {"c", "cpp"},
     "fix": "Always use format string: printf(\"%s\", var) instead of printf(var)."},
]

EXT_MAP = {".py": "py", ".js": "js", ".ts": "ts", ".tsx": "ts", ".jsx": "js",
           ".java": "java", ".go": "go", ".php": "php", ".rb": "rb", ".rs": "rs",
           ".c": "c", ".cpp": "cpp", ".h": "c", ".cs": "cs"}


async def scan_insecure_code(target_path: str) -> dict:
    """Scan source code for insecure patterns."""
    vulnerabilities = []
    scanned = 0
    skip_dirs = {"node_modules", ".git", "venv", "__pycache__", "dist", "build", "vendor"}

    try:
        root = Path(target_path)
        files = root.rglob("*") if root.is_dir() else [root]

        for filepath in files:
            if not filepath.is_file() or filepath.stat().st_size > 500_000:
                continue
            if any(d in filepath.parts for d in skip_dirs):
                continue

            ext = filepath.suffix.lower()
            lang = EXT_MAP.get(ext)
            if not lang:
                continue

            try:
                content = filepath.read_text(errors="ignore")
            except Exception:
                continue

            scanned += 1
            rel = str(filepath.relative_to(root)) if root.is_dir() else filepath.name

            for line_num, line in enumerate(content.split("\n"), 1):
                stripped = line.strip()
                if stripped.startswith(("//", "#", "/*", "*", "<!--")):
                    continue

                for pat in PATTERNS:
                    if lang not in pat["langs"]:
                        continue
                    if re.search(pat["pattern"], line, re.IGNORECASE):
                        vulnerabilities.append({
                            "name": pat["name"], "severity": pat["severity"], "cvss": pat["cvss"],
                            "description": f"{pat['name']} detected in {rel}:{line_num}",
                            "file": rel, "line": line_num,
                            "snippet": stripped[:120], "remediation": pat["fix"],
                            "scanner": "Insecure Code Scanner",
                        })

        logger.info("Insecure code scan: %d issues in %d files", len(vulnerabilities), scanned)
        return {"scanner": "insecure_code", "target": target_path, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "files_scanned": scanned, "status": "completed"}

    except Exception as e:
        logger.error("Insecure code scanner error: %s", e)
        return {"scanner": "insecure_code", "target": target_path, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
