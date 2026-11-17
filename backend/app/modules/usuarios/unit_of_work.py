from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    """Transaccion de los casos de uso de usuarios y de auth."""

    usuarios: UsuarioRepository

    def _crear_repositorios(self) -> None:
        self.usuarios = UsuarioRepository(self.session)
