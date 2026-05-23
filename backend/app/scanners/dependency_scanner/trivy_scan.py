"""SecAudit — Dependency Scanner: Trivy Integration"""
import asyncio, json
from ...utils.logger import get_logger
from ...config import get_settings
logger = get_logger("scanner.trivy")

async def run_trivy_scan(target_path: str, scan_type: str = "fs") -> dict:
    """Run Trivy vulnerability scanner."""
    settings = get_settings()
    try:
        cmd = [settings.TRIVY_PATH, scan_type, "--format", "json", "--severity", "CRITICAL,HIGH,MEDIUM,LOW", target_path]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=300)
        data = json.loads(stdout.decode()) if stdout else {}
        vulnerabilities = []
        for result in data.get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                vulnerabilities.append({
                    "name": vuln.get("VulnerabilityID", ""), "severity": vuln.get("Severity", "").capitalize(),
                    "cvss": vuln.get("CVSS", {}).get("nvd", {}).get("V3Score", 0.0),
                    "package": vuln.get("PkgName", ""), "installed_version": vuln.get("InstalledVersion", ""),
                    "fixed_version": vuln.get("FixedVersion", ""), "description": vuln.get("Description", ""),
                    "url": vuln.get("PrimaryURL", ""), "scanner": "Trivy",
                })
        return {"scanner": "trivy", "target": target_path, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except FileNotFoundError:
        return {"scanner": "trivy", "target": target_path, "vulnerabilities": [], "count": 0,
                "status": "unavailable", "error": "Trivy not installed"}
    except Exception as e:
        return {"scanner": "trivy", "target": target_path, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
