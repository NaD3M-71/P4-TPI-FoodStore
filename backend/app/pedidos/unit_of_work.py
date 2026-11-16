from app.core.unit_of_work import UnitOfWork
from app.pedidos.repository import DetallePedidoRepository, PedidoRepository
from app.producto.repository import ProductoRepository


class PedidoUnitOfWork(UnitOfWork):
    """Expone los repositorios que necesitan los casos de uso de pedidos.

    Los tres comparten la misma sesion, asi que todo lo que se hace con ellos
    dentro del bloque with se confirma (o se descarta) junto.
    """

    pedidos: PedidoRepository
    detalles: DetallePedidoRepository
    productos: ProductoRepository

    def _crear_repositorios(self) -> None:
        self.pedidos = PedidoRepository(self.session)
        self.detalles = DetallePedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)
