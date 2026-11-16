from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_active_user
from app.modules.catalogos.model import EstadoPedido
from app.modules.usuarios.model import Rol
from app.modules.usuarios.schema import RolRead

# Catalogos de solo lectura: no hay POST, PUT, PATCH ni DELETE (responden 405, RN-06).
# Los puede leer cualquier usuario autenticado (RN-07).
router = APIRouter(
    prefix="/api/v1/catalogos",
    tags=["Catalogos"],
    dependencies=[Depends(get_current_active_user)],
)


@router.get("/roles", response_model=list[RolRead])
def listar_roles(session: Session = Depends(get_session)):
    return session.exec(select(Rol).order_by(Rol.id)).all()


@router.get("/estados-pedido", response_model=list[EstadoPedido])
def listar_estados_pedido(session: Session = Depends(get_session)):
    return session.exec(select(EstadoPedido).order_by(EstadoPedido.orden)).all()
