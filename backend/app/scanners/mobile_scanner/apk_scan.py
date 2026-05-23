"""SecAudit — Mobile Scanner: APK Analysis"""
import httpx
from ...utils.logger import get_logger
from ...config import get_settings
logger = get_logger("scanner.apk")

async def scan_apk(file_path: str) -> dict:
    """Scan Android APK using MobSF API."""
    settings = get_settings()
    if not settings.MOBSF_API_KEY:
        return {"scanner": "apk_scan", "target": file_path, "vulnerabilities": [], "count": 0,
                "status": "not_configured", "error": "MobSF API key not configured"}
    try:
        base = settings.MOBSF_URL.rstrip("/")
        headers = {"Authorization": settings.MOBSF_API_KEY}
        async with httpx.AsyncClient(timeout=300) as client:
            # Upload
            with open(file_path, "rb") as f:
                resp = await client.post(f"{base}/api/v1/upload", headers=headers, files={"file": f})
            upload = resp.json()
            scan_hash = upload.get("hash", "")
            # Scan
            await client.post(f"{base}/api/v1/scan", headers=headers, data={"hash": scan_hash})
            # Get report
            report = await client.post(f"{base}/api/v1/report_json", headers=headers, data={"hash": scan_hash})
            data = report.json()
            vulnerabilities = []
            for finding in data.get("security_warnings", []):
                vulnerabilities.append({
                    "name": finding.get("title", ""), "severity": finding.get("severity", "Info").capitalize(),
                    "cvss": {"high": 8.0, "warning": 5.0, "info": 2.0}.get(finding.get("severity", "").lower(), 3.0),
                    "description": finding.get("description", ""), "scanner": "MobSF APK Scanner"})
            return {"scanner": "apk_scan", "target": file_path, "vulnerabilities": vulnerabilities,
                    "count": len(vulnerabilities), "status": "completed"}
    except Exception as e:
        return {"scanner": "apk_scan", "target": file_path, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
