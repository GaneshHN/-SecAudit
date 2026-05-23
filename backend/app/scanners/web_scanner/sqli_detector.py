"""SecAudit — Web Scanner: SQL Injection Detector"""

import httpx
import re
from ...utils.logger import get_logger

logger = get_logger("scanner.sqli")

SQLI_PAYLOADS = [
    "' OR '1'='1", "' OR '1'='1'--", "' UNION SELECT NULL--",
    "1; DROP TABLE users--", "' AND 1=1--", "' AND 1=2--",
    "admin'--", "1' ORDER BY 1--", "' OR 1=1#",
]

SQL_ERROR_PATTERNS = [
    r"you have an error in your sql syntax",
    r"unclosed quotation mark",
    r"microsoft ole db provider",
    r"mysql_fetch",
    r"pg_query",
    r"sqlite3\.OperationalError",
    r"ORA-\d{5}",
    r"SQL syntax.*MySQL",
    r"PostgreSQL.*ERROR",
    r"Warning.*\Wmysqli?\w*",
    r"SQLSTATE\[",
]


async def detect_sqli(target_url: str) -> dict:
    """Test for SQL injection vulnerabilities."""
    vulnerabilities = []

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, verify=False) as client:
            # Get baseline response
            base_resp = await client.get(target_url)
            base_len = len(base_resp.text)

            for payload in SQLI_PAYLOADS:
                test_urls = [
                    f"{target_url}?id={payload}",
                    f"{target_url}?q={payload}",
                    f"{target_url}?user={payload}",
                ]

                for test_url in test_urls:
                    try:
                        resp = await client.get(test_url)
                        body = resp.text.lower()

                        # Check for SQL error messages
                        for pattern in SQL_ERROR_PATTERNS:
                            if re.search(pattern, body, re.IGNORECASE):
                                vulnerabilities.append({
                                    "name": "SQL Injection (Error-Based)",
                                    "severity": "Critical",
                                    "cvss": 9.8,
                                    "description": f"SQL error message detected in response, indicating SQL injection vulnerability.",
                                    "url": test_url,
                                    "evidence": payload,
                                    "owasp": "A03:2021 - Injection",
                                    "remediation": "Use parameterized queries / prepared statements. Never concatenate user input into SQL.",
                                    "scanner": "SQLi Detector",
                                })
                                break

                        # Check for boolean-based (significant response length change)
                        if abs(len(resp.text) - base_len) > base_len * 0.3 and "1'='1" in payload:
                            vulnerabilities.append({
                                "name": "SQL Injection (Boolean-Based)",
                                "severity": "High",
                                "cvss": 8.5,
                                "description": "Significant response difference detected with boolean SQL payload.",
                                "url": test_url,
                                "evidence": payload,
                                "owasp": "A03:2021 - Injection",
                                "remediation": "Use parameterized queries. Implement input validation.",
                                "scanner": "SQLi Detector",
                            })
                    except Exception:
                        continue

        logger.info("SQLi scan complete: %d findings", len(vulnerabilities))
        return {"scanner": "sqli_detector", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except Exception as e:
        logger.error("SQLi detector error: %s", e)
        return {"scanner": "sqli_detector", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
