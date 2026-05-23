"""SecAudit — Docker Scanner: Container Image Scan (Trivy)"""
import asyncio, json
from ...utils.logger import get_logger
from ...config import get_settings
logger = get_logger("scanner.image")

async def scan_image(image_name: str) -> dict:
    """Scan a Docker image for vulnerabilities using Trivy."""
    settings = get_settings()
    try:
        cmd = [settings.TRIVY_PATH, "image", "--format", "json", "--severity", "CRITICAL,HIGH,MEDIUM", image_name]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=300)
        data = json.loads(stdout.decode()) if stdout else {}
        vulnerabilities = []
        for result in data.get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                vulnerabilities.append({
                    "name": vuln.get("VulnerabilityID", ""), "severity": vuln.get("Severity", "").capitalize(),
                    "cvss": vuln.get("CVSS", {}).get("nvd", {}).get("V3Score", 0.0),
                    "package": vuln.get("PkgName", ""), "installed": vuln.get("InstalledVersion", ""),
                    "fixed": vuln.get("FixedVersion", "N/A"), "description": vuln.get("Description", ""),
                    "scanner": "Trivy Image Scan"})
        return {"scanner": "image_scan", "target": image_name, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except FileNotFoundError:
        return {"scanner": "image_scan", "target": image_name, "vulnerabilities": [], "count": 0,
                "status": "unavailable", "error": "Trivy not installed"}
    except Exception as e:
        return {"scanner": "image_scan", "target": image_name, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
