"""SecAudit — Reports: PDF Generator"""
import io
from datetime import datetime, timezone
from ..utils.logger import get_logger
logger = get_logger("reports.pdf")

async def generate_pdf_report(scan_data: dict) -> bytes:
    """Generate a professional PDF vulnerability report."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []
        # Title
        elements.append(Paragraph("SecAudit Security Scan Report", styles["Title"]))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
        elements.append(Paragraph(f"Target: {scan_data.get('target', 'N/A')}", styles["Normal"]))
        elements.append(Paragraph(f"Score: {scan_data.get('score', 'N/A')}/100", styles["Normal"]))
        elements.append(Spacer(1, 20))
        # Summary table
        summary = scan_data.get("summary", {})
        summary_data = [["Severity", "Count"],
                        ["Critical", str(summary.get("critical", 0))], ["High", str(summary.get("high", 0))],
                        ["Medium", str(summary.get("medium", 0))], ["Low", str(summary.get("low", 0))],
                        ["Total", str(summary.get("total", 0))]]
        t = Table(summary_data, colWidths=[200, 100])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
        elements.append(t)
        elements.append(Spacer(1, 20))
        # Vulnerabilities
        for vuln in scan_data.get("vulnerabilities", [])[:50]:
            elements.append(Paragraph(f"<b>[{vuln.get('severity', '')}] {vuln.get('name', '')}</b>", styles["Heading3"]))
            elements.append(Paragraph(vuln.get("description", ""), styles["Normal"]))
            if vuln.get("remediation"):
                elements.append(Paragraph(f"<i>Fix: {vuln['remediation']}</i>", styles["Normal"]))
            elements.append(Spacer(1, 10))
        doc.build(elements)
        buffer.seek(0)
        return buffer.read()
    except ImportError:
        logger.warning("reportlab not installed — generating text fallback")
        return _text_report(scan_data).encode()

def _text_report(data: dict) -> str:
    lines = [f"SecAudit Security Report", f"Target: {data.get('target', 'N/A')}", f"Score: {data.get('score', 'N/A')}/100", ""]
    for v in data.get("vulnerabilities", []):
        lines.append(f"[{v.get('severity','')}] {v.get('name','')} — {v.get('description','')}")
    return "\n".join(lines)
