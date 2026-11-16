from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# check_same_thread=False solo hace falta con SQLite (FastAPI usa varios hilos).
# Con PostgreSQL no se pasa ningun argumento extra.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def session_factory() -> Session:
    """Crea una sesion nueva. La usa el Unit of Work cada vez que abre un bloque with."""
    return Session(engine)
