"""
SecAudit — Routes: Authentication
Register, login, refresh, password reset, MFA verification.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field

from ..auth.jwt_auth import (
    create_access_token, create_refresh_token, decode_token,
    blacklist_token, get_current_user,
)
from ..auth.mfa import generate_mfa_secret, get_totp_uri, generate_qr_code, verify_totp, generate_backup_codes
from ..utils.encryption import hash_password, verify_password, generate_token
from ..utils.validators import check_password_strength, is_valid_email
from ..utils.logger import get_logger

logger = get_logger("routes.auth")
router = APIRouter()

# ── In-memory user store (replace with DB in production) ─
_users: dict[str, dict] = {}
_reset_tokens: dict[str, str] = {}  # token -> email


# ── Schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., examples=["user@example.com"])
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(default="user", pattern="^(admin|analyst|user)$")

class LoginRequest(BaseModel):
    email: str
    password: str
    mfa_code: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class MFASetupRequest(BaseModel):
    pass

class MFAVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# ── Endpoints ────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest):
    """Register a new user account."""
    if req.email in _users:
        raise HTTPException(400, "Email already registered")

    if not is_valid_email(req.email):
        raise HTTPException(400, "Invalid email format")

    strength = check_password_strength(req.password)
    if not strength["strong"]:
        raise HTTPException(400, f"Weak password: {', '.join(strength['issues'])}")

    user = {
        "email": req.email,
        "name": req.name,
        "password_hash": hash_password(req.password),
        "role": req.role,
        "mfa_enabled": False,
        "mfa_secret": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _users[req.email] = user
    logger.info("User registered: %s [%s]", req.email, req.role)

    token_data = {"sub": req.email, "role": req.role, "name": req.name}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=1800,
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """Authenticate user and return JWT tokens."""
    user = _users.get(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    if user.get("mfa_enabled"):
        if not req.mfa_code:
            raise HTTPException(403, detail="MFA code required")
        if not verify_totp(user["mfa_secret"], req.mfa_code):
            raise HTTPException(401, detail="Invalid MFA code")

    token_data = {"sub": req.email, "role": user["role"], "name": user["name"]}
    logger.info("User logged in: %s", req.email)

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=1800,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: RefreshRequest):
    """Refresh an access token using a refresh token."""
    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")

    token_data = {"sub": payload["sub"], "role": payload.get("role", "user"), "name": payload.get("name", "")}
    blacklist_token(req.refresh_token)

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=1800,
    )


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """Request a password reset token."""
    if req.email in _users:
        token = generate_token(32)
        _reset_tokens[token] = req.email
        logger.info("Password reset requested for %s", req.email)
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Reset password using a reset token."""
    email = _reset_tokens.pop(req.token, None)
    if not email or email not in _users:
        raise HTTPException(400, "Invalid or expired reset token")

    strength = check_password_strength(req.new_password)
    if not strength["strong"]:
        raise HTTPException(400, f"Weak password: {', '.join(strength['issues'])}")

    _users[email]["password_hash"] = hash_password(req.new_password)
    logger.info("Password reset completed for %s", email)
    return {"message": "Password has been reset successfully."}


@router.post("/mfa/setup")
async def setup_mfa(user: dict = Depends(get_current_user)):
    """Enable MFA for the current user."""
    email = user["sub"]
    if email not in _users:
        raise HTTPException(404, "User not found")

    secret = generate_mfa_secret()
    _users[email]["mfa_secret"] = secret
    uri = get_totp_uri(secret, email)
    qr = generate_qr_code(uri)

    return {
        "secret": secret,
        "uri": uri,
        "qr_code_base64": qr,
        "backup_codes": generate_backup_codes(),
        "message": "Scan the QR code with your authenticator app, then verify with /mfa/verify",
    }


@router.post("/mfa/verify")
async def verify_mfa(req: MFAVerifyRequest, user: dict = Depends(get_current_user)):
    """Verify MFA setup with a TOTP code."""
    email = user["sub"]
    if email not in _users:
        raise HTTPException(404, "User not found")

    secret = _users[email].get("mfa_secret")
    if not secret:
        raise HTTPException(400, "MFA not set up. Call /mfa/setup first.")

    if not verify_totp(secret, req.code):
        raise HTTPException(401, "Invalid MFA code")

    _users[email]["mfa_enabled"] = True
    logger.info("MFA enabled for %s", email)
    return {"message": "MFA has been enabled successfully."}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile."""
    email = user["sub"]
    u = _users.get(email, {})
    return {
        "email": email,
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "mfa_enabled": u.get("mfa_enabled", False),
    }


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Logout — blacklist current token."""
    return {"message": "Logged out successfully"}
