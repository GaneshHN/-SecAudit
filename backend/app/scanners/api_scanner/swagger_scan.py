"""SecAudit — API Scanner: Swagger/OpenAPI Exposure Detection"""

import httpx
from ...utils.logger import get_logger

logger = get_logger("scanner.swagger")

SWAGGER_PATHS = [
    "/swagger.json", "/openapi.json", "/api-docs", "/swagger-ui.html",
    "/docs", "/redoc", "/swagger/", "/v2/api-docs", "/v3/api-docs",
    "/api/swagger.json", "/api/openapi.json", "/.well-known/openapi.yaml",
    "/graphql", "/graphiql", "/playground", "/altair",
]


async def scan_swagger_exposure(target_url: str) -> dict:
    """Check if API documentation is publicly exposed."""
    vulnerabilities = []

    try:
        base = target_url.rstrip("/")
        async with httpx.AsyncClient(timeout=10, follow_redirects=True, verify=False) as client:
            for path in SWAGGER_PATHS:
                try:
                    resp = await client.get(f"{base}{path}")
                    if resp.status_code == 200:
                        content_type = resp.headers.get("content-type", "").lower()
                        is_api_doc = (
                            "json" in content_type or "yaml" in content_type or
                            "swagger" in resp.text[:500].lower() or
                            "openapi" in resp.text[:500].lower() or
                            "graphql" in path.lower()
                        )

                        if is_api_doc or "graphql" in path.lower():
                            severity = "High" if "graphql" in path.lower() else "Medium"
                            vulnerabilities.append({
                                "name": f"Exposed API Documentation: {path}",
                                "severity": severity,
                                "cvss": 7.0 if severity == "High" else 5.0,
                                "description": f"API documentation is publicly accessible at {base}{path}",
                                "url": f"{base}{path}",
                                "owasp": "A01:2021 - Broken Access Control",
                                "remediation": "Restrict API documentation access to authenticated users in production.",
                                "scanner": "Swagger Scanner",
                            })
                except Exception:
                    continue

        # Check for GraphQL introspection
        try:
            async with httpx.AsyncClient(timeout=10, verify=False) as client:
                gql_resp = await client.post(
                    f"{base}/graphql",
                    json={"query": "{ __schema { types { name } } }"},
                    headers={"Content-Type": "application/json"},
                )
                if gql_resp.status_code == 200 and "__schema" in gql_resp.text:
                    vulnerabilities.append({
                        "name": "GraphQL Introspection Enabled",
                        "severity": "High", "cvss": 7.5,
                        "description": "GraphQL introspection is enabled, exposing the entire API schema.",
                        "url": f"{base}/graphql",
                        "remediation": "Disable introspection in production: introspection: false",
                        "scanner": "Swagger Scanner",
                    })
        except Exception:
            pass

        logger.info("Swagger scan complete: %d findings", len(vulnerabilities))
        return {"scanner": "swagger_scanner", "target": target_url, "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities), "status": "completed"}

    except Exception as e:
        logger.error("Swagger scanner error: %s", e)
        return {"scanner": "swagger_scanner", "target": target_url, "vulnerabilities": [],
                "count": 0, "status": "error", "error": str(e)}
