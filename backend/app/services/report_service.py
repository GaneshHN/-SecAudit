"""SecAudit — Services: Report Service"""
from ..reports.pdf_generator import generate_pdf_report
from ..reports.json_export import generate_json_report
from ..reports.html_report import generate_html_report
from ..utils.logger import get_logger
logger = get_logger("services.report")

async def generate_report(scan_data: dict, format: str = "json") -> dict:
    """Generate a report in the specified format."""
    if format == "pdf":
        content = await generate_pdf_report(scan_data)
        return {"format": "pdf", "content": content, "content_type": "application/pdf", "filename": "secaudit_report.pdf"}
    elif format == "html":
        content = await generate_html_report(scan_data)
        return {"format": "html", "content": content, "content_type": "text/html", "filename": "secaudit_report.html"}
    else:
        content = await generate_json_report(scan_data)
        return {"format": "json", "content": content, "content_type": "application/json", "filename": "secaudit_report.json"}
