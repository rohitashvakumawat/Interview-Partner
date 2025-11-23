from typing import List, Dict, Optional
import os
import requests
from app.config import get_settings

settings = get_settings()


def _get_hf_token() -> Optional[str]:
    return os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HUGGINGFACE_TOKEN") or os.environ.get("HF_API_KEY") or os.environ.get("HF_TOKEN")


class HuggingFaceLLMService:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.MODEL_NAME
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        self.token = _get_hf_token()

    def _headers(self):
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def generate(self, prompt: str, max_new_tokens: int = None, temperature: float = None, system_prompt: str = None) -> str:
        payload = {"inputs": prompt, "parameters": {}}
        if max_new_tokens:
            payload["parameters"]["max_new_tokens"] = max_new_tokens
        if temperature:
            payload["parameters"]["temperature"] = temperature

        try:
            resp = requests.post(self.api_url, headers=self._headers(), json=payload, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            # Response may be a dict or list
            if isinstance(data, dict) and "generated_text" in data:
                return data["generated_text"].strip()
            if isinstance(data, list) and data and isinstance(data[0], dict) and "generated_text" in data[0]:
                return data[0]["generated_text"].strip()
            # Some models return plain text
            if isinstance(data, dict) and "error" in data:
                raise RuntimeError(data.get("error"))
            # Fallback: return str representation
            return str(data)
        except Exception as e:
            print(f"LLM generation error: {e}")
            return ""  # Let caller handle empty responses

    def generate_streaming(self, prompt: str, system_prompt: str = None):
        # Hugging Face Inference streaming would require SSE/WebSocket; fall back to single responses
        yield self.generate(prompt, system_prompt=system_prompt)


# Choose implementation: prefer HF client when token is present, else use mock
if _get_hf_token():
    llm_service = HuggingFaceLLMService()
else:
    class MockLLMService:
        def generate(self, prompt: str, max_new_tokens: int = None, temperature: float = None, system_prompt: str = None) -> str:
            return "This is a placeholder response from the mock LLM."

        def generate_streaming(self, prompt: str, system_prompt: str = None):
            yield "This is a placeholder streaming chunk."

    llm_service = MockLLMService()