from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.categoria import service
from app.categoria.schema import (
    CategoriaCreate,
    CategoriaPaginatedResponse,
    CategoriaRead,
    CategoriaUpdate,
)
from app.core.database import get_session
from app.core.deps import get_current_active_user, require_role
from app.producto import service as producto_service
from app.producto.schema import ProductoRead

ADMIN = [Depends(require_role(["admin"]))]  # escrituras: solo admin

# Lectura: cualquier usuario autenticado (RN-07)
router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"],
    dependencies=[Depends(get_current_active_user)],
)


@router.get("/", response_model=CategoriaPaginatedResponse)
def listar_categorias(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    nombre: str | None = None,
    incluir_inactivos: bool = False,
    session: Session = Depends(get_session),
):
    return service.listar(session, offset, limit, nombre, incluir_inactivos)


@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED, dependencies=ADMIN)
def crear_categoria(data: CategoriaCreate, session: Session = Depends(get_session)):
    return service.crear(session, data)


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(categoria_id: int, session: Session = Depends(get_session)):
    return service.obtener(session, categoria_id)


@router.put("/{categoria_id}", response_model=CategoriaRead, dependencies=ADMIN)
def actualizar_categoria(
    categoria_id: int, data: CategoriaUpdate, session: Session = Depends(get_session)
):
    return service.actualizar(session, categoria_id, data)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=ADMIN)
def eliminar_categoria(categoria_id: int, session: Session = Depends(get_session)):
    service.eliminar(session, categoria_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Relacion N:M (solo consulta) ----------


@router.get("/{categoria_id}/productos", response_model=list[ProductoRead])
def listar_productos_de_categoria(
    categoria_id: int, session: Session = Depends(get_session)
):
    service.obtener(session, categoria_id)  # 404 si la categoria no existe
    return producto_service.listar_por_categoria(session, categoria_id)
