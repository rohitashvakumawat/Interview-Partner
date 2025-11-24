import redis
import json
from typing import Any, Optional
from app.config import get_settings

settings = get_settings()

class RedisClient:
    def __init__(self):
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    def set(self, key: str, value: Any, expire: int = 3600):
        """Set a key-value pair with optional expiration"""
        self.client.setex(key, expire, json.dumps(value))
    
    def get(self, key: str) -> Optional[Any]:
        """Get value by key"""
        value = self.client.get(key)
        return json.loads(value) if value else None
    
    def delete(self, key: str):
        """Delete a key"""
        self.client.delete(key)
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        return self.client.exists(key) > 0

redis_client = RedisClient()