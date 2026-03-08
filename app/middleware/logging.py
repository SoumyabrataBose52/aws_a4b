import logging
import time
import uuid
from starlette.types import ASGIApp, Receive, Scope, Send


logger = logging.getLogger("nexus_solo")


class LoggingMiddleware:
    """Request/response logging middleware (pure ASGI, no BaseHTTPMiddleware)."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        path = scope.get("path", "")
        method = scope.get("method", "")

        logger.info(f"[{request_id}] {method} {path}")

        status_code = 0

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                # Inject X-Request-ID header
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode()))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_wrapper)

        duration_ms = round((time.time() - start_time) * 1000, 1)
        logger.info(f"[{request_id}] {status_code} ({duration_ms}ms)")
