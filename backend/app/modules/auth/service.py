from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    """Registro y login. Usa el Unit of Work de usuarios: no hace commit por su cuenta."""

    def __init__(self, uow: UsuarioUnitOfWork):
        self.uow = uow

    def registrar(self, data: UserCreate) -> UserPublic:
        email = data.email.lower()
        with self.uow as uow:
            if uow.usuarios.get_by_username(data.username) is not None:
                raise HTTPException(status.HTTP_409_CONFLICT, "El username ya esta registrado")
            if uow.usuarios.get_by_email(email) is not None:
                raise HTTPException(status.HTTP_409_CONFLICT, "El email ya esta registrado")
            # El registro publico siempre crea usuarios con rol "user" (valor por defecto del modelo)
            usuario = uow.usuarios.add(
                Usuario(
                    username=data.username,
                    full_name=data.full_name,
                    email=email,
                    hashed_password=hash_password(data.password),
                )
            )
            return UserPublic.model_validate(usuario)

    def autenticar(self, username: str, password: str) -> str:
        """Valida las credenciales y devuelve el JWT."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales incorrectas")
            if usuario.disabled:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cuenta de usuario desactivada")
            return create_access_token(data={"sub": usuario.username})
