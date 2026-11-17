from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle

    def _paginar(self, filtros: list, skip: int, limit: int) -> tuple[list[Pedido], int]:
        total = self.session.exec(select(func.count()).select_from(Pedido).where(*filtros)).one()
        consulta = (
            select(Pedido)
            .where(*filtros)
            .order_by(col(Pedido.id).desc())  # los mas recientes primero
            .offset(skip)
            .limit(limit)
            .options(selectinload(Pedido.items))
        )
        return list(self.session.exec(consulta).all()), total

    def list_by_usuario(
        self, usuario_id: int, estado: str | None, skip: int, limit: int
    ) -> tuple[list[Pedido], int]:
        filtros = [Pedido.usuario_id == usuario_id]
        if estado is not None:
            filtros.append(Pedido.estado == estado)
        return self._paginar(filtros, skip, limit)

    def list_all(self, estado: str | None, skip: int, limit: int) -> tuple[list[Pedido], int]:
        filtros = [Pedido.estado == estado] if estado is not None else []
        return self._paginar(filtros, skip, limit)

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(select(Pedido.estado, func.count()).group_by(Pedido.estado)).all()
        return {estado: cantidad for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        consulta = select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)
        return self.session.exec(consulta).one()

    def sum_total_por_estado(self, estado: str) -> float:
        consulta = select(func.coalesce(func.sum(Pedido.total), 0.0)).where(Pedido.estado == estado)
        return float(self.session.exec(consulta).one())
