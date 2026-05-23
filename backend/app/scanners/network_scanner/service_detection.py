"""SecAudit — Network Scanner: Service Detection & Banner Grabbing"""
import asyncio
from ...utils.logger import get_logger
logger = get_logger("scanner.service")

SERVICE_PROBES = {22: b"", 21: b"", 80: b"GET / HTTP/1.0\r\nHost: target\r\n\r\n",
                  25: b"EHLO scanner\r\n", 110: b"", 143: b"", 3306: b""}

async def detect_service(host: str, port: int, timeout: float = 5.0) -> dict | None:
    """Connect to a port and grab the service banner."""
    try:
        reader, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout=timeout)
        probe = SERVICE_PROBES.get(port, b"")
        if probe:
            writer.write(probe)
            await writer.drain()
        banner = await asyncio.wait_for(reader.read(1024), timeout=3.0)
        writer.close()
        await writer.wait_closed()
        return {"port": port, "banner": banner.decode(errors="ignore").strip()[:200]}
    except Exception:
        return None

async def scan_services(target: str, ports: list[int] = None) -> dict:
    """Detect services running on open ports via banner grabbing."""
    ports = ports or [21, 22, 25, 80, 110, 143, 443, 3306, 5432, 8080]
    try:
        tasks = [detect_service(target, p) for p in ports]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        services = [r for r in results if r and isinstance(r, dict)]
        vulnerabilities = []
        for svc in services:
            banner = svc["banner"]
            vuln = {"name": f"Service on port {svc['port']}", "severity": "Info", "cvss": 0.0,
                    "port": svc["port"], "banner": banner, "scanner": "Service Detection"}
            # Check for version disclosure in banner
            if any(c.isdigit() for c in banner) and len(banner) > 5:
                vuln["severity"] = "Low"
                vuln["cvss"] = 2.5
                vuln["description"] = f"Service version disclosed in banner: {banner[:80]}"
                vuln["remediation"] = "Suppress version info in service banners."
            vulnerabilities.append(vuln)
        return {"scanner": "service_detection", "target": target, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "services": services, "status": "completed"}
    except Exception as e:
        return {"scanner": "service_detection", "target": target, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
