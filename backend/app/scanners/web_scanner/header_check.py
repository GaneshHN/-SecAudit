"""SecAudit — Web Scanner: Security Header Analysis"""

import httpx
from ...utils.logger import get_logger

logger = get_logger("scanner.headers")

SECURITY_HEADERS = {
    "strict-transport-security": {
        "name": "Missing HSTS", "severity": "High", "cvss": 7.5,
        "owasp": "A05:2021", "fix": "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"},
    "content-security-policy": {
        "name": "Missing CSP", "severity": "Medium", "cvss": 5.5,
        "owasp": "A05:2021", "fix": "Add: Content-Security-Policy: default-src 'self'"},
    "x-content-type-options": {
        "name": "Missing X-Content-Type-Options", "severity": "Medium", "cvss": 4.5,
        "owasp": "A05:2021", "fix": "Add: X-Content-Type-Options: nosniff"},
    "x-frame-options": {
        "name": "Missing X-Frame-Options", "severity": "Medium", "cvss": 5.0,
        "owasp": "A05:2021", "fix": "Add: X-Frame-Options: DENY"},
    "x-xss-protection": {
        "name": "Missing X-XSS-Protection", "severity": "Low", "cvss": 3.0,
        "owasp": "A05:2021", "fix": "Add: X-XSS-Protection: 1; mode=block"},
    "referrer-policy": {
        "name": "Missing Referrer-Policy", "severity": "Low", "cvss": 2.0,
        "owasp": "A05:2021", "fix": "Add: Referrer-Policy: strict-origin-when-cross-origin"},
    "permissions-policy": {
        "name": "Missing Permissions-Policy", "severity": "Low", "cvss": 2.0,
        "owasp": "A05:2021", "fix": "Add: Permissions-Policy: camera=(), microphone=(), geolocation=()"},
}


async def check_security_headers(target_url: str) -> dict:
    """Check a URL for missing security headers."""
    vulnerabilities = []

    try:
        if not target_url.startswith("http"):
            target_url = "https://" + target_url

        async with httpx.AsyncClient(follow_redirects=True, timeout=15, verify=False) as client:
            resp = await client.get(target_url, headers={"User-Agent": "SecAudit-Scanner/2.0"})
            headers = {k.lower(): v for k, v in resp.headers.items()}

            for header_name, meta in SECURITY_HEADERS.items():
                if header_name not in headers:
                    vulnerabilities.append({
                        "name": meta["name"], "severity": meta["severity"], "cvss": meta["cvss"],
                        "description": f"The {header_name} header is missing from the response.",
                        "url": target_url, "owasp": meta["owasp"],
                        "remediation": meta["fix"], "scanner": "Header Check",
                    })

            # Check server version disclosure
            server = headers.get("server", "")
            if server and any(c.isdigit() for c in server):
                vulnerabilities.append({
                    "name": "Server Version Disclosed", "severity": "Low", "cvss": 2.5,
                    "description": f"Server header reveals: {server}",
                    "url": target_url, "remediation": "Remove version info from Server header.",
                    "scanner": "Header Check",
                })

            powered = headers.get("x-powered-by", "")
            if powered:
                vulnerabilities.append({
                    "name": "X-Powered-By Exposed", "severity": "Low", "cvss": 2.5,
                    "description": f"X-Powered-By: {powered}",
                    "url": target_url, "remediation": "Remove the X-Powered-By header.",
                    "scanner": "Header Check",
                })

        logger.info("Header check complete: %d issues for %s", len(vulnerabilities), target_url)
        return {"scanner": "header_check", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except Exception as e:
        logger.error("Header check error: %s", e)
        return {"scanner": "header_check", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
