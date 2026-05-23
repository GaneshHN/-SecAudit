"""SecAudit — AI Engine: False Positive Filter"""
from ..utils.logger import get_logger
logger = get_logger("ai.fp_filter")

# Known false-positive patterns
FP_PATTERNS = [
    {"pattern": "test", "context": ["test/", "spec/", "__test__", "_test."], "reason": "Test file"},
    {"pattern": "example", "context": ["example/", "demo/", "sample/"], "reason": "Example code"},
    {"pattern": "comment", "context": ["//", "#", "/*"], "reason": "Commented code"},
    {"pattern": "minified", "context": [".min.js", ".min.css"], "reason": "Minified file"},
    {"pattern": "vendor", "context": ["vendor/", "node_modules/", "third_party/"], "reason": "Third-party code"},
]


async def filter_false_positives(vulnerabilities: list[dict]) -> dict:
    """Filter likely false positives from vulnerability results."""
    filtered = []
    removed = []

    for vuln in vulnerabilities:
        file_path = vuln.get("file", "").lower()
        snippet = vuln.get("snippet", "").lower()
        is_fp = False

        for fp in FP_PATTERNS:
            for ctx in fp["context"]:
                if ctx in file_path or ctx in snippet:
                    removed.append({**vuln, "fp_reason": fp["reason"]})
                    is_fp = True
                    break
            if is_fp:
                break

        if not is_fp:
            filtered.append(vuln)

    logger.info("FP filter: %d kept, %d removed", len(filtered), len(removed))
    return {
        "filtered_vulnerabilities": filtered,
        "removed_count": len(removed),
        "removed": removed[:10],  # Cap detail output
        "original_count": len(vulnerabilities),
        "filtered_count": len(filtered),
    }
