"""SecAudit — Services: AI Analysis Service"""
from ..ai_engine.vulnerability_classifier import classify_vulnerability
from ..ai_engine.severity_predictor import predict_severity
from ..ai_engine.false_positive_filter import filter_false_positives
from ..ai_engine.exploit_generator import generate_exploit_info
from ..utils.logger import get_logger
logger = get_logger("services.ai")

async def analyze_vulnerabilities(vulnerabilities: list[dict]) -> dict:
    """Run full AI analysis pipeline on vulnerabilities."""
    # Step 1: Filter false positives
    fp_result = await filter_false_positives(vulnerabilities)
    filtered = fp_result["filtered_vulnerabilities"]
    # Step 2: Classify and predict severity for top issues
    enriched = []
    for vuln in filtered[:50]:  # Cap AI calls
        try:
            classification = await classify_vulnerability(vuln)
            severity = await predict_severity(vuln)
            vuln["ai_classification"] = classification
            vuln["ai_severity"] = severity
        except Exception as e:
            logger.warning("AI enrichment failed for %s: %s", vuln.get("name", ""), e)
        enriched.append(vuln)
    # Add remaining without AI enrichment
    enriched.extend(filtered[50:])
    return {
        "enriched_vulnerabilities": enriched,
        "false_positives_removed": fp_result["removed_count"],
        "total_analyzed": len(enriched),
    }

async def get_exploit_details(vuln: dict) -> dict:
    """Get detailed exploit info and remediation for a single vulnerability."""
    return await generate_exploit_info(vuln)
