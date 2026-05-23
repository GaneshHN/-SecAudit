"""SecAudit — Code Scanner: SonarQube Integration"""

import httpx
from ...utils.logger import get_logger
from ...config import get_settings

logger = get_logger("scanner.sonarqube")


async def run_sonarqube_scan(project_key: str) -> dict:
    """Fetch analysis results from SonarQube for a project."""
    settings = get_settings()

    try:
        base = settings.SONARQUBE_URL.rstrip("/")
        auth = (settings.SONARQUBE_TOKEN, "") if settings.SONARQUBE_TOKEN else None

        async with httpx.AsyncClient(timeout=30, auth=auth) as client:
            # Get issues
            resp = await client.get(f"{base}/api/issues/search",
                params={"componentKeys": project_key, "ps": 500, "statuses": "OPEN,CONFIRMED"})
            resp.raise_for_status()
            data = resp.json()

            vulnerabilities = []
            for issue in data.get("issues", []):
                vulnerabilities.append({
                    "name": issue.get("message", "Unknown Issue"),
                    "severity": _map_severity(issue.get("severity", "MINOR")),
                    "cvss": _severity_cvss(issue.get("severity", "MINOR")),
                    "type": issue.get("type", ""),
                    "file": issue.get("component", "").split(":")[-1],
                    "line": issue.get("line", 0),
                    "effort": issue.get("effort", ""),
                    "tags": issue.get("tags", []),
                    "scanner": "SonarQube",
                })

            logger.info("SonarQube: %d issues for %s", len(vulnerabilities), project_key)
            return {"scanner": "sonarqube", "target": project_key, "vulnerabilities": vulnerabilities,
                    "count": len(vulnerabilities), "status": "completed"}

    except httpx.ConnectError:
        logger.warning("SonarQube unavailable at %s", settings.SONARQUBE_URL)
        return {"scanner": "sonarqube", "target": project_key, "vulnerabilities": [],
                "count": 0, "status": "unavailable", "error": "SonarQube not reachable"}
    except Exception as e:
        logger.error("SonarQube error: %s", e)
        return {"scanner": "sonarqube", "target": project_key, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}


def _map_severity(s):
    return {"BLOCKER": "Critical", "CRITICAL": "High", "MAJOR": "Medium", "MINOR": "Low", "INFO": "Info"}.get(s, "Low")

def _severity_cvss(s):
    return {"BLOCKER": 9.5, "CRITICAL": 8.0, "MAJOR": 5.5, "MINOR": 3.0, "INFO": 1.0}.get(s, 3.0)
