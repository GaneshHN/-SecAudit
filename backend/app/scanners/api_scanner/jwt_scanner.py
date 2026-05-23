"""SecAudit — API Scanner: JWT Weakness Detection"""

import base64
import json
import httpx
from ...utils.logger import get_logger

logger = get_logger("scanner.jwt")

WEAK_ALGORITHMS = {"none", "HS256"}  # HS256 is weak when used with short secrets
KNOWN_WEAK_SECRETS = ["secret", "password", "123456", "changeme", "key", "jwt_secret", "admin"]


async def scan_jwt(target_url: str, token: str = None) -> dict:
    """Analyze JWT tokens for security weaknesses."""
    vulnerabilities = []

    try:
        # If no token provided, try to get one from the target
        if not token:
            async with httpx.AsyncClient(timeout=10, verify=False) as client:
                resp = await client.get(target_url)
                auth = resp.headers.get("authorization", "")
                if auth.startswith("Bearer "):
                    token = auth[7:]
                for cookie_header in resp.headers.get_list("set-cookie") if hasattr(resp.headers, 'get_list') else []:
                    if "eyJ" in cookie_header:
                        token = cookie_header.split("eyJ")[1].split(";")[0]
                        token = "eyJ" + token

        if not token:
            return {"scanner": "jwt_scanner", "target": target_url, "vulnerabilities": [],
                    "count": 0, "status": "completed", "message": "No JWT token found"}

        # Decode header
        parts = token.split(".")
        if len(parts) != 3:
            vulnerabilities.append({
                "name": "Malformed JWT", "severity": "Medium", "cvss": 5.0,
                "description": "Token does not have the expected 3-part structure.",
                "scanner": "JWT Scanner",
            })
            return _result(target_url, vulnerabilities)

        header = json.loads(base64.urlsafe_b64decode(parts[0] + "=="))
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + "=="))

        alg = header.get("alg", "")

        # Check: none algorithm
        if alg.lower() == "none":
            vulnerabilities.append({
                "name": "JWT None Algorithm", "severity": "Critical", "cvss": 9.8,
                "description": "JWT uses 'none' algorithm — no signature verification.",
                "remediation": "Reject tokens with 'none' algorithm. Enforce RS256 or ES256.",
                "owasp": "A02:2021", "scanner": "JWT Scanner",
            })

        # Check: weak algorithm
        if alg in ("HS256", "HS384"):
            vulnerabilities.append({
                "name": "Weak JWT Algorithm", "severity": "Medium", "cvss": 5.5,
                "description": f"JWT uses symmetric algorithm '{alg}'. Vulnerable to brute-force.",
                "remediation": "Use asymmetric algorithms (RS256, ES256) for better security.",
                "scanner": "JWT Scanner",
            })

        # Check: missing exp claim
        if "exp" not in payload:
            vulnerabilities.append({
                "name": "JWT Missing Expiration", "severity": "High", "cvss": 7.0,
                "description": "Token has no expiration claim. It never expires.",
                "remediation": "Always include 'exp' claim with a reasonable TTL.",
                "scanner": "JWT Scanner",
            })

        # Check: sensitive data in payload
        sensitive_keys = {"password", "secret", "ssn", "credit_card", "api_key"}
        found = sensitive_keys.intersection(set(k.lower() for k in payload.keys()))
        if found:
            vulnerabilities.append({
                "name": "Sensitive Data in JWT", "severity": "High", "cvss": 7.5,
                "description": f"JWT payload contains sensitive fields: {found}",
                "remediation": "Never store sensitive data in JWT payloads. JWTs are base64, not encrypted.",
                "scanner": "JWT Scanner",
            })

        # Check: try weak secrets (HS256 only)
        if alg.startswith("HS"):
            import hmac, hashlib
            sig_input = (parts[0] + "." + parts[1]).encode()
            sig_bytes = base64.urlsafe_b64decode(parts[2] + "==")
            for weak in KNOWN_WEAK_SECRETS:
                expected = hmac.new(weak.encode(), sig_input, hashlib.sha256).digest()
                if expected == sig_bytes:
                    vulnerabilities.append({
                        "name": "JWT Weak Signing Secret", "severity": "Critical", "cvss": 9.5,
                        "description": f"JWT signed with guessable secret: '{weak}'",
                        "remediation": "Use a strong, random secret (256+ bits). Use asymmetric keys.",
                        "scanner": "JWT Scanner",
                    })
                    break

        logger.info("JWT scan complete: %d findings", len(vulnerabilities))
        return _result(target_url, vulnerabilities)

    except Exception as e:
        logger.error("JWT scanner error: %s", e)
        return {"scanner": "jwt_scanner", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}


def _result(target, vulns):
    return {"scanner": "jwt_scanner", "target": target, "vulnerabilities": vulns,
            "count": len(vulns), "status": "completed"}
