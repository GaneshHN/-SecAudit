"""
SecAudit — Utilities: Encryption
AES-256-GCM encryption, bcrypt hashing, secure token generation.
"""

import hashlib
import hmac
import os
import base64
import secrets
from typing import Optional

# ── Bcrypt Password Hashing ──────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash."""
    import bcrypt
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ── AES-256-GCM Encryption ──────────────────────────────

def encrypt_aes(plaintext: str, key_hex: str) -> str:
    """Encrypt with AES-256-GCM. Returns base64(nonce + ciphertext + tag)."""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key = bytes.fromhex(key_hex)
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt_aes(encrypted_b64: str, key_hex: str) -> str:
    """Decrypt AES-256-GCM. Expects base64(nonce + ciphertext + tag)."""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key = bytes.fromhex(key_hex)
    data = base64.b64decode(encrypted_b64)
    nonce, ciphertext = data[:12], data[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None).decode()


# ── Token Generation ─────────────────────────────────────

def generate_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)


def generate_otp(digits: int = 6) -> str:
    """Generate a numeric OTP."""
    return "".join(str(secrets.randbelow(10)) for _ in range(digits))


# ── HMAC Signing ─────────────────────────────────────────

def hmac_sign(message: str, secret: str) -> str:
    """Create HMAC-SHA256 signature."""
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def hmac_verify(message: str, signature: str, secret: str) -> bool:
    """Verify HMAC-SHA256 signature (constant-time)."""
    expected = hmac_sign(message, secret)
    return hmac.compare_digest(expected, signature)
