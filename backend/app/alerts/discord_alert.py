"""SecAudit — Alerts: Discord Webhook"""
import httpx
from ..config import get_settings
from ..utils.logger import get_logger
logger = get_logger("alerts.discord")

async def send_discord_alert(scan_data: dict, webhook_url: str = None) -> bool:
    """Send scan alert to Discord via webhook."""
    settings = get_settings()
    url = webhook_url or settings.DISCORD_WEBHOOK_URL
    if not url:
        logger.warning("Discord webhook not configured")
        return False
    try:
        score = scan_data.get("score", 0)
        color = 0x22c55e if score >= 80 else 0xca8a04 if score >= 50 else 0xdc2626
        summary = scan_data.get("summary", {})
        fields = [
            {"name": "Score", "value": f"**{score}/100**", "inline": True},
            {"name": "Critical", "value": str(summary.get("critical", 0)), "inline": True},
            {"name": "High", "value": str(summary.get("high", 0)), "inline": True},
            {"name": "Medium", "value": str(summary.get("medium", 0)), "inline": True},
            {"name": "Low", "value": str(summary.get("low", 0)), "inline": True},
        ]
        top_vulns = scan_data.get("vulnerabilities", [])[:5]
        if top_vulns:
            vuln_text = "\n".join(f"• [{v.get('severity','')}] {v.get('name','')}" for v in top_vulns)
            fields.append({"name": "Top Issues", "value": vuln_text[:1024], "inline": False})
        payload = {"embeds": [{"title": f"🛡️ SecAudit Scan: {scan_data.get('target', 'N/A')}",
                               "color": color, "fields": fields}]}
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
        logger.info("Discord alert sent")
        return True
    except Exception as e:
        logger.error("Discord alert failed: %s", e)
        return False
