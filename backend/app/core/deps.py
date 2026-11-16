from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.schema import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

COOKIE_NAME = "access_token"


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    """Lee el JWT solo de la cookie HttpOnly; el encabezado Authorization no se acepta."""

    async def __call__(self, request: Request) -> str | None:
        token = request.cookies.get(COOKIE_NAME)
        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
        return token


oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/token")


def get_usuario_service() -> UsuarioService:
    """FastAPI inyecta el Service con su Unit of Work en cada endpoint."""
    return UsuarioService(UsuarioUnitOfWork(session_factory))


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    service: Annotated[UsuarioService, Depends(get_usuario_service)],
) -> UserPublic:
    """RN-10: valida firma, expiracion y tipo del JWT y busca al usuario. Si falla, 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales invalidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str | None = payload.get("sub")
    if email is None:
        raise credentials_exception

    usuario = service.obtener_por_email(email)
    if usuario is None:
        raise credentials_exception
    return usuario


def get_current_active_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    """La cuenta pudo desactivarse despues de emitir el token: se consulta en cada peticion."""
    if not current_user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada"
        )
    return current_user


def require_role(allowed_roles: list[str]):
    """Fabrica de dependencias: 403 si ninguno de los roles vigentes esta permitido (RN-14).

    current_user.roles ya trae solo los roles vigentes de UsuarioRol (sin expires_at
    o con expires_at todavia no vencido).
    """

    def role_checker(
        current_user: Annotated[UserPublic, Depends(get_current_active_user)],
    ) -> UserPublic:
        if not any(rol in allowed_roles for rol in current_user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Permisos insuficientes. Roles actuales: {current_user.roles}. "
                    f"Se requiere uno de: {allowed_roles}"
                ),
            )
        return current_user

    return role_checker
