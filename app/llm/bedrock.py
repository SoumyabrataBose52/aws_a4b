"""
Amazon Bedrock LLM provider with multi-model routing.

Routes critical tasks (crisis, deals) to Claude Opus 4.6 and
fast tasks (content, trends, analytics) to Claude Sonnet 4.6.
Uses cross-region inference from ap-south-1 to global Anthropic models.
"""

import json
import asyncio
import logging
from typing import Optional

import boto3
from botocore.config import Config as BotoConfig

from app.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class BedrockProvider(BaseLLMProvider):
    """Amazon Bedrock provider with multi-model routing via Converse API."""

    def __init__(
        self,
        region: str = "ap-south-1",
        critical_model: str = "us.anthropic.claude-opus-4-6-20250624-v1:0",
        fast_model: str = "us.anthropic.claude-sonnet-4-6-20250514-v1:0",
        default_tier: str = "fast",
        max_retries: int = 3,
        base_delay: float = 2.0,
    ):
        self.critical_model = critical_model
        self.fast_model = fast_model
        self.default_tier = default_tier
        self.max_retries = max_retries
        self.base_delay = base_delay

        # Configure boto3 with retries and timeout
        boto_config = BotoConfig(
            region_name=region,
            retries={"max_attempts": 3, "mode": "adaptive"},
            read_timeout=120,
            connect_timeout=10,
        )
        self.client = boto3.client("bedrock-runtime", config=boto_config)
        logger.info(
            f"BedrockProvider initialized: region={region}, "
            f"critical={critical_model}, fast={fast_model}"
        )

    def _get_model_id(self, tier: Optional[str] = None) -> str:
        """Select model based on task tier."""
        effective_tier = tier or self.default_tier
        if effective_tier == "critical":
            return self.critical_model
        return self.fast_model

    async def _call_with_retry(self, model_id: str, messages: list, system: list, config: dict) -> dict:
        """Call Bedrock Converse API with exponential backoff on throttling."""
        for attempt in range(self.max_retries + 1):
            try:
                # Run synchronous boto3 call in a thread pool
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.client.converse(
                        modelId=model_id,
                        messages=messages,
                        system=system,
                        inferenceConfig=config,
                    ),
                )
                return response
            except Exception as e:
                error_str = str(e).lower()
                is_throttle = any(
                    tok in error_str
                    for tok in ["throttling", "rate exceeded", "too many requests", "429"]
                )
                if is_throttle and attempt < self.max_retries:
                    delay = self.base_delay * (2 ** attempt)
                    logger.warning(
                        f"Bedrock throttled, retrying in {delay}s "
                        f"(attempt {attempt + 1}/{self.max_retries})"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"Bedrock API error (attempt {attempt + 1}): "
                        f"{type(e).__name__}: {e}"
                    )
                    raise

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tier: Optional[str] = None,
    ) -> str:
        """Generate text using Bedrock Converse API."""
        model_id = self._get_model_id(tier)

        messages = [{"role": "user", "content": [{"text": prompt}]}]
        system = []
        if system_prompt:
            system = [{"text": system_prompt}]

        config = {
            "temperature": temperature,
            "maxTokens": max_tokens,
        }

        logger.info(f"Bedrock generate_text: model={model_id}, tier={tier or self.default_tier}")

        response = await self._call_with_retry(model_id, messages, system, config)

        # Extract text from Converse response
        output = response.get("output", {})
        message = output.get("message", {})
        content_blocks = message.get("content", [])

        text_parts = []
        for block in content_blocks:
            if "text" in block:
                text_parts.append(block["text"])

        result = "\n".join(text_parts)

        # Log token usage
        usage = response.get("usage", {})
        logger.info(
            f"Bedrock usage: input={usage.get('inputTokens', 0)}, "
            f"output={usage.get('outputTokens', 0)}"
        )

        return result

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        tier: Optional[str] = None,
    ) -> dict:
        """Generate a structured JSON response using Bedrock Converse API."""
        json_system = (
            "You are a helpful assistant. Respond ONLY with valid JSON. "
            "No markdown code fences, no explanation, no preamble. "
            "Output must be parseable by json.loads()."
        )
        if system_prompt:
            json_system = f"{system_prompt}\n\n{json_system}"

        text = await self.generate_text(
            prompt=prompt,
            system_prompt=json_system,
            temperature=temperature,
            max_tokens=max_tokens,
            tier=tier,
        )

        # Strip markdown fences if present
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first line (```json) and last line (```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            text = "\n".join(lines)

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Bedrock JSON response: {e}\nRaw: {text[:500]}")
            # Attempt to extract JSON from mixed text
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(text[start:end])
                except json.JSONDecodeError:
                    pass
            raise ValueError(f"Bedrock returned invalid JSON: {text[:200]}") from e
