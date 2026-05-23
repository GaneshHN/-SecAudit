"""SecAudit — Services: Scan Orchestrator"""
import asyncio
import time
from ..utils.logger import get_logger
from ..scanners.web_scanner.header_check import check_security_headers
from ..scanners.web_scanner.xss_detector import detect_xss
from ..scanners.web_scanner.sqli_detector import detect_sqli
from ..scanners.web_scanner.csrf_detector import detect_csrf
from ..scanners.api_scanner.swagger_scan import scan_swagger_exposure
from ..scanners.api_scanner.auth_bypass import scan_auth_bypass
from ..scanners.ssl_scanner.tls_check import check_tls
from ..scanners.ssl_scanner.cert_validator import validate_certificate
from ..scanners.ssl_scanner.cipher_check import check_ciphers
from ..scanners.code_scanner.secret_detector import detect_secrets
from ..scanners.code_scanner.insecure_code import scan_insecure_code

logger = get_logger("services.scan")


async def run_web_scan(target_url: str, scan_types: list[str] = None) -> dict:
    """Orchestrate all web security scanners against a target URL."""
    start = time.perf_counter()
    scan_types = scan_types or ["headers", "xss", "sqli", "csrf", "api", "ssl"]

    tasks = {}
    if "headers" in scan_types:
        tasks["headers"] = check_security_headers(target_url)
    if "xss" in scan_types:
        tasks["xss"] = detect_xss(target_url)
    if "sqli" in scan_types:
        tasks["sqli"] = detect_sqli(target_url)
    if "csrf" in scan_types:
        tasks["csrf"] = detect_csrf(target_url)
    if "api" in scan_types:
        tasks["swagger"] = scan_swagger_exposure(target_url)
        tasks["auth_bypass"] = scan_auth_bypass(target_url)
    if "ssl" in scan_types:
        try:
            from urllib.parse import urlparse
            hostname = urlparse(target_url if "://" in target_url else f"https://{target_url}").hostname
            if hostname:
                tasks["tls"] = check_tls(hostname)
                tasks["cert"] = validate_certificate(hostname)
                tasks["cipher"] = check_ciphers(hostname)
        except Exception:
            pass

    # Run all scanners concurrently
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    scanner_results = {}
    for name, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            scanner_results[name] = {"status": "error", "error": str(result), "vulnerabilities": []}
        else:
            scanner_results[name] = result

    # Aggregate vulnerabilities
    all_vulns = []
    for r in scanner_results.values():
        all_vulns.extend(r.get("vulnerabilities", []))

    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0, "total": len(all_vulns)}
    for v in all_vulns:
        sev = v.get("severity", "Info").lower()
        if sev in summary:
            summary[sev] += 1

    score = max(0, 100 - (summary["critical"] * 25 + summary["high"] * 15 + summary["medium"] * 8 + summary["low"] * 3))
    elapsed = round(time.perf_counter() - start, 2)

    return {
        "target": target_url, "scan_type": "web", "score": score, "scan_time": f"{elapsed}s",
        "summary": summary, "total_issues": len(all_vulns),
        "vulnerabilities": all_vulns, "scanner_results": scanner_results,
        "scanners_run": list(tasks.keys()),
    }


async def run_code_scan(target_path: str) -> dict:
    """Orchestrate code security scanners against a local path."""
    start = time.perf_counter()
    secrets_result, code_result = await asyncio.gather(
        detect_secrets(target_path), scan_insecure_code(target_path))

    all_vulns = secrets_result.get("vulnerabilities", []) + code_result.get("vulnerabilities", [])
    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": len(all_vulns)}
    for v in all_vulns:
        sev = v.get("severity", "Low").lower()
        if sev in summary:
            summary[sev] += 1

    score = max(0, 100 - (summary["critical"] * 25 + summary["high"] * 15 + summary["medium"] * 8 + summary["low"] * 3))
    elapsed = round(time.perf_counter() - start, 2)

    return {
        "target": target_path, "scan_type": "code", "score": score, "scan_time": f"{elapsed}s",
        "summary": summary, "total_issues": len(all_vulns), "vulnerabilities": all_vulns,
        "scanner_results": {"secrets": secrets_result, "insecure_code": code_result},
    }
