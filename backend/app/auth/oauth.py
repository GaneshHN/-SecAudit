"""
SecAudit — Authentication: OAuth2
OAuth2 login flows for GitHub and Google.
"""

import httpx
from typing import Optional
from ..config import get_settings
from ..utils.logger import get_logger

logger = get_logger("auth.oauth")


class OAuthProvider:
    """Base OAuth2 provider."""

    def __init__(self, name: str, client_id: str, client_secret: str,
                 authorize_url: str, token_url: str, userinfo_url: str, scopes: list[str]):
        self.name = name
        self.client_id = client_id
        self.client_secret = client_secret
        self.authorize_url = authorize_url
        self.token_url = token_url
        self.userinfo_url = userinfo_url
        self.scopes = scopes

    def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        """Generate OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            "response_type": "code",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.authorize_url}?{query}"

    async def exchange_code(self, code: str, redirect_uri: str) -> dict:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
                headers={"Accept": "application/json"},
                timeout=15,
            )
            response.raise_for_status()
            return response.json()

    async def get_user_info(self, access_token: str) -> dict:
        """Fetch user profile from the provider."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.userinfo_url,
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                timeout=10,
            )
            response.raise_for_status()
            return response.json()


# ── Provider Instances ───────────────────────────────────

def get_github_provider() -> Optional[OAuthProvider]:
    """GitHub OAuth provider."""
    settings = get_settings()
    client_id = getattr(settings, "GITHUB_CLIENT_ID", None)
    client_secret = getattr(settings, "GITHUB_CLIENT_SECRET", None)
    if not client_id or not client_secret:
        logger.info("GitHub OAuth not configured")
        return None
    return OAuthProvider(
        name="github",
        client_id=client_id,
        client_secret=client_secret,
        authorize_url="https://github.com/login/oauth/authorize",
        token_url="https://github.com/login/oauth/access_token",
        userinfo_url="https://api.github.com/user",
        scopes=["read:user", "user:email"],
    )


def get_google_provider() -> Optional[OAuthProvider]:
    """Google OAuth provider."""
    settings = get_settings()
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
    client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", None)
    if not client_id or not client_secret:
        logger.info("Google OAuth not configured")
        return None
    return OAuthProvider(
        name="google",
        client_id=client_id,
        client_secret=client_secret,
        authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        userinfo_url="https://www.googleapis.com/oauth2/v2/userinfo",
        scopes=["openid", "email", "profile"],
    )
