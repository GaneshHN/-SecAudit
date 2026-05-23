"""SecAudit — Services: Alert Service"""
import asyncio
from ..alerts.email_alert import send_email_alert
from ..alerts.discord_alert import send_discord_alert
from ..alerts.slack_alert import send_slack_alert
from ..utils.logger import get_logger
logger = get_logger("services.alert")

async def send_alerts(scan_data: dict, channels: list[str] = None, email_to: str = None) -> dict:
    """Send scan alerts to configured channels."""
    channels = channels or ["discord", "slack"]
    results = {}
    tasks = []
    if "email" in channels and email_to:
        tasks.append(("email", send_email_alert(email_to, f"SecAudit Scan: {scan_data.get('target', 'N/A')}", scan_data)))
    if "discord" in channels:
        tasks.append(("discord", send_discord_alert(scan_data)))
    if "slack" in channels:
        tasks.append(("slack", send_slack_alert(scan_data)))

    for name, coro in tasks:
        try:
            results[name] = await coro
        except Exception as e:
            logger.error("Alert %s failed: %s", name, e)
            results[name] = False

    logger.info("Alerts sent: %s", results)
    return results
