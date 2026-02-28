import json
import asyncio
import logging
import google.generativeai as genai
from typing import Optional
from app.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API provider with retry logic for rate limits."""

    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.max_retries = 3
        self.base_delay = 15  # seconds — Gemini free tier has 15 RPM

    async def _call_with_retry(self, func, *args, **kwargs):
        """Call a function with exponential backoff retry on rate limit errors."""
        for attempt in range(self.max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str or "rate" in error_str or "resource_exhausted" in error_str:
                    if attempt < self.max_retries:
                        delay = self.base_delay * (2 ** attempt)
                        logger.warning(f"Gemini rate limit hit, retrying in {delay}s (attempt {attempt + 1}/{self.max_retries})")
                        await asyncio.sleep(delay)
                    else:
                        logger.error(f"Gemini rate limit exceeded after {self.max_retries} retries")
                        raise
                else:
                    raise

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        response = await self._call_with_retry(
            self.model.generate_content,
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ) -> dict:
        json_prompt = f"{prompt}\n\nRespond ONLY with valid JSON. No markdown, no explanation."
        if system_prompt:
            json_prompt = f"{system_prompt}\n\n{json_prompt}"

        response = await self._call_with_retry(
            self.model.generate_content,
            json_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )

        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        return json.loads(text)
