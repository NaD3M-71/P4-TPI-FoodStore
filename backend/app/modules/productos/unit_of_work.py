from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository
from app.modules.productos.repository import ProductoRepository


class ProductoUnitOfWork(UnitOfWork):
    """Productos y categorias comparten la sesion: se valida la categoria en la misma transaccion."""

    productos: ProductoRepository
    categorias: CategoriaRepository

    def _crear_repositorios(self) -> None:
        self.productos = ProductoRepository(self.session)
        self.categorias = CategoriaRepository(self.session)
