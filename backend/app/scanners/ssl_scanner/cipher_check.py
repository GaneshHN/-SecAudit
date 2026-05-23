"""SecAudit — SSL Scanner: Cipher Suite Analysis"""
import ssl, socket, asyncio
from ...utils.logger import get_logger
logger = get_logger("scanner.cipher")

WEAK_CIPHERS = {"RC4", "DES", "3DES", "NULL", "EXPORT", "anon", "MD5"}

async def check_ciphers(hostname: str, port: int = 443) -> dict:
    """Analyze cipher suites offered by the server."""
    vulnerabilities = []
    try:
        def _check():
            ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cipher_name, protocol, bits = ssock.cipher()
                    return {"cipher": cipher_name, "protocol": protocol, "bits": bits}
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, _check)
        cipher_upper = info["cipher"].upper()
        for weak in WEAK_CIPHERS:
            if weak.upper() in cipher_upper:
                vulnerabilities.append({
                    "name": f"Weak Cipher: {info['cipher']}", "severity": "High", "cvss": 7.0,
                    "description": f"Server uses weak cipher suite containing {weak}.",
                    "remediation": "Disable weak ciphers. Use AES-GCM or ChaCha20-Poly1305.", "scanner": "Cipher Scanner"})
        if info["bits"] and info["bits"] < 128:
            vulnerabilities.append({
                "name": f"Short Key Length: {info['bits']} bits", "severity": "High", "cvss": 7.0,
                "description": f"Cipher key length ({info['bits']} bits) is insufficient.",
                "remediation": "Use ciphers with 128-bit or 256-bit keys.", "scanner": "Cipher Scanner"})
        return {"scanner": "cipher_check", "target": f"{hostname}:{port}", "cipher": info,
                "vulnerabilities": vulnerabilities, "count": len(vulnerabilities), "status": "completed"}
    except Exception as e:
        return {"scanner": "cipher_check", "target": f"{hostname}:{port}", "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
