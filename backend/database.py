# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.declarative import declarative_base
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./netrasaarthi.db"

# connect_args={"check_same_thread": False} is required for SQLite in multi-threaded FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_db_migrations():
    """Lightweight schema auto-migration for SQLite."""
    import sqlite3
    try:
        conn = sqlite3.connect("./netrasaarthi.db")
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='predictions'")
        if c.fetchone():
            cols = [col[1] for col in c.execute("PRAGMA table_info(predictions)").fetchall()]
            for col_name in ["heatmap_url", "explanation_type", "disclaimer", "quality_status", "quality_messages"]:
                if col_name not in cols:
                    c.execute(f"ALTER TABLE predictions ADD COLUMN {col_name} TEXT")
            conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB Migration Notice]: {e}")


ensure_db_migrations()


def get_db():
    """Dependency to provide a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

