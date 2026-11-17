from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

COOKIE_NAME = "access_token"


def get_usuario_service() -> UsuarioService:
    """FastAPI inyecta el Service con su Unit of Work en cada peticion."""
    return UsuarioService(UsuarioUnitOfWork(session_factory))


def get_current_user(
    service: Annotated[UsuarioService, Depends(get_usuario_service)],
    access_token: Annotated[str | None, Cookie()] = None,
) -> UserPublic:
    """Lee el JWT de la cookie HttpOnly, valida firma y expiracion y carga el usuario.

    Sin cookie, con token invalido o vencido, o con un usuario inexistente: 401.
    """
    error_401 = HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    if access_token is None:
        raise error_401
    payload = decode_access_token(access_token)
    if payload is None or payload.get("sub") is None:
        raise error_401
    usuario = service.obtener_por_username(payload["sub"])
    if usuario is None:
        raise error_401
    return usuario


def get_current_active_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    """La cuenta pudo desactivarse despues de emitir el token: se revisa en cada peticion."""
    if current_user.disabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cuenta de usuario desactivada")
    return current_user


def require_role(allowed_roles: list[str]):
    """Fabrica de dependencias: 403 si el rol del usuario no esta permitido."""

    def role_checker(
        current_user: Annotated[UserPublic, Depends(get_current_active_user)],
    ) -> UserPublic:
        if current_user.role not in allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permisos para esta accion")
        return current_user

    return role_checker
