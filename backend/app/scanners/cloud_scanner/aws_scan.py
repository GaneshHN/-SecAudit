"""SecAudit — Cloud Scanner: AWS Security Audit"""
from ...utils.logger import get_logger
from ...config import get_settings
logger = get_logger("scanner.aws")

async def scan_aws() -> dict:
    """Audit AWS resources for security issues."""
    settings = get_settings()
    vulnerabilities = []
    if not settings.AWS_ACCESS_KEY_ID:
        return {"scanner": "aws", "vulnerabilities": [], "count": 0, "status": "not_configured",
                "error": "AWS credentials not configured"}
    try:
        import boto3
        session = boto3.Session(aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY, region_name=settings.AWS_REGION)
        # S3 — public buckets
        s3 = session.client("s3")
        for bucket in s3.list_buckets().get("Buckets", []):
            try:
                acl = s3.get_bucket_acl(Bucket=bucket["Name"])
                for grant in acl.get("Grants", []):
                    uri = grant.get("Grantee", {}).get("URI", "")
                    if "AllUsers" in uri or "AuthenticatedUsers" in uri:
                        vulnerabilities.append({
                            "name": f"Public S3 Bucket: {bucket['Name']}", "severity": "Critical", "cvss": 9.0,
                            "description": f"S3 bucket '{bucket['Name']}' is publicly accessible.",
                            "remediation": "Remove public access. Enable S3 Block Public Access.", "scanner": "AWS Scanner"})
            except Exception:
                continue
        # Security Groups — open to world
        ec2 = session.client("ec2")
        for sg in ec2.describe_security_groups().get("SecurityGroups", []):
            for rule in sg.get("IpPermissions", []):
                for ip_range in rule.get("IpRanges", []):
                    if ip_range.get("CidrIp") == "0.0.0.0/0":
                        port = rule.get("FromPort", "all")
                        vulnerabilities.append({
                            "name": f"Open Security Group: {sg['GroupId']} port {port}", "severity": "High", "cvss": 7.5,
                            "description": f"Security group {sg['GroupId']} allows 0.0.0.0/0 on port {port}.",
                            "remediation": "Restrict to specific IP ranges.", "scanner": "AWS Scanner"})
        return {"scanner": "aws", "vulnerabilities": vulnerabilities, "count": len(vulnerabilities), "status": "completed"}
    except ImportError:
        return {"scanner": "aws", "vulnerabilities": [], "count": 0, "status": "unavailable", "error": "boto3 not installed"}
    except Exception as e:
        return {"scanner": "aws", "vulnerabilities": [], "count": 0, "status": "error", "error": str(e)}
