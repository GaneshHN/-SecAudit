"""SecAudit — Dependency Scanner: pip-audit"""
import asyncio, json
from ...utils.logger import get_logger
logger = get_logger("scanner.pip")

async def run_pip_audit(target_path: str) -> dict:
    """Run pip-audit on Python requirements."""
    try:
        cmd = ["pip-audit", "--format", "json", "--requirement", f"{target_path}/requirements.txt"]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=120)
        data = json.loads(stdout.decode()) if stdout else {"dependencies": []}
        vulnerabilities = []
        for dep in data.get("dependencies", []):
            for vuln in dep.get("vulns", []):
                vulnerabilities.append({
                    "name": vuln.get("id", ""), "severity": "High", "cvss": 7.0,
                    "package": dep.get("name", ""), "installed_version": dep.get("version", ""),
                    "fixed_versions": vuln.get("fix_versions", []),
                    "description": vuln.get("description", ""), "scanner": "pip-audit",
                })
        return {"scanner": "pip_audit", "target": target_path, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except FileNotFoundError:
        return {"scanner": "pip_audit", "target": target_path, "vulnerabilities": [], "count": 0,
                "status": "unavailable", "error": "pip-audit not installed"}
    except Exception as e:
        return {"scanner": "pip_audit", "target": target_path, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
