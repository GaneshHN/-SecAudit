"""SecAudit — Network Scanner: TCP Port Scanner"""
import asyncio
from ...utils.logger import get_logger
logger = get_logger("scanner.port")

COMMON_PORTS = [21,22,23,25,53,80,110,135,139,143,443,445,993,995,1433,1521,3306,3389,5432,5900,6379,8080,8443,9200,27017]

async def _check_port(host: str, port: int, timeout: float = 2.0) -> dict | None:
    try:
        _, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout=timeout)
        writer.close()
        await writer.wait_closed()
        return {"port": port, "state": "open"}
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        return None

async def scan_ports(target: str, ports: list[int] = None) -> dict:
    """Async TCP port scanner."""
    ports = ports or COMMON_PORTS
    try:
        tasks = [_check_port(target, p) for p in ports]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        open_ports = [r for r in results if r and isinstance(r, dict)]
        vulnerabilities = []
        for p in open_ports:
            sev = "High" if p["port"] in {21, 23, 445, 3389, 5900} else "Info"
            vulnerabilities.append({
                "name": f"Open Port: {p['port']}/tcp", "severity": sev,
                "cvss": 7.5 if sev == "High" else 0.0, "port": p["port"],
                "description": f"TCP port {p['port']} is open.", "scanner": "Port Scanner",
                "remediation": "Close unnecessary ports. Restrict via firewall." if sev == "High" else "",
            })
        return {"scanner": "port_scanner", "target": target, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "open_ports": [p["port"] for p in open_ports], "status": "completed"}
    except Exception as e:
        return {"scanner": "port_scanner", "target": target, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
