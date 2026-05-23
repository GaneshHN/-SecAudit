"""SecAudit — Docker Scanner: Kubernetes Security Audit"""
import httpx
from ...utils.logger import get_logger
logger = get_logger("scanner.k8s")

async def scan_kubernetes(api_url: str = "https://localhost:6443", token: str = None) -> dict:
    """Audit Kubernetes cluster for security issues."""
    vulnerabilities = []
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        async with httpx.AsyncClient(timeout=15, verify=False, headers=headers) as client:
            # Check unauthenticated access
            resp = await client.get(f"{api_url}/api/v1/namespaces")
            if resp.status_code == 200:
                vulnerabilities.append({
                    "name": "Unauthenticated K8s API Access", "severity": "Critical", "cvss": 10.0,
                    "description": "Kubernetes API is accessible without authentication.",
                    "remediation": "Enable RBAC. Restrict API access.", "scanner": "K8s Scanner"})
            # Check for exposed dashboard
            for path in ["/api/v1/namespaces/kubernetes-dashboard", "/dashboard"]:
                try:
                    r = await client.get(f"{api_url}{path}")
                    if r.status_code == 200:
                        vulnerabilities.append({
                            "name": "Exposed K8s Dashboard", "severity": "High", "cvss": 8.0,
                            "description": f"Kubernetes dashboard accessible at {path}.",
                            "remediation": "Restrict dashboard access. Use kubectl proxy.", "scanner": "K8s Scanner"})
                except Exception: continue
        return {"scanner": "kubernetes", "target": api_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except Exception as e:
        return {"scanner": "kubernetes", "target": api_url, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
