from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_active_user, require_role
from app.ingrediente import service
from app.ingrediente.schema import (
    IngredienteCreate,
    IngredientePaginatedResponse,
    IngredienteRead,
    IngredienteUpdate,
)

ADMIN = [Depends(require_role(["admin"]))]  # escrituras: solo admin

# Lectura: cualquier usuario autenticado (RN-07)
router = APIRouter(
    prefix="/ingredientes",
    tags=["Ingredientes"],
    dependencies=[Depends(get_current_active_user)],
)


@router.get("/", response_model=IngredientePaginatedResponse)
def listar_ingredientes(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session),
):
    return service.listar(session, offset, limit)


@router.post("/", response_model=IngredienteRead, status_code=status.HTTP_201_CREATED, dependencies=ADMIN)
def crear_ingrediente(data: IngredienteCreate, session: Session = Depends(get_session)):
    return service.crear(session, data)


@router.get("/{ingrediente_id}", response_model=IngredienteRead)
def obtener_ingrediente(ingrediente_id: int, session: Session = Depends(get_session)):
    return service.obtener(session, ingrediente_id)


@router.put("/{ingrediente_id}", response_model=IngredienteRead, dependencies=ADMIN)
def actualizar_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    session: Session = Depends(get_session),
):
    return service.actualizar(session, ingrediente_id, data)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=ADMIN)
def eliminar_ingrediente(ingrediente_id: int, session: Session = Depends(get_session)):
    service.eliminar(session, ingrediente_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
