from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# check_same_thread=False solo hace falta con SQLite (FastAPI usa varios hilos).
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)


def create_all_tables() -> None:
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Crea una sesion nueva. La usa el Unit of Work cada vez que abre un bloque with."""
    return Session(engine)
