from datetime import timezone

from sqlmodel import Session, select

from app.core.audit import ahora
from app.core.repository import BaseRepository
from app.modules.usuarios.model import Rol, Usuario, UsuarioRol


def _vigente(expires_at) -> bool:
    """RN-14: sin expires_at no vence; con expires_at cuenta solo si todavia no paso."""
    if expires_at is None:
        return True
    if expires_at.tzinfo is None:  # SQLite devuelve fechas sin zona horaria (guardadas en UTC)
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > ahora()


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session):
        super().__init__(session, Usuario)

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(select(Usuario).where(Usuario.email == email)).first()

    def list_todos(self) -> list[Usuario]:
        """Incluye a los usuarios desactivados: el listado de admin muestra su estado."""
        return list(self.session.exec(select(Usuario).order_by(Usuario.id)).all())

    def get_rol_by_nombre(self, nombre: str) -> Rol | None:
        return self.session.exec(select(Rol).where(Rol.nombre == nombre)).first()

    def asignar_rol(
        self, usuario_id: int, rol_id: int, asignado_por_id: int | None = None
    ) -> UsuarioRol:
        enlace = UsuarioRol(
            usuario_id=usuario_id, rol_id=rol_id, asignado_por_id=asignado_por_id
        )
        self.session.add(enlace)
        self.session.flush()
        return enlace

    def roles_vigentes(self, usuario_ids: list[int]) -> dict[int, list[str]]:
        """Nombres de los roles vigentes de varios usuarios, con una sola consulta."""
        if not usuario_ids:
            return {}
        consulta = (
            select(UsuarioRol, Rol.nombre)
            .join(Rol, Rol.id == UsuarioRol.rol_id)
            .where(UsuarioRol.usuario_id.in_(usuario_ids))
            .order_by(Rol.nombre)
        )
        resultado: dict[int, list[str]] = {}
        for enlace, nombre in self.session.exec(consulta).all():
            if _vigente(enlace.expires_at):
                resultado.setdefault(enlace.usuario_id, []).append(nombre)
        return resultado
