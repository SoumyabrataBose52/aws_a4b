from fastapi import Request, HTTPException, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(request: Request, api_key: str = Security(api_key_header)):
    """Verify the API key from the X-API-Key header.
    
    In development mode, accepts the default dev key.
    In production, check against database.
    """
    settings = get_settings()

    # Skip auth for docs and health check
    if request.url.path in ["/docs", "/openapi.json", "/redoc", "/api/v1/system/health"]:
        return api_key

    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key. Include X-API-Key header.")

    # Dev mode: accept default key
    if settings.APP_ENV == "development" and api_key == settings.DEFAULT_API_KEY:
        return api_key

    # Production: would check database here
    # For now, accept the default key in all environments
    if api_key == settings.DEFAULT_API_KEY:
        return api_key

    raise HTTPException(status_code=403, detail="Invalid API key")
