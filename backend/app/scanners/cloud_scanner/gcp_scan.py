"""SecAudit — Cloud Scanner: GCP Security Audit"""
from ...utils.logger import get_logger
from ...config import get_settings
logger = get_logger("scanner.gcp")

async def scan_gcp() -> dict:
    """Audit GCP resources for security issues."""
    settings = get_settings()
    if not settings.GCP_PROJECT_ID:
        return {"scanner": "gcp", "vulnerabilities": [], "count": 0, "status": "not_configured",
                "error": "GCP credentials not configured"}
    try:
        from google.cloud import storage as gcs
        client = gcs.Client(project=settings.GCP_PROJECT_ID)
        vulnerabilities = []
        for bucket in client.list_buckets():
            policy = bucket.get_iam_policy(requested_policy_version=3)
            for binding in policy.bindings:
                if "allUsers" in binding.get("members", []) or "allAuthenticatedUsers" in binding.get("members", []):
                    vulnerabilities.append({
                        "name": f"Public GCS Bucket: {bucket.name}", "severity": "Critical", "cvss": 9.0,
                        "description": f"GCS bucket '{bucket.name}' grants access to allUsers.",
                        "remediation": "Remove allUsers/allAuthenticatedUsers from bucket IAM.", "scanner": "GCP Scanner"})
        return {"scanner": "gcp", "vulnerabilities": vulnerabilities, "count": len(vulnerabilities), "status": "completed"}
    except ImportError:
        return {"scanner": "gcp", "vulnerabilities": [], "count": 0, "status": "unavailable", "error": "GCP SDK not installed"}
    except Exception as e:
        return {"scanner": "gcp", "vulnerabilities": [], "count": 0, "status": "error", "error": str(e)}
