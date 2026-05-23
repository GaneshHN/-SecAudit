"""SecAudit — Routes: Report Endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from ..auth.jwt_auth import get_current_user_optional
from ..services.report_service import generate_report
from ..utils.logger import get_logger
logger = get_logger("routes.report")
router = APIRouter()

class ReportRequest(BaseModel):
    scan_data: dict
    format: str = "json"  # json, html, pdf

@router.post("/reports/generate")
async def create_report(req: ReportRequest, user: dict = Depends(get_current_user_optional)):
    """Generate a scan report in the specified format."""
    try:
        result = await generate_report(req.scan_data, req.format)
        if req.format == "pdf":
            return Response(content=result["content"], media_type="application/pdf",
                          headers={"Content-Disposition": f"attachment; filename={result['filename']}"})
        elif req.format == "html":
            return Response(content=result["content"], media_type="text/html")
        return {"report": result["content"], "format": result["format"]}
    except Exception as e:
        raise HTTPException(500, f"Report generation failed: {e}")
