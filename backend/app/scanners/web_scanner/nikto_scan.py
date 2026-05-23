"""SecAudit — Web Scanner: Nikto Integration"""

import asyncio
import re
from ...utils.logger import get_logger
from ...config import get_settings

logger = get_logger("scanner.nikto")


async def run_nikto_scan(target_url: str) -> dict:
    """Run Nikto web server scanner."""
    settings = get_settings()
    nikto = settings.NIKTO_PATH

    try:
        cmd = [nikto, "-h", target_url, "-Format", "csv", "-nointeractive", "-timeout", "30"]
        logger.info("Nikto scan starting: %s", target_url)

        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)

        vulnerabilities = []
        for line in stdout.decode().strip().split("\n"):
            parts = line.split('","')
            if len(parts) >= 4:
                desc = parts[-1].strip('"') if parts else ""
                vulnerabilities.append({
                    "name": desc[:100],
                    "severity": "Medium",
                    "cvss": 5.0,
                    "description": desc,
                    "url": target_url,
                    "scanner": "Nikto",
                    "remediation": "Review and fix the identified server configuration issue.",
                })

        logger.info("Nikto complete: %d findings", len(vulnerabilities))
        return {"scanner": "nikto", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except FileNotFoundError:
        logger.warning("Nikto not installed")
        return {"scanner": "nikto", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "unavailable", "error": "Nikto not installed"}
    except Exception as e:
        logger.error("Nikto error: %s", e)
        return {"scanner": "nikto", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
