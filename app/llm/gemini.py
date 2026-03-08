import json
import asyncio
import logging
from typing import Optional
from google import genai
from google.genai import types
from app.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API provider using the new google-genai SDK."""

    def __init__(self, api_key: str, model_name: str = "gemini-3-flash-preview"):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        self.max_retries = 3
        self.base_delay = 15  # seconds — Gemini free tier has 15 RPM

    async def _call_with_retry(self, func, *args, **kwargs):
        """Call a function with exponential backoff retry on rate limit/availability errors."""
        for attempt in range(self.max_retries + 1):
            try:
                if asyncio.iscoroutinefunction(func) or hasattr(func, "__call__") and "aio.models" in str(func):
                    # We can assume client.aio methods are awaitable
                    return await func(*args, **kwargs)
                return await asyncio.get_event_loop().run_in_executor(None, lambda: func(*args, **kwargs))
            except Exception as e:
                error_str = str(e).lower()
                is_retriable = any(tok in error_str for tok in ["429", "503", "quota", "rate_limit", "resource_exhausted", "too many requests", "unavailable", "overloaded"])
                if is_retriable and attempt < self.max_retries:
                    delay = self.base_delay * (2 ** attempt)
                    logger.warning(f"Gemini rate limit hit, retrying in {delay}s (attempt {attempt + 1}/{self.max_retries})")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Gemini API error (attempt {attempt + 1}): {type(e).__name__}: {e}")
                    raise

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tier: Optional[str] = None,
    ) -> str:
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        if system_prompt:
            config.system_instruction = system_prompt

        response = await self._call_with_retry(
            self.client.aio.models.generate_content,
            model=self.model_name,
            contents=prompt,
            config=config,
        )
        return response.text

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        tier: Optional[str] = None,
    ) -> dict:
        json_system = "You are a helpful assistant. Respond ONLY with valid JSON. No markdown code fences, no explanation."
        if system_prompt:
            json_system = f"{system_prompt}\n\n{json_system}"

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
            system_instruction=json_system,
        )

        response = await self._call_with_retry(
            self.client.aio.models.generate_content,
            model=self.model_name,
            contents=prompt,
            config=config,
        )

        text = response.text.strip()
        # Strip markdown code fences if present (fallback safety)
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        return json.loads(text)
