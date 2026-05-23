"""SecAudit — API Scanner: Authentication Bypass Detection"""

import httpx
from ...utils.logger import get_logger

logger = get_logger("scanner.auth_bypass")

BYPASS_HEADERS = [
    {"X-Original-URL": "/admin"},
    {"X-Rewrite-URL": "/admin"},
    {"X-Forwarded-For": "127.0.0.1"},
    {"X-Custom-IP-Authorization": "127.0.0.1"},
    {"X-Forwarded-Host": "localhost"},
]

ADMIN_PATHS = ["/admin", "/admin/", "/api/admin", "/dashboard", "/manage", "/internal", "/debug"]


async def scan_auth_bypass(target_url: str) -> dict:
    """Test for authentication bypass vulnerabilities."""
    vulnerabilities = []
    base = target_url.rstrip("/")

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=False, verify=False) as client:
            # Test admin paths without authentication
            for path in ADMIN_PATHS:
                try:
                    resp = await client.get(f"{base}{path}")
                    if resp.status_code == 200 and len(resp.text) > 100:
                        vulnerabilities.append({
                            "name": f"Unauthenticated Admin Access: {path}",
                            "severity": "Critical", "cvss": 9.0,
                            "description": f"Admin endpoint {path} is accessible without authentication.",
                            "url": f"{base}{path}",
                            "owasp": "A01:2021 - Broken Access Control",
                            "remediation": "Require authentication for all admin endpoints.",
                            "scanner": "Auth Bypass Scanner",
                        })
                except Exception:
                    continue

            # Test header-based bypasses
            for headers in BYPASS_HEADERS:
                try:
                    resp = await client.get(f"{base}/admin", headers=headers)
                    if resp.status_code == 200:
                        header_name = list(headers.keys())[0]
                        vulnerabilities.append({
                            "name": f"Header-Based Auth Bypass: {header_name}",
                            "severity": "High", "cvss": 8.0,
                            "description": f"Authentication bypassed using {header_name} header.",
                            "url": f"{base}/admin",
                            "remediation": "Do not rely on headers for authentication. Use proper auth middleware.",
                            "scanner": "Auth Bypass Scanner",
                        })
                except Exception:
                    continue

            # Test HTTP method override
            for method in ["PUT", "PATCH", "DELETE"]:
                try:
                    resp = await client.request(method, f"{base}/api/users")
                    if resp.status_code < 400:
                        vulnerabilities.append({
                            "name": f"Unrestricted HTTP Method: {method}",
                            "severity": "Medium", "cvss": 5.5,
                            "description": f"{method} method allowed on /api/users without authentication.",
                            "remediation": "Restrict HTTP methods and require auth on all API endpoints.",
                            "scanner": "Auth Bypass Scanner",
                        })
                except Exception:
                    continue

        logger.info("Auth bypass scan complete: %d findings", len(vulnerabilities))
        return {"scanner": "auth_bypass", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except Exception as e:
        logger.error("Auth bypass scanner error: %s", e)
        return {"scanner": "auth_bypass", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
