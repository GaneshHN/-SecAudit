"""SecAudit — Web Scanner: XSS Detector"""

import httpx
import html
from ...utils.logger import get_logger

logger = get_logger("scanner.xss")

XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
    '<svg onload=alert(1)>',
    "'-alert(1)-'",
    '"><script>alert(document.cookie)</script>',
    '<img src="x" onerror="alert(1)">',
    '<body onload=alert(1)>',
]


async def detect_xss(target_url: str) -> dict:
    """Test for reflected XSS by injecting payloads in URL parameters."""
    vulnerabilities = []

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, verify=False) as client:
            # Get the base page first
            base_resp = await client.get(target_url)

            for payload in XSS_PAYLOADS:
                test_urls = [
                    f"{target_url}?q={payload}",
                    f"{target_url}?search={payload}",
                    f"{target_url}?input={payload}",
                ]

                for test_url in test_urls:
                    try:
                        resp = await client.get(test_url)
                        body = resp.text

                        # Check if payload is reflected without encoding
                        if payload in body and html.escape(payload) not in body:
                            vulnerabilities.append({
                                "name": "Reflected XSS",
                                "severity": "High",
                                "cvss": 8.0,
                                "description": f"Reflected XSS detected. Payload reflected in response without encoding.",
                                "url": test_url,
                                "evidence": payload,
                                "owasp": "A03:2021 - Injection",
                                "remediation": "Encode all user input in HTML output. Use Content-Security-Policy.",
                                "scanner": "XSS Detector",
                            })
                            break  # One finding per payload is enough
                    except Exception:
                        continue

            # Check for DOM XSS indicators in the page source
            if base_resp.status_code == 200:
                dom_sinks = ["document.write(", "innerHTML", "eval(", "setTimeout(", "document.location"]
                dom_sources = ["location.hash", "location.search", "document.referrer", "window.name"]
                body_lower = base_resp.text.lower()

                for sink in dom_sinks:
                    if sink.lower() in body_lower:
                        for source in dom_sources:
                            if source.lower() in body_lower:
                                vulnerabilities.append({
                                    "name": "Potential DOM-based XSS",
                                    "severity": "Medium",
                                    "cvss": 6.0,
                                    "description": f"DOM sink '{sink}' found alongside source '{source}'.",
                                    "url": target_url,
                                    "owasp": "A03:2021 - Injection",
                                    "remediation": "Avoid using dangerous DOM APIs. Sanitize all dynamic content.",
                                    "scanner": "XSS Detector",
                                })
                                break

        logger.info("XSS scan complete: %d findings", len(vulnerabilities))
        return {"scanner": "xss_detector", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except Exception as e:
        logger.error("XSS detector error: %s", e)
        return {"scanner": "xss_detector", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
