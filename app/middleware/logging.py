import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

logger = logging.getLogger("nexus_solo")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Request/response logging middleware."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        logger.info(f"[{request_id}] {request.method} {request.url.path}")

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 1)
        logger.info(f"[{request_id}] {response.status_code} ({duration_ms}ms)")

        response.headers["X-Request-ID"] = request_id
        return response
