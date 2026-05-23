"""SecAudit — Web Scanner: OWASP ZAP Integration"""

import httpx
from typing import Optional
from ...utils.logger import get_logger
from ...config import get_settings

logger = get_logger("scanner.zap")


async def run_zap_scan(target_url: str, scan_type: str = "active") -> dict:
    """Run OWASP ZAP scan against a target URL."""
    settings = get_settings()
    base = settings.ZAP_API_URL
    api_key = settings.ZAP_API_KEY or ""

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            # Spider the target
            logger.info("ZAP spider starting: %s", target_url)
            spider = await client.get(f"{base}/JSON/spider/action/scan/",
                params={"url": target_url, "apikey": api_key})
            spider_id = spider.json().get("scan", "0")

            # Wait for spider to complete
            while True:
                status_resp = await client.get(f"{base}/JSON/spider/view/status/",
                    params={"scanId": spider_id, "apikey": api_key})
                if int(status_resp.json().get("status", "100")) >= 100:
                    break

            # Active scan
            if scan_type == "active":
                logger.info("ZAP active scan starting: %s", target_url)
                scan = await client.get(f"{base}/JSON/ascan/action/scan/",
                    params={"url": target_url, "apikey": api_key})
                scan_id = scan.json().get("scan", "0")

                while True:
                    status_resp = await client.get(f"{base}/JSON/ascan/view/status/",
                        params={"scanId": scan_id, "apikey": api_key})
                    if int(status_resp.json().get("status", "100")) >= 100:
                        break

            # Get alerts
            alerts_resp = await client.get(f"{base}/JSON/alert/view/alerts/",
                params={"baseurl": target_url, "apikey": api_key})
            alerts = alerts_resp.json().get("alerts", [])

            vulnerabilities = []
            for alert in alerts:
                vulnerabilities.append({
                    "name": alert.get("name", "Unknown"),
                    "risk": alert.get("risk", "Low"),
                    "severity": _map_risk(alert.get("risk", "Low")),
                    "cvss": _risk_to_cvss(alert.get("risk", "Low")),
                    "description": alert.get("description", ""),
                    "solution": alert.get("solution", ""),
                    "url": alert.get("url", target_url),
                    "evidence": alert.get("evidence", ""),
                    "cwe_id": alert.get("cweid", ""),
                    "scanner": "OWASP ZAP",
                })

            logger.info("ZAP scan complete: %d vulnerabilities", len(vulnerabilities))
            return {"scanner": "zap", "target": target_url, "vulnerabilities": vulnerabilities,
                    "count": len(vulnerabilities), "status": "completed"}

    except httpx.ConnectError:
        logger.warning("ZAP not available at %s", base)
        return {"scanner": "zap", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "unavailable", "error": "ZAP server not reachable"}
    except Exception as e:
        logger.error("ZAP scan error: %s", e)
        return {"scanner": "zap", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}


def _map_risk(risk: str) -> str:
    return {"High": "High", "Medium": "Medium", "Low": "Low", "Informational": "Info"}.get(risk, "Low")

def _risk_to_cvss(risk: str) -> float:
    return {"High": 8.5, "Medium": 5.5, "Low": 3.0, "Informational": 0.0}.get(risk, 0.0)
