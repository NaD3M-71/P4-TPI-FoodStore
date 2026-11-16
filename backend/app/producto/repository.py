from sqlmodel import Session

from app.core.repository import BaseRepository
from app.producto.model import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(session, Producto)

    def get_activo(self, producto_id: int) -> Producto | None:
        """Devuelve el producto, o None si no existe o esta borrado logicamente."""
        producto = self.get_by_id(producto_id)
        if producto is None or producto.deleted_at is not None:
            return None
        return producto
