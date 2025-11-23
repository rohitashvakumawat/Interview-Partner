import redis
import json
from typing import Any, Optional
from app.config import get_settings

settings = get_settings()

class RedisClient:
    def __init__(self):
        try:
            self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Test connection
            self.client.ping()
            self._using_redis = True
        except Exception:
            # Fall back to an in-memory store for local/dev when Redis is not available
            self._using_redis = False
            print("Warning: Redis not available, falling back to in-memory store")
            class InMemoryStore:
                def __init__(self):
                    self._store = {}

                def setex(self, key, expire, value):
                    self._store[key] = value

                def get(self, key):
                    return self._store.get(key)

                def delete(self, key):
                    if key in self._store:
                        del self._store[key]

                def exists(self, key):
                    return 1 if key in self._store else 0

            self.client = InMemoryStore()
    
    def set(self, key: str, value: Any, expire: int = 3600):
        """Set a key-value pair with optional expiration"""
        try:
            self.client.setex(key, expire, json.dumps(value))
        except Exception:
            # Best-effort fallback for simple clients
            try:
                self.client.setex(key, expire, json.dumps(value))
            except Exception:
                # Last resort: store raw value
                try:
                    self.client._store[key] = json.dumps(value)
                except Exception:
                    pass
    
    def get(self, key: str) -> Optional[Any]:
        """Get value by key"""
        try:
            value = self.client.get(key)
        except Exception:
            # Try in-memory access
            try:
                value = self.client._store.get(key)
            except Exception:
                value = None
        return json.loads(value) if value else None
    
    def delete(self, key: str):
        """Delete a key"""
        self.client.delete(key)
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        return self.client.exists(key) > 0

redis_client = RedisClient()