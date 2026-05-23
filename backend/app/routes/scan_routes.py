"""SecAudit — Routes: Scan Endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from ..auth.jwt_auth import get_current_user, get_current_user_optional
from ..services.scan_service import run_web_scan, run_code_scan
from ..services.ai_service import analyze_vulnerabilities
from ..utils.logger import get_logger

logger = get_logger("routes.scan")
router = APIRouter()

class WebScanRequest(BaseModel):
    target: str = Field(..., examples=["https://example.com"])
    scan_types: list[str] = Field(default=["headers", "xss", "sqli", "csrf", "api", "ssl"])
    ai_analysis: bool = False

class CodeScanRequest(BaseModel):
    target_path: str = Field(..., examples=["/path/to/project"])
    ai_analysis: bool = False

# ── Scan Endpoints ───────────────────────────────────────

@router.post("/scans/web")
async def start_web_scan(req: WebScanRequest, user: dict = Depends(get_current_user_optional)):
    """Start a web vulnerability scan."""
    logger.info("Web scan requested: %s by %s", req.target, user.get("sub", "anonymous") if user else "anonymous")
    try:
        results = await run_web_scan(req.target, req.scan_types)
        if req.ai_analysis:
            ai = await analyze_vulnerabilities(results["vulnerabilities"])
            results["vulnerabilities"] = ai["enriched_vulnerabilities"]
            results["ai_analysis"] = {"false_positives_removed": ai["false_positives_removed"]}
        return results
    except Exception as e:
        logger.error("Web scan failed: %s", e)
        raise HTTPException(500, f"Scan failed: {e}")

@router.post("/scans/code")
async def start_code_scan(req: CodeScanRequest, user: dict = Depends(get_current_user_optional)):
    """Start a code security scan (SAST)."""
    logger.info("Code scan requested: %s", req.target_path)
    try:
        results = await run_code_scan(req.target_path)
        if req.ai_analysis:
            ai = await analyze_vulnerabilities(results["vulnerabilities"])
            results["vulnerabilities"] = ai["enriched_vulnerabilities"]
        return results
    except Exception as e:
        logger.error("Code scan failed: %s", e)
        raise HTTPException(500, f"Scan failed: {e}")

@router.get("/scans/{scan_id}")
async def get_scan_result(scan_id: str, user: dict = Depends(get_current_user_optional)):
    """Get results of a completed scan (placeholder)."""
    return {"scan_id": scan_id, "status": "completed", "message": "Scan storage not yet implemented"}
