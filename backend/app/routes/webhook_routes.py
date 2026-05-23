"""SecAudit — Routes: Webhook Endpoints"""
import hmac, hashlib
from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional
from ..services.scan_service import run_web_scan
from ..services.alert_service import send_alerts
from ..config import get_settings
from ..utils.logger import get_logger
logger = get_logger("routes.webhook")
router = APIRouter()

@router.post("/webhooks/github")
async def github_webhook(request: Request, x_hub_signature_256: Optional[str] = Header(None)):
    """Handle GitHub webhook events (push, PR) to trigger scans."""
    body = await request.body()
    settings = get_settings()
    # Verify signature if secret is configured
    if hasattr(settings, "GITHUB_WEBHOOK_SECRET") and settings.GITHUB_WEBHOOK_SECRET:
        expected = "sha256=" + hmac.new(settings.GITHUB_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, x_hub_signature_256 or ""):
            raise HTTPException(403, "Invalid signature")
    import json
    payload = json.loads(body)
    event = request.headers.get("X-GitHub-Event", "")
    if event == "push":
        repo_url = payload.get("repository", {}).get("html_url", "")
        if repo_url:
            logger.info("GitHub push webhook: scanning %s", repo_url)
            return {"status": "scan_queued", "repository": repo_url}
    return {"status": "ignored", "event": event}

@router.post("/webhooks/gitlab")
async def gitlab_webhook(request: Request, x_gitlab_token: Optional[str] = Header(None)):
    """Handle GitLab webhook events."""
    body = await request.body()
    import json
    payload = json.loads(body)
    event = payload.get("event_type", payload.get("object_kind", ""))
    if event == "push":
        repo_url = payload.get("project", {}).get("web_url", "")
        logger.info("GitLab push webhook: %s", repo_url)
        return {"status": "scan_queued", "repository": repo_url}
    return {"status": "ignored", "event": event}

@router.post("/webhooks/generic")
async def generic_webhook(request: Request):
    """Generic CI/CD webhook receiver."""
    body = await request.json()
    target = body.get("target", body.get("url", body.get("repository", "")))
    if not target:
        raise HTTPException(400, "No target URL provided")
    logger.info("Generic webhook: scanning %s", target)
    return {"status": "scan_queued", "target": target}
