from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import (
    COOKIE_NAME,
    get_current_active_user,
    get_usuario_service,
    require_role,
)
from app.modules.usuarios.schema import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioService

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

UsuarioServiceDep = Annotated[UsuarioService, Depends(get_usuario_service)]
CurrentUser = Annotated[UserPublic, Depends(get_current_active_user)]
AdminUser = Annotated[UserPublic, Depends(require_role(["admin"]))]


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def registrar(data: UserCreate, service: UsuarioServiceDep):
    """Registro publico: asigna siempre el rol user (RN-08)."""
    return service.registrar(data)


@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    service: UsuarioServiceDep,
):
    """Flujo OAuth2 password: el campo username del formulario lleva el email.

    El JWT no va en el cuerpo: se entrega en una cookie HttpOnly (RN-03).
    """
    token = service.autenticar(form_data.username, form_data.password)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
    )
    return {"mensaje": "Login exitoso. Sesion iniciada."}


@router.post("/logout")
def logout(response: Response):
    """Borra la cookie en el navegador. El JWT no se revoca: por eso su vida es corta."""
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
    )
    return {"mensaje": "Sesion cerrada."}


@router.get("/me", response_model=UserPublic)
def me(current_user: CurrentUser):
    return current_user


# ---------- Administracion de usuarios (solo admin) ----------


@router.get("/admin/usuarios", response_model=list[UserPublic])
def listar_usuarios(_admin: AdminUser, service: UsuarioServiceDep):
    return service.listar()


@router.post("/admin/usuarios/{usuario_id}/activar", response_model=UserPublic)
def activar_usuario(usuario_id: int, _admin: AdminUser, service: UsuarioServiceDep):
    return service.activar(usuario_id)


@router.post("/admin/usuarios/{usuario_id}/desactivar", response_model=UserPublic)
def desactivar_usuario(usuario_id: int, _admin: AdminUser, service: UsuarioServiceDep):
    return service.desactivar(usuario_id)
