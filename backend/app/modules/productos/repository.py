from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(session, Producto)

    def get_activo(self, producto_id: int) -> Producto | None:
        producto = self.get_by_id(producto_id)
        if producto is None or not producto.activo:
            return None
        return producto

    def search(
        self,
        skip: int,
        limit: int,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> tuple[list[Producto], int]:
        """Productos activos filtrados, con el total antes de paginar."""
        filtros = [col(Producto.activo).is_(True)]
        if search:
            filtros.append(col(Producto.nombre).icontains(search, autoescape=True))
        if categoria_id is not None:
            filtros.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            filtros.append(Producto.disponible == disponible)

        total = self.session.exec(select(func.count()).select_from(Producto).where(*filtros)).one()
        consulta = (
            select(Producto)
            .where(*filtros)
            .order_by(Producto.id)
            .offset(skip)
            .limit(limit)
            .options(selectinload(Producto.categoria))
        )
        return list(self.session.exec(consulta).all()), total
