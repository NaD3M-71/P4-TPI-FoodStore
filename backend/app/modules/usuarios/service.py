from fastapi import HTTPException, status

from app.core.audit import ahora
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.repository import UsuarioRepository
from app.modules.usuarios.schema import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

ROL_POR_DEFECTO = "user"  # RN-08: el registro siempre asigna el rol user


def _normalizar_email(email: str) -> str:
    return email.strip().lower()


def _a_publico(usuario: Usuario, roles: list[str]) -> UserPublic:
    return UserPublic(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        email=usuario.email,
        celular=usuario.celular,
        roles=roles,
        activo=usuario.deleted_at is None,
        created_at=usuario.created_at,
        deleted_at=usuario.deleted_at,
    )


def _publico(repo: UsuarioRepository, usuario: Usuario) -> UserPublic:
    return _a_publico(usuario, repo.roles_vigentes([usuario.id]).get(usuario.id, []))


class UsuarioService:
    """Reglas de negocio de usuarios. No hace commit: lo hace el Unit of Work.

    Los resultados se convierten a UserPublic dentro del bloque with, antes de que
    el commit cierre la sesion.
    """

    def __init__(self, uow: UsuarioUnitOfWork):
        self.uow = uow

    def registrar(self, data: UserCreate) -> UserPublic:
        email = _normalizar_email(data.email)
        with self.uow as uow:
            if uow.usuarios.get_by_email(email) is not None:  # RN-02
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un usuario con ese email",
                )
            rol = uow.usuarios.get_rol_by_nombre(ROL_POR_DEFECTO)
            if rol is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="El rol 'user' no esta cargado: ejecutar el seed",
                )
            usuario = uow.usuarios.create(
                Usuario(
                    nombre=data.nombre,
                    apellido=data.apellido,
                    email=email,
                    celular=data.celular,
                    password_hash=hash_password(data.password),  # RN-01
                )
            )
            uow.usuarios.asignar_rol(usuario.id, rol.id)  # RN-08
            return _publico(uow.usuarios, usuario)

    def autenticar(self, email: str, password: str) -> str:
        """Valida las credenciales y devuelve el JWT. El mismo 401 para email o clave mal."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_email(_normalizar_email(email))
            if usuario is None or not verify_password(password, usuario.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales incorrectas",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            if usuario.deleted_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cuenta de usuario desactivada",
                )
            return create_access_token(data={"sub": usuario.email})

    def obtener_por_email(self, email: str) -> UserPublic | None:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_email(email)
            if usuario is None:
                return None
            return _publico(uow.usuarios, usuario)

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            usuarios = uow.usuarios.list_todos()
            roles = uow.usuarios.roles_vigentes([u.id for u in usuarios])
            return [_a_publico(u, roles.get(u.id, [])) for u in usuarios]

    def _cambiar_estado(self, usuario_id: int, activo: bool) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
                )
            # Borrado logico: desactivar completa deleted_at, activar lo vuelve a nulo
            usuario.deleted_at = None if activo else (usuario.deleted_at or ahora())
            uow.session.add(usuario)
            uow.session.flush()
            return _publico(uow.usuarios, usuario)

    def desactivar(self, usuario_id: int) -> UserPublic:
        return self._cambiar_estado(usuario_id, activo=False)

    def activar(self, usuario_id: int) -> UserPublic:
        return self._cambiar_estado(usuario_id, activo=True)
