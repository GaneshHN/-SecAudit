"""SecAudit — SSL Scanner: Certificate Validator"""
import ssl, socket, asyncio
from datetime import datetime, timezone
from ...utils.logger import get_logger
logger = get_logger("scanner.cert")

async def validate_certificate(hostname: str, port: int = 443) -> dict:
    """Validate SSL certificate chain, expiration, and hostname match."""
    vulnerabilities = []
    try:
        def _check():
            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    return cert
        loop = asyncio.get_event_loop()
        cert = await loop.run_in_executor(None, _check)
        # Check expiration
        not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        days_left = (not_after - datetime.now(timezone.utc)).days
        if days_left < 0:
            vulnerabilities.append({
                "name": "Expired SSL Certificate", "severity": "Critical", "cvss": 9.0,
                "description": f"Certificate expired {abs(days_left)} days ago.",
                "remediation": "Renew the SSL certificate immediately.", "scanner": "Cert Validator"})
        elif days_left < 30:
            vulnerabilities.append({
                "name": "SSL Certificate Expiring Soon", "severity": "Medium", "cvss": 5.0,
                "description": f"Certificate expires in {days_left} days.",
                "remediation": "Renew the certificate before expiration.", "scanner": "Cert Validator"})
        # Check subject CN match
        cn = dict(x[0] for x in cert.get("subject", ()) if x).get("commonName", "")
        sans = [v for t, v in cert.get("subjectAltName", ()) if t == "DNS"]
        if hostname != cn and hostname not in sans and not any(hostname.endswith(s.replace("*.", ".")) for s in sans if s.startswith("*.")):
            vulnerabilities.append({
                "name": "Certificate Hostname Mismatch", "severity": "High", "cvss": 7.0,
                "description": f"Certificate CN '{cn}' doesn't match hostname '{hostname}'.",
                "remediation": "Obtain a certificate that covers the correct hostname.", "scanner": "Cert Validator"})
        return {"scanner": "cert_validator", "target": f"{hostname}:{port}", "cert_cn": cn,
                "expires": not_after.isoformat(), "days_remaining": days_left,
                "vulnerabilities": vulnerabilities, "count": len(vulnerabilities), "status": "completed"}
    except ssl.SSLCertVerificationError as e:
        vulnerabilities.append({"name": "SSL Verification Failed", "severity": "Critical", "cvss": 9.0,
            "description": str(e), "remediation": "Fix the certificate chain.", "scanner": "Cert Validator"})
        return {"scanner": "cert_validator", "target": f"{hostname}:{port}", "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except Exception as e:
        return {"scanner": "cert_validator", "target": f"{hostname}:{port}", "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
