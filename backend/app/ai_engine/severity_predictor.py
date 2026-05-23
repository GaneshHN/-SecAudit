"""SecAudit — AI Engine: Severity Predictor"""
import httpx
from ..config import get_settings
from ..utils.logger import get_logger
logger = get_logger("ai.severity")

async def predict_severity(vuln: dict) -> dict:
    """Predict CVSS score and severity using AI or heuristics."""
    settings = get_settings()
    try:
        if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            prompt = f"""As a security expert, predict the CVSS 3.1 score for:
Name: {vuln.get('name', '')}
Description: {vuln.get('description', '')}
Respond in JSON: {{"cvss": float, "severity": str, "justification": str}}"""
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post("https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={"model": settings.OPENAI_MODEL, "messages": [{"role": "user", "content": prompt}],
                          "response_format": {"type": "json_object"}, "temperature": 0.1})
                import json
                return json.loads(resp.json()["choices"][0]["message"]["content"])
        return _heuristic_severity(vuln)
    except Exception as e:
        logger.warning("AI severity prediction failed: %s", e)
        return _heuristic_severity(vuln)

def _heuristic_severity(vuln: dict) -> dict:
    name = vuln.get("name", "").lower()
    sev_map = {
        "critical": (9.5, "Critical"), "rce": (9.8, "Critical"), "sql injection": (9.0, "Critical"),
        "buffer overflow": (9.0, "Critical"), "high": (7.5, "High"), "xss": (7.0, "High"),
        "csrf": (6.5, "Medium"), "medium": (5.0, "Medium"), "header": (4.0, "Medium"),
        "low": (2.5, "Low"), "info": (0.0, "Info"),
    }
    for key, (cvss, sev) in sev_map.items():
        if key in name:
            return {"cvss": cvss, "severity": sev, "justification": f"Heuristic match on '{key}'"}
    return {"cvss": vuln.get("cvss", 5.0), "severity": vuln.get("severity", "Medium"), "justification": "Default score"}
