from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Try to create engine with configured DATABASE_URL; fallback to SQLite if it fails
db_url = settings.DATABASE_URL
try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )
    # Test connection to ensure it's reachable
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Failed to connect to {db_url}: {e}")
    logger.info("Falling back to SQLite database...")
    db_url = "sqlite:///./interview.db"
    engine = create_engine(
        db_url,
        echo=settings.DEBUG
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)