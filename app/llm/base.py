from abc import ABC, abstractmethod
from typing import Optional


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers.
    
    Swap between Bedrock, Gemini, or Mock by changing LLM_PROVIDER env var.
    The `tier` parameter controls model routing in multi-model providers:
      - "critical": uses the most capable model (e.g. Claude Opus 4.6)
      - "fast": uses the fastest model (e.g. Claude Sonnet 4.6)
    Single-model providers (Gemini, Mock) ignore the tier parameter.
    """

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tier: Optional[str] = None,
    ) -> str:
        """Generate text from a prompt."""
        pass

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        tier: Optional[str] = None,
    ) -> dict:
        """Generate a structured JSON response from a prompt."""
        pass


def get_llm_provider() -> BaseLLMProvider:
    """Factory: returns the configured LLM provider."""
    from app.config import get_settings
    settings = get_settings()

    if settings.LLM_PROVIDER == "bedrock":
        from app.llm.bedrock import BedrockProvider
        return BedrockProvider(
            region=settings.AWS_REGION,
            critical_model=settings.BEDROCK_CRITICAL_MODEL,
            fast_model=settings.BEDROCK_FAST_MODEL,
        )
    elif settings.LLM_PROVIDER == "gemini":
        from app.llm.gemini import GeminiProvider
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model_name="gemini-3-flash-preview")
    else:
        from app.llm.mock import MockLLMProvider
        return MockLLMProvider()
