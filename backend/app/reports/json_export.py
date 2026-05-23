"""SecAudit — Reports: JSON Export"""
import json
from datetime import datetime, timezone
from ..utils.logger import get_logger
logger = get_logger("reports.json")

async def generate_json_report(scan_data: dict) -> str:
    """Generate structured JSON vulnerability report."""
    report = {
        "report_metadata": {
            "tool": "SecAudit AI Vulnerability Scanner", "version": "2.0.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "target": scan_data.get("target", ""), "scan_type": scan_data.get("scan_type", ""),
        },
        "summary": {
            "score": scan_data.get("score", 0), "total_issues": scan_data.get("total_issues", 0),
            "critical": scan_data.get("summary", {}).get("critical", 0),
            "high": scan_data.get("summary", {}).get("high", 0),
            "medium": scan_data.get("summary", {}).get("medium", 0),
            "low": scan_data.get("summary", {}).get("low", 0),
        },
        "vulnerabilities": scan_data.get("vulnerabilities", []),
        "scanner_results": scan_data.get("scanner_results", []),
    }
    logger.info("JSON report generated: %d vulnerabilities", len(report["vulnerabilities"]))
    return json.dumps(report, indent=2, default=str)
