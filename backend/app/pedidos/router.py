from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.database import session_factory
from app.core.deps import get_current_active_user, require_role
from app.modules.usuarios.schema import UserPublic
from app.pedidos.schemas import PedidoCreate, PedidoRead, PedidoUpdate
from app.pedidos.service import PedidoNoEncontrado, PedidoService, ProductoNoEncontrado
from app.pedidos.unit_of_work import PedidoUnitOfWork

# Lectura: cualquier usuario autenticado (RN-07)
router = APIRouter(
    prefix="/pedidos", tags=["pedidos"], dependencies=[Depends(get_current_active_user)]
)


def get_pedido_service() -> PedidoService:
    """FastAPI inyecta el Service con su Unit of Work en cada endpoint."""
    return PedidoService(PedidoUnitOfWork(session_factory))


def _no_encontrado(error: Exception) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


# Se registran "" y "/" para que GET /pedidos y GET /pedidos/ respondan sin redireccion
@router.get("", response_model=list[PedidoRead])
@router.get("/", response_model=list[PedidoRead], include_in_schema=False)
def listar_pedidos(service: PedidoService = Depends(get_pedido_service)):
    return service.listar()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(pedido_id: int, service: PedidoService = Depends(get_pedido_service)):
    try:
        return service.obtener(pedido_id)
    except PedidoNoEncontrado as e:
        raise _no_encontrado(e)


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
@router.post(
    "/", response_model=PedidoRead, status_code=status.HTTP_201_CREATED, include_in_schema=False
)
def crear_pedido(
    data: PedidoCreate,
    service: PedidoService = Depends(get_pedido_service),
    # RN-05: lo crea un usuario con rol user o admin y su id sale de la sesion
    usuario: UserPublic = Depends(require_role(["user", "admin"])),
):
    try:
        return service.crear(data, usuario.id)
    except ProductoNoEncontrado as e:
        raise _no_encontrado(e)


@router.put("/{pedido_id}", response_model=PedidoRead)
def actualizar_pedido(
    pedido_id: int,
    data: PedidoUpdate,
    service: PedidoService = Depends(get_pedido_service),
    _admin: UserPublic = Depends(require_role(["admin"])),
):
    try:
        return service.actualizar_estado(pedido_id, data)
    except PedidoNoEncontrado as e:
        raise _no_encontrado(e)


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_pedido(
    pedido_id: int,
    service: PedidoService = Depends(get_pedido_service),
    _admin: UserPublic = Depends(require_role(["admin"])),
):
    try:
        service.eliminar(pedido_id)
    except PedidoNoEncontrado as e:
        raise _no_encontrado(e)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
