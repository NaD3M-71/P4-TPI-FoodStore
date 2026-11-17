from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.database import session_factory
from app.core.deps import COOKIE_NAME, get_current_active_user
from app.modules.auth.schemas import MensajeRespuesta
from app.modules.auth.service import AuthService
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork(session_factory))


ServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def registrar(data: UserCreate, service: ServiceDep):
    return service.registrar(data)


@router.post("/token", response_model=MensajeRespuesta)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    service: ServiceDep,
):
    """Login con formulario OAuth2. El JWT va en una cookie HttpOnly, no en el cuerpo."""
    token = service.autenticar(form_data.username, form_data.password)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
    )
    return MensajeRespuesta(message="Login exitoso")


@router.post("/logout", response_model=MensajeRespuesta)
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, httponly=True, samesite="lax")
    return MensajeRespuesta(message="Sesion cerrada")


@router.get("/me", response_model=UserPublic)
def me(current_user: Annotated[UserPublic, Depends(get_current_active_user)]):
    return current_user
