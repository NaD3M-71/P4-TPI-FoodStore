from fastapi import HTTPException, status

from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    """Gestion de usuarios. No hace commit: lo hace el Unit of Work al salir del with.

    Cada resultado se convierte a UserPublic dentro del bloque with, antes de que
    el commit cierre la sesion.
    """

    def __init__(self, uow: UsuarioUnitOfWork):
        self.uow = uow

    def obtener_por_username(self, username: str) -> UserPublic | None:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None:
                return None
            return UserPublic.model_validate(usuario)

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.list_todos()]

    def activar(self, usuario_id: int) -> UserPublic:
        # Idempotente: responde 200 aunque el usuario ya estuviera activo
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
            usuario.disabled = False
            return UserPublic.model_validate(usuario)

    def desactivar(self, usuario_id: int, admin_id: int) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
            if usuario.id == admin_id:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, "Un administrador no puede desactivarse a si mismo"
                )
            usuario.disabled = True
            return UserPublic.model_validate(usuario)
