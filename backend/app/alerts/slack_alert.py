"""SecAudit — Alerts: Slack Webhook"""
import httpx
from ..config import get_settings
from ..utils.logger import get_logger
logger = get_logger("alerts.slack")

async def send_slack_alert(scan_data: dict, webhook_url: str = None) -> bool:
    """Send scan alert to Slack via webhook with Block Kit formatting."""
    settings = get_settings()
    url = webhook_url or settings.SLACK_WEBHOOK_URL
    if not url:
        logger.warning("Slack webhook not configured")
        return False
    try:
        score = scan_data.get("score", 0)
        emoji = "🟢" if score >= 80 else "🟡" if score >= 50 else "🔴"
        summary = scan_data.get("summary", {})
        blocks = [
            {"type": "header", "text": {"type": "plain_text", "text": f"🛡️ SecAudit Scan Complete"}},
            {"type": "section", "fields": [
                {"type": "mrkdwn", "text": f"*Target:*\n{scan_data.get('target', 'N/A')}"},
                {"type": "mrkdwn", "text": f"*Score:*\n{emoji} {score}/100"},
                {"type": "mrkdwn", "text": f"*Critical:* {summary.get('critical', 0)}"},
                {"type": "mrkdwn", "text": f"*High:* {summary.get('high', 0)}"},
                {"type": "mrkdwn", "text": f"*Medium:* {summary.get('medium', 0)}"},
                {"type": "mrkdwn", "text": f"*Low:* {summary.get('low', 0)}"},
            ]},
        ]
        top = scan_data.get("vulnerabilities", [])[:5]
        if top:
            text = "\n".join(f"• `[{v.get('severity','')}]` {v.get('name','')}" for v in top)
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": f"*Top Issues:*\n{text}"}})
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={"blocks": blocks})
            resp.raise_for_status()
        logger.info("Slack alert sent")
        return True
    except Exception as e:
        logger.error("Slack alert failed: %s", e)
        return False
