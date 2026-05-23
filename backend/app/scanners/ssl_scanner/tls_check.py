"""SecAudit — SSL Scanner: TLS Version Check"""
import ssl, socket, asyncio
from ...utils.logger import get_logger
logger = get_logger("scanner.tls")

WEAK_PROTOCOLS = {ssl.PROTOCOL_TLSv1: "TLSv1.0", "TLSv1": "TLSv1.0", "TLSv1.1": "TLSv1.1"}

async def check_tls(hostname: str, port: int = 443) -> dict:
    """Check TLS version and configuration."""
    vulnerabilities = []
    try:
        def _check():
            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    version = ssock.version()
                    cipher = ssock.cipher()
                    cert = ssock.getpeercert()
                    return {"version": version, "cipher": cipher, "cert": cert}
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, _check)
        # Check TLS version
        if info["version"] in ("TLSv1", "TLSv1.0", "TLSv1.1"):
            vulnerabilities.append({
                "name": f"Weak TLS Version: {info['version']}", "severity": "High", "cvss": 7.5,
                "description": f"Server supports {info['version']} which has known vulnerabilities.",
                "remediation": "Disable TLSv1.0 and TLSv1.1. Enforce TLSv1.2+.", "scanner": "TLS Scanner"})
        return {"scanner": "tls_check", "target": f"{hostname}:{port}", "tls_version": info["version"],
                "cipher": info["cipher"], "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except Exception as e:
        return {"scanner": "tls_check", "target": f"{hostname}:{port}", "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
