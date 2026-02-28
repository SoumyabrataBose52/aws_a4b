import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import get_settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory sliding window rate limiter.
    
    Enforces X requests per hour per API key.
    Swappable to ElastiCache Redis or API Gateway throttling later.
    """

    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.settings = get_settings()

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for docs and health
        if request.url.path in ["/docs", "/openapi.json", "/redoc", "/api/v1/system/health"]:
            return await call_next(request)

        api_key = request.headers.get("X-API-Key", "anonymous")
        now = time.time()
        window = 3600  # 1 hour

        # Clean old entries
        self.requests[api_key] = [
            t for t in self.requests[api_key] if now - t < window
        ]

        if len(self.requests[api_key]) >= self.settings.RATE_LIMIT_PER_HOUR:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {self.settings.RATE_LIMIT_PER_HOUR} requests per hour.",
            )

        self.requests[api_key].append(now)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.settings.RATE_LIMIT_PER_HOUR)
        response.headers["X-RateLimit-Remaining"] = str(
            self.settings.RATE_LIMIT_PER_HOUR - len(self.requests[api_key])
        )
        return response
