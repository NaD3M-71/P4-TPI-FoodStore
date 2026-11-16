from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.categoria.schema import CategoriaRead
from app.core.database import get_session
from app.core.deps import get_current_active_user, require_role
from app.producto import service
from app.producto.schema import (
    ProductoCreate,
    ProductoIngredienteRead,
    ProductoPaginatedResponse,
    ProductoRead,
    ProductoUpdate,
)

ADMIN = [Depends(require_role(["admin"]))]  # escrituras: solo admin

# Lectura: cualquier usuario autenticado (RN-07)
router = APIRouter(
    prefix="/productos",
    tags=["Productos"],
    dependencies=[Depends(get_current_active_user)],
)


@router.get("/", response_model=ProductoPaginatedResponse)
def listar_productos(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    nombre: str | None = None,
    incluir_inactivos: bool = False,
    session: Session = Depends(get_session),
):
    return service.listar(session, offset, limit, nombre, incluir_inactivos)


@router.post("/", response_model=ProductoRead, status_code=status.HTTP_201_CREATED, dependencies=ADMIN)
def crear_producto(data: ProductoCreate, session: Session = Depends(get_session)):
    return service.crear(session, data)


@router.get("/{producto_id}", response_model=ProductoRead)
def obtener_producto(producto_id: int, session: Session = Depends(get_session)):
    return service.obtener(session, producto_id)


@router.put("/{producto_id}", response_model=ProductoRead, dependencies=ADMIN)
def actualizar_producto(
    producto_id: int, data: ProductoUpdate, session: Session = Depends(get_session)
):
    return service.actualizar(session, producto_id, data)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=ADMIN)
def eliminar_producto(producto_id: int, session: Session = Depends(get_session)):
    service.eliminar(session, producto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Relaciones N:M (solo consulta) ----------
# No hay POST/DELETE para asociar: las relaciones se gestionan al crear o
# editar el producto (categoria_ids e ingredientes en el body).


@router.get("/{producto_id}/categorias", response_model=list[CategoriaRead])
def listar_categorias_de_producto(
    producto_id: int, session: Session = Depends(get_session)
):
    return service.listar_categorias(session, producto_id)


@router.get("/{producto_id}/ingredientes", response_model=list[ProductoIngredienteRead])
def listar_ingredientes_de_producto(
    producto_id: int, session: Session = Depends(get_session)
):
    return service.listar_ingredientes(session, producto_id)
