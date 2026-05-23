"""
SecAudit — Authentication: MFA
TOTP-based multi-factor authentication with QR code generation.
"""

import base64
import io
import hmac
import hashlib
import struct
import time
import secrets
from typing import Optional

from ..utils.logger import get_logger

logger = get_logger("auth.mfa")


def generate_mfa_secret() -> str:
    """Generate a base32-encoded TOTP secret."""
    return base64.b32encode(secrets.token_bytes(20)).decode("utf-8").rstrip("=")


def get_totp_uri(secret: str, email: str, issuer: str = "SecAudit") -> str:
    """Generate otpauth:// URI for QR code scanning."""
    return f"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"


def generate_qr_code(uri: str) -> Optional[str]:
    """Generate QR code as base64 PNG. Returns None if qrcode lib not installed."""
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode()
    except ImportError:
        logger.warning("qrcode library not installed — QR generation disabled")
        return None


def _dynamic_truncate(hmac_digest: bytes) -> int:
    """HOTP dynamic truncation (RFC 4226)."""
    offset = hmac_digest[-1] & 0x0F
    code = struct.unpack(">I", hmac_digest[offset:offset + 4])[0]
    return (code & 0x7FFFFFFF) % 1_000_000


def generate_totp(secret: str, time_step: int = 30) -> str:
    """Generate current TOTP code."""
    key = base64.b32decode(secret.upper() + "=" * (-len(secret) % 8))
    counter = int(time.time()) // time_step
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    code = _dynamic_truncate(digest)
    return str(code).zfill(6)


def verify_totp(secret: str, code: str, window: int = 1) -> bool:
    """Verify a TOTP code (allows ±window time steps)."""
    for offset in range(-window, window + 1):
        key = base64.b32decode(secret.upper() + "=" * (-len(secret) % 8))
        counter = (int(time.time()) // 30) + offset
        msg = struct.pack(">Q", counter)
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        expected = str(_dynamic_truncate(digest)).zfill(6)
        if hmac.compare_digest(expected, code):
            return True
    return False


def generate_backup_codes(count: int = 8) -> list[str]:
    """Generate one-time backup codes."""
    return [secrets.token_hex(4).upper() for _ in range(count)]
