import os
import requests
from typing import Optional
from app.config import get_settings

settings = get_settings()


def _get_hf_token() -> Optional[str]:
    return os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HUGGINGFACE_TOKEN") or os.environ.get("HF_API_KEY") or os.environ.get("HF_TOKEN")


class HuggingFaceSTTService:
    def __init__(self, model: str = None):
        self.model = model or settings.WHISPER_MODEL
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"
        self.token = _get_hf_token()

    def transcribe(self, audio_path: str) -> dict:
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        try:
            with open(audio_path, "rb") as f:
                resp = requests.post(self.api_url, headers=headers, data=f, timeout=120)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, dict) and "text" in data:
                return {"text": data["text"]}
            if isinstance(data, list) and data and isinstance(data[0], dict) and "text" in data[0]:
                return {"text": data[0]["text"]}
            return {"text": str(data)}
        except Exception as e:
            print(f"STT error: {e}")
            return {"text": ""}


class MockSTTService:
    def transcribe(self, audio_path: str) -> dict:
        return {"text": "This is a placeholder transcription."}


if _get_hf_token():
    stt_service = HuggingFaceSTTService()
else:
    stt_service = MockSTTService()
