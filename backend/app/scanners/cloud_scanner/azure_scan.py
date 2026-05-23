"""SecAudit — Cloud Scanner: Azure Security Audit"""
from ...utils.logger import get_logger
from ...config import get_settings
logger = get_logger("scanner.azure")

async def scan_azure() -> dict:
    """Audit Azure resources for security issues."""
    settings = get_settings()
    if not settings.AZURE_SUBSCRIPTION_ID:
        return {"scanner": "azure", "vulnerabilities": [], "count": 0, "status": "not_configured",
                "error": "Azure credentials not configured"}
    try:
        from azure.identity import ClientSecretCredential
        from azure.mgmt.storage import StorageManagementClient
        credential = ClientSecretCredential(settings.AZURE_TENANT_ID, settings.AZURE_CLIENT_ID, settings.AZURE_CLIENT_SECRET)
        storage_client = StorageManagementClient(credential, settings.AZURE_SUBSCRIPTION_ID)
        vulnerabilities = []
        for account in storage_client.storage_accounts.list():
            if account.allow_blob_public_access:
                vulnerabilities.append({
                    "name": f"Public Blob Access: {account.name}", "severity": "High", "cvss": 8.0,
                    "description": f"Storage account '{account.name}' allows public blob access.",
                    "remediation": "Disable public blob access on the storage account.", "scanner": "Azure Scanner"})
            if not account.enable_https_traffic_only:
                vulnerabilities.append({
                    "name": f"HTTP Traffic Allowed: {account.name}", "severity": "Medium", "cvss": 5.5,
                    "description": f"Storage '{account.name}' allows HTTP (non-HTTPS) traffic.",
                    "remediation": "Enable HTTPS-only traffic.", "scanner": "Azure Scanner"})
        return {"scanner": "azure", "vulnerabilities": vulnerabilities, "count": len(vulnerabilities), "status": "completed"}
    except ImportError:
        return {"scanner": "azure", "vulnerabilities": [], "count": 0, "status": "unavailable", "error": "Azure SDK not installed"}
    except Exception as e:
        return {"scanner": "azure", "vulnerabilities": [], "count": 0, "status": "error", "error": str(e)}
