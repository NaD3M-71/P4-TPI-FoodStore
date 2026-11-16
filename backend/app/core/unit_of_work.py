from collections.abc import Callable

from sqlmodel import Session

from app.core.database import session_factory as default_session_factory


class UnitOfWork:
    """Unit of Work base: controla la transaccion de un caso de uso.

    Se usa con un bloque with. Al salir del bloque:
      - si no hubo errores hace commit
      - si hubo una excepcion hace rollback
    y en los dos casos cierra la sesion.

    Cada modulo hereda de esta clase y crea sus repositorios en
    _crear_repositorios(), todos con la misma sesion.
    """

    session: Session

    def __init__(self, session_factory: Callable[[], Session] = default_session_factory):
        self.session_factory = session_factory

    def _crear_repositorios(self) -> None:
        """Los modulos la redefinen para exponer sus repositorios."""

    def __enter__(self):
        self.session = self.session_factory()
        self._crear_repositorios()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # try/finally: la sesion se cierra aunque el commit falle.
        # No se devuelve True, asi la excepcion original llega al Router.
        try:
            if exc_type:
                self.session.rollback()
            else:
                self.session.commit()
        finally:
            self.session.close()
