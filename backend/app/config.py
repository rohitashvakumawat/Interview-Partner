from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Interview Practice Partner"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    # Use SQLite by default for easier local development and testing.
    DATABASE_URL: str = "sqlite:///./interview.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OTP
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Root / admin credentials (use only for local/dev testing)
    ROOT_EMAIL: str = "admin@example.com"
    ROOT_PASSWORD: str = "change-me-now"
    
    # LLM
    MODEL_NAME: str = "mistralai/Mistral-7B-Instruct-v0.2"
    MODEL_CACHE_DIR: str = "./models"
    MAX_NEW_TOKENS: int = 512
    TEMPERATURE: float = 0.7
    
    # STT
    WHISPER_MODEL: str = "base"
    
    # TTS
    TTS_MODEL: str = "tts_models/en/ljspeech/tacotron2-DDC"
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Pydantic v2 model config: allow extra env vars and load from .env
    model_config = {
        "env_file": ".env",
        "extra": "allow"
    }

@lru_cache()
def get_settings():
    return Settings()