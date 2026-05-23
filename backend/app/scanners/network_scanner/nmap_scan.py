"""SecAudit — Network Scanner: Nmap Integration"""
import asyncio, re
from ...utils.logger import get_logger
from ...config import get_settings
logger = get_logger("scanner.nmap")

async def run_nmap_scan(target: str, ports: str = "1-1024", scan_type: str = "-sV") -> dict:
    """Run Nmap scan with service version detection."""
    settings = get_settings()
    try:
        cmd = [settings.NMAP_PATH, scan_type, "-p", ports, "--open", "-oX", "-", target]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=300)
        output = stdout.decode()
        vulnerabilities = []
        # Parse XML output for open ports
        for match in re.finditer(r'<port protocol="(\w+)" portid="(\d+)".*?<state state="open".*?'
                                  r'(?:<service name="([^"]*)".*?product="([^"]*)".*?version="([^"]*)")?', output, re.DOTALL):
            proto, port, service, product, version = match.groups()
            vuln = {"name": f"Open Port: {port}/{proto}", "severity": "Info", "cvss": 0.0,
                    "port": int(port), "protocol": proto, "service": service or "unknown",
                    "product": product or "", "version": version or "",
                    "description": f"Port {port}/{proto} is open running {service or 'unknown'}",
                    "scanner": "Nmap"}
            # Flag high-risk ports
            if int(port) in {21, 23, 445, 3389, 5900}:
                vuln["severity"] = "High"
                vuln["cvss"] = 7.5
                vuln["description"] += " — high-risk service"
                vuln["remediation"] = "Close or restrict access to this port."
            vulnerabilities.append(vuln)
        return {"scanner": "nmap", "target": target, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except FileNotFoundError:
        return {"scanner": "nmap", "target": target, "vulnerabilities": [], "count": 0,
                "status": "unavailable", "error": "Nmap not installed"}
    except Exception as e:
        return {"scanner": "nmap", "target": target, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
