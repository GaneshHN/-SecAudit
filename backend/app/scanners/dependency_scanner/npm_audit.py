"""SecAudit — Dependency Scanner: npm audit"""
import asyncio, json
from ...utils.logger import get_logger
logger = get_logger("scanner.npm")

async def run_npm_audit(target_path: str) -> dict:
    """Run npm audit on a Node.js project."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "npm", "audit", "--json", "--production", cwd=target_path,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=120)
        data = json.loads(stdout.decode()) if stdout else {}
        vulnerabilities = []
        for name, advisory in data.get("vulnerabilities", {}).items():
            vulnerabilities.append({
                "name": f"CVE in {name}", "severity": advisory.get("severity", "low").capitalize(),
                "cvss": {"critical": 9.5, "high": 8.0, "moderate": 5.5, "low": 3.0}.get(advisory.get("severity", ""), 3.0),
                "package": name, "description": advisory.get("title", ""),
                "via": [str(v) if isinstance(v, str) else v.get("title", "") for v in advisory.get("via", [])],
                "fix_available": advisory.get("fixAvailable", False), "scanner": "npm audit",
            })
        return {"scanner": "npm_audit", "target": target_path, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}
    except FileNotFoundError:
        return {"scanner": "npm_audit", "target": target_path, "vulnerabilities": [], "count": 0,
                "status": "unavailable", "error": "npm not installed"}
    except Exception as e:
        return {"scanner": "npm_audit", "target": target_path, "vulnerabilities": [], "count": 0,
                "status": "error", "error": str(e)}
