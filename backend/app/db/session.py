from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from ..core.config import settings


class Base(DeclarativeBase):
    pass


engine = None
SessionLocal = None


def init_engine_and_create_tables() -> None:
    global engine, SessionLocal
    if engine is None:
        engine = create_engine(settings.database_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        from . import models  # noqa: F401 ensure models are imported
        Base.metadata.create_all(bind=engine)


def get_db_session():
    global SessionLocal
    if SessionLocal is None:
        init_engine_and_create_tables()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


