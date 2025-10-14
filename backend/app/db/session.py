from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from ..core.config import settings


class Base(DeclarativeBase):
    pass


engine = None
SessionLocal = None


def init_engine_and_create_tables() -> None:
    global engine, SessionLocal
    if engine is None:
        print("Initializing database engine...")
        try:
            engine = create_engine(settings.database_url, pool_pre_ping=True)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            from . import models  # noqa: F401 ensure models are imported
            Base.metadata.create_all(bind=engine)
            print("✅ Database engine initialized successfully")
            print("✅ Database tables created/verified successfully")
        except Exception as e:
            print(f"❌ Failed to initialize database engine: {e}")
            raise


def get_db_session():
    global SessionLocal
    if SessionLocal is None:
        init_engine_and_create_tables()
    
    print("🔗 Creating new database session")
    db = SessionLocal()
    try:
        # Test the connection to ensure it's working
        db.execute(text("SELECT 1"))
        print("✅ Database connection established successfully")
        yield db
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        db.rollback()
        raise
    finally:
        print("🔒 Closing database session")
        db.close()


