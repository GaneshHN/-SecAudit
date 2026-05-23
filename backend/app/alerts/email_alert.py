"""SecAudit — Alerts: Email"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import get_settings
from ..utils.logger import get_logger
logger = get_logger("alerts.email")

async def send_email_alert(to: str, subject: str, scan_data: dict) -> bool:
    """Send email alert with scan results."""
    settings = get_settings()
    if not settings.SMTP_USER:
        logger.warning("Email not configured")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        score = scan_data.get("score", 0)
        total = scan_data.get("total_issues", 0)
        html = f"""<html><body style="font-family:sans-serif;background:#1a1a2e;color:#e2e8f0;padding:20px;">
        <h1 style="color:#818cf8;">🛡️ SecAudit Scan Alert</h1>
        <p>Target: <strong>{scan_data.get('target', 'N/A')}</strong></p>
        <p>Score: <strong style="color:{'#22c55e' if score >= 80 else '#dc2626'}">{score}/100</strong></p>
        <p>Issues Found: <strong>{total}</strong></p>
        <table style="border-collapse:collapse;width:100%;">
        <tr style="background:#2d2d5e;"><th style="padding:8px;">Severity</th><th>Issue</th></tr>"""
        for v in scan_data.get("vulnerabilities", [])[:10]:
            html += f"<tr><td style='padding:8px;'>{v.get('severity','')}</td><td>{v.get('name','')}</td></tr>"
        html += "</table></body></html>"
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email alert sent to %s", to)
        return True
    except Exception as e:
        logger.error("Email alert failed: %s", e)
        return False
