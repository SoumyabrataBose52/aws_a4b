import json
import google.generativeai as genai
from typing import Optional
from app.llm.base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API provider."""

    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        response = self.model.generate_content(
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

        response = self.model.generate_content(
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
