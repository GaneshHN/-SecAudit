"""SecAudit — Code Scanner: Semgrep Integration"""

import asyncio
import json
from ...utils.logger import get_logger
from ...config import get_settings

logger = get_logger("scanner.semgrep")


async def run_semgrep_scan(target_path: str, rules: str = "auto") -> dict:
    """Run Semgrep SAST scanner on a directory or file."""
    settings = get_settings()

    try:
        cmd = [settings.SEMGREP_PATH, "scan", "--json", "--config", rules,
               "--timeout", "60", "--max-target-bytes", "1000000", target_path]
        logger.info("Semgrep scan starting: %s", target_path)

        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)

        results = json.loads(stdout.decode()) if stdout else {}
        findings = results.get("results", [])

        vulnerabilities = []
        for f in findings:
            vulnerabilities.append({
                "name": f.get("check_id", "unknown").split(".")[-1],
                "severity": f.get("extra", {}).get("severity", "WARNING").capitalize(),
                "cvss": _sev_to_cvss(f.get("extra", {}).get("severity", "")),
                "description": f.get("extra", {}).get("message", ""),
                "file": f.get("path", ""),
                "line": f.get("start", {}).get("line", 0),
                "snippet": f.get("extra", {}).get("lines", ""),
                "remediation": f.get("extra", {}).get("fix", "Review and fix the identified issue."),
                "scanner": "Semgrep",
            })

        logger.info("Semgrep complete: %d findings", len(vulnerabilities))
        return {"scanner": "semgrep", "target": target_path, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except FileNotFoundError:
        logger.warning("Semgrep not installed")
        return {"scanner": "semgrep", "target": target_path, "vulnerabilities": [],
                "count": 0, "status": "unavailable", "error": "Semgrep not installed"}
    except Exception as e:
        logger.error("Semgrep error: %s", e)
        return {"scanner": "semgrep", "target": target_path, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}


def _sev_to_cvss(sev: str) -> float:
    return {"ERROR": 8.0, "WARNING": 5.5, "INFO": 2.0}.get(sev.upper(), 3.0)
