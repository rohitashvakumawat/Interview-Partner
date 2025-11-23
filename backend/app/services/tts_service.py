import os
import requests
from typing import Optional
from app.config import get_settings

settings = get_settings()


def _get_hf_token() -> Optional[str]:
    return os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HUGGINGFACE_TOKEN") or os.environ.get("HF_API_KEY") or os.environ.get("HF_TOKEN")


class HuggingFaceTTSService:
    def __init__(self, model: str = None):
        self.model = model or settings.TTS_MODEL
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"
        self.token = _get_hf_token()

    def synthesize(self, text: str, output_path: str) -> str:
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        payload = {"inputs": text}
        try:
            resp = requests.post(self.api_url, headers=headers, json=payload, timeout=120)
            resp.raise_for_status()
            # Response should be audio bytes (wav/mp3)
            content_type = resp.headers.get("content-type", "")
            data = resp.content
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(data)
            return output_path
        except Exception as e:
            print(f"TTS error: {e}")
            # fallback: create empty file
            try:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, "wb") as f:
                    f.write(b"")
            except Exception:
                pass
            return output_path


class MockTTSService:
    def synthesize(self, text: str, output_path: str) -> str:
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(b"")
        except Exception:
            pass
        return output_path


if _get_hf_token():
    tts_service = HuggingFaceTTSService()
else:
    tts_service = MockTTSService()