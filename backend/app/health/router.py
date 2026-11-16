from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, text

from app.core.database import get_session

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
def health():
    return {"status": "ok"}


@router.get("/db")
def health_db(session: Session = Depends(get_session)):
    try:
        session.exec(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No hay conexion con la base de datos",
        )
    return {"status": "ok", "database": "connected"}
