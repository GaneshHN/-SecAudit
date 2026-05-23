"""SecAudit — Web Scanner: CSRF Detector"""

import httpx
import re
from ...utils.logger import get_logger

logger = get_logger("scanner.csrf")


async def detect_csrf(target_url: str) -> dict:
    """Detect CSRF vulnerabilities by analyzing forms and cookies."""
    vulnerabilities = []

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, verify=False) as client:
            resp = await client.get(target_url, headers={"User-Agent": "SecAudit-Scanner/2.0"})
            body = resp.text
            headers = {k.lower(): v for k, v in resp.headers.items()}

            # Check forms for CSRF tokens
            forms = re.findall(r'<form[^>]*>(.*?)</form>', body, re.DOTALL | re.IGNORECASE)
            csrf_patterns = [r'csrf', r'_token', r'authenticity_token', r'__RequestVerificationToken', r'_csrf']

            for i, form in enumerate(forms):
                method_match = re.search(r'method=["\']?(post|put|delete)', form, re.IGNORECASE)
                if not method_match:
                    continue

                has_csrf = any(re.search(pat, form, re.IGNORECASE) for pat in csrf_patterns)
                if not has_csrf:
                    vulnerabilities.append({
                        "name": "Missing CSRF Token",
                        "severity": "High",
                        "cvss": 8.0,
                        "description": f"Form #{i+1} uses {method_match.group(1).upper()} method without a CSRF token.",
                        "url": target_url,
                        "owasp": "A01:2021 - Broken Access Control",
                        "remediation": "Add CSRF tokens to all state-changing forms. Use SameSite cookies.",
                        "scanner": "CSRF Detector",
                    })

            # Check SameSite cookie attribute
            cookies = resp.headers.get_list("set-cookie") if hasattr(resp.headers, 'get_list') else []
            if not cookies and "set-cookie" in headers:
                cookies = [headers["set-cookie"]]

            for cookie in cookies:
                if "samesite" not in cookie.lower():
                    name = cookie.split("=")[0].strip()
                    vulnerabilities.append({
                        "name": "Cookie Missing SameSite",
                        "severity": "Medium",
                        "cvss": 5.0,
                        "description": f"Cookie '{name}' lacks SameSite attribute, enabling CSRF.",
                        "url": target_url,
                        "remediation": "Set SameSite=Lax or SameSite=Strict on all cookies.",
                        "scanner": "CSRF Detector",
                    })

        logger.info("CSRF scan complete: %d findings", len(vulnerabilities))
        return {"scanner": "csrf_detector", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except Exception as e:
        logger.error("CSRF detector error: %s", e)
        return {"scanner": "csrf_detector", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
