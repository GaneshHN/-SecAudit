"""SecAudit — Web Scanner: Nuclei Integration"""

import asyncio
import json
from ...utils.logger import get_logger
from ...config import get_settings

logger = get_logger("scanner.nuclei")


async def run_nuclei_scan(target_url: str, templates: str = "cves,vulnerabilities,misconfiguration") -> dict:
    """Run Nuclei vulnerability scanner against a target."""
    settings = get_settings()
    nuclei = settings.NUCLEI_PATH

    try:
        cmd = [nuclei, "-u", target_url, "-t", templates, "-jsonl", "-silent", "-timeout", "30"]
        logger.info("Nuclei scan starting: %s", target_url)

        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)

        vulnerabilities = []
        for line in stdout.decode().strip().split("\n"):
            if not line:
                continue
            try:
                finding = json.loads(line)
                vulnerabilities.append({
                    "name": finding.get("info", {}).get("name", "Unknown"),
                    "severity": finding.get("info", {}).get("severity", "unknown").capitalize(),
                    "cvss": _severity_to_cvss(finding.get("info", {}).get("severity", "")),
                    "description": finding.get("info", {}).get("description", ""),
                    "url": finding.get("matched-at", target_url),
                    "template_id": finding.get("template-id", ""),
                    "tags": finding.get("info", {}).get("tags", []),
                    "reference": finding.get("info", {}).get("reference", []),
                    "remediation": finding.get("info", {}).get("remediation", ""),
                    "scanner": "Nuclei",
                })
            except json.JSONDecodeError:
                continue

        logger.info("Nuclei scan complete: %d findings", len(vulnerabilities))
        return {"scanner": "nuclei", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except FileNotFoundError:
        logger.warning("Nuclei not installed at: %s", nuclei)
        return {"scanner": "nuclei", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "unavailable", "error": "Nuclei not installed"}
    except asyncio.TimeoutError:
        logger.warning("Nuclei scan timed out")
        return {"scanner": "nuclei", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "timeout"}
    except Exception as e:
        logger.error("Nuclei error: %s", e)
        return {"scanner": "nuclei", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}


def _severity_to_cvss(sev: str) -> float:
    return {"critical": 9.5, "high": 8.0, "medium": 5.5, "low": 3.0, "info": 0.0}.get(sev.lower(), 0.0)
