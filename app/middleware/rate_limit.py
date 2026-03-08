import json
import time
from collections import defaultdict
from starlette.types import ASGIApp, Receive, Scope, Send
from app.config import get_settings


class RateLimitMiddleware:
    """In-memory sliding window rate limiter (pure ASGI, no BaseHTTPMiddleware).

    Enforces X requests per hour per API key.
    Swappable to ElastiCache Redis or API Gateway throttling later.
    """

    def __init__(self, app: ASGIApp):
        self.app = app
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.settings = get_settings()

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "")

        # Skip rate limiting for docs, health, and CORS preflight
        if path in ["/docs", "/openapi.json", "/redoc", "/api/v1/system/health"]:
            await self.app(scope, receive, send)
            return
        if method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # Extract API key from headers
        headers = dict(scope.get("headers", []))
        api_key = headers.get(b"x-api-key", b"anonymous").decode()
        now = time.time()
        window = 3600  # 1 hour

        # Clean old entries
        self.requests[api_key] = [
            t for t in self.requests[api_key] if now - t < window
        ]

        if len(self.requests[api_key]) >= self.settings.RATE_LIMIT_PER_HOUR:
            # Return 429 directly as an ASGI response
            body = json.dumps({"detail": f"Rate limit exceeded. Maximum {self.settings.RATE_LIMIT_PER_HOUR} requests per hour."}).encode()
            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode()),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": body,
            })
            return

        self.requests[api_key].append(now)

        # Inject rate limit headers into the response
        remaining = self.settings.RATE_LIMIT_PER_HOUR - len(self.requests[api_key])

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-ratelimit-limit", str(self.settings.RATE_LIMIT_PER_HOUR).encode()))
                headers.append((b"x-ratelimit-remaining", str(remaining).encode()))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_wrapper)
