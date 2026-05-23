"""SecAudit — Docker Scanner: Docker Security Audit"""
import asyncio, json
from ...utils.logger import get_logger
logger = get_logger("scanner.docker")

async def scan_docker() -> dict:
    """Audit Docker daemon for security issues."""
    vulnerabilities = []
    try:
        # Check Docker info
        proc = await asyncio.create_subprocess_exec("docker", "info", "--format", "{{json .}}",
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
        info = json.loads(stdout.decode()) if stdout else {}
        # Check for running root containers
        proc2 = await asyncio.create_subprocess_exec("docker", "ps", "--format", "{{json .}}",
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout2, _ = await asyncio.wait_for(proc2.communicate(), timeout=15)
        for line in stdout2.decode().strip().split("\n"):
            if not line: continue
            try:
                container = json.loads(line)
                # Check for privileged containers
                name = container.get("Names", "unknown")
                inspect_proc = await asyncio.create_subprocess_exec("docker", "inspect", name, "--format", "{{.HostConfig.Privileged}}",
                    stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
                inspect_out, _ = await inspect_proc.communicate()
                if "true" in inspect_out.decode().lower():
                    vulnerabilities.append({
                        "name": f"Privileged Container: {name}", "severity": "Critical", "cvss": 9.5,
                        "description": f"Container '{name}' runs in privileged mode.",
                        "remediation": "Remove --privileged flag. Use specific capabilities instead.", "scanner": "Docker Scanner"})
            except Exception: continue
        return {"scanner": "docker", "vulnerabilities": vulnerabilities, "count": len(vulnerabilities), "status": "completed"}
    except FileNotFoundError:
        return {"scanner": "docker", "vulnerabilities": [], "count": 0, "status": "unavailable", "error": "Docker not available"}
    except Exception as e:
        return {"scanner": "docker", "vulnerabilities": [], "count": 0, "status": "error", "error": str(e)}
