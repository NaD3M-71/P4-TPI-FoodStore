from sqlmodel import Session, select

from app.core.repository import BaseRepository
from app.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    def get_activo(self, pedido_id: int) -> Pedido | None:
        """Devuelve el pedido, o None si no existe o esta borrado logicamente."""
        pedido = self.get_by_id(pedido_id)
        if pedido is None or pedido.deleted_at is not None:
            return None
        return pedido

    def list_activos(self) -> list[Pedido]:
        consulta = select(Pedido).where(Pedido.deleted_at.is_(None)).order_by(Pedido.id)
        return list(self.session.exec(consulta).all())


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    def __init__(self, session: Session):
        super().__init__(session, DetallePedido)

    def list_by_pedidos(self, pedido_ids: list[int]) -> dict[int, list[DetallePedido]]:
        """Trae los detalles de varios pedidos con una sola consulta."""
        if not pedido_ids:
            return {}
        consulta = (
            select(DetallePedido)
            .where(DetallePedido.pedido_id.in_(pedido_ids))
            .order_by(DetallePedido.pedido_id, DetallePedido.producto_id)
        )
        resultado: dict[int, list[DetallePedido]] = {}
        for detalle in self.session.exec(consulta).all():
            resultado.setdefault(detalle.pedido_id, []).append(detalle)
        return resultado

    def list_by_pedido(self, pedido_id: int) -> list[DetallePedido]:
        return self.list_by_pedidos([pedido_id]).get(pedido_id, [])
