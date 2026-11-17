from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import get_usuario_service, require_role
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios"])

ServiceDep = Annotated[UsuarioService, Depends(get_usuario_service)]
AdminDep = Annotated[UserPublic, Depends(require_role(["admin"]))]


@router.get("", response_model=list[UserPublic])
def listar_usuarios(_admin: AdminDep, service: ServiceDep):
    return service.listar()


@router.post("/{usuario_id}/activar", response_model=UserPublic)
def activar_usuario(usuario_id: int, _admin: AdminDep, service: ServiceDep):
    return service.activar(usuario_id)


@router.post("/{usuario_id}/desactivar", response_model=UserPublic)
def desactivar_usuario(usuario_id: int, admin: AdminDep, service: ServiceDep):
    return service.desactivar(usuario_id, admin.id)
