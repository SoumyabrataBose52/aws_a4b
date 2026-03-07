from abc import ABC, abstractmethod
from typing import Optional


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers.
    
    Swap between Gemini, Bedrock, OpenAI, or Mock by changing LLM_PROVIDER env var.
    """

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
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
    ) -> dict:
        """Generate a structured JSON response from a prompt."""
        pass


def get_llm_provider() -> BaseLLMProvider:
    """Factory: returns the configured LLM provider."""
    from app.config import get_settings
    settings = get_settings()

    if settings.LLM_PROVIDER == "gemini":
        from app.llm.gemini import GeminiProvider
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model_name="gemini-3-flash-preview")
    else:
        from app.llm.mock import MockLLMProvider
        return MockLLMProvider()
