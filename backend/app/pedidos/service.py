from app.core.audit import ahora
from app.pedidos.models import DetallePedido, Pedido
from app.pedidos.schemas import (
    DetallePedidoRead,
    PedidoCreate,
    PedidoRead,
    PedidoUpdate,
)
from app.pedidos.unit_of_work import PedidoUnitOfWork


class PedidoNoEncontrado(Exception):
    def __init__(self, pedido_id: int):
        super().__init__(f"Pedido {pedido_id} no encontrado")


class ProductoNoEncontrado(Exception):
    def __init__(self, producto_id: int):
        super().__init__(f"Producto {producto_id} no encontrado")


def _a_lectura(pedido: Pedido, detalles: list[DetallePedido]) -> PedidoRead:
    return PedidoRead.model_validate(
        pedido,
        update={"detalles": [DetallePedidoRead.model_validate(d) for d in detalles]},
    )


class PedidoService:
    """Reglas de negocio de los pedidos.

    No escribe SQL ni hace commit: usa los repositorios del Unit of Work.
    El valor de retorno se convierte a PedidoRead dentro del bloque with,
    porque despues del commit la sesion se cierra y los objetos quedan vacios.
    """

    def __init__(self, uow: PedidoUnitOfWork):
        self.uow = uow

    def crear(self, data: PedidoCreate, usuario_id: int) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.create(
                Pedido(estado="PENDIENTE", total=0.0, usuario_id=usuario_id)
            )
            total = 0.0
            detalles: list[DetallePedido] = []
            for item in data.detalles:
                producto = uow.productos.get_activo(item.producto_id)
                if producto is None:
                    # Provoca el rollback: el pedido ya creado tambien se descarta
                    raise ProductoNoEncontrado(item.producto_id)
                detalle = uow.detalles.create(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=producto.id,
                        cantidad=item.cantidad,
                        precio_unitario=producto.precio_base,
                    )
                )
                detalles.append(detalle)
                total += item.cantidad * producto.precio_base
            pedido.total = round(total, 2)
            return _a_lectura(pedido, detalles)

    def listar(self) -> list[PedidoRead]:
        with self.uow as uow:
            pedidos = uow.pedidos.list_activos()
            detalles = uow.detalles.list_by_pedidos([p.id for p in pedidos])
            return [_a_lectura(p, detalles.get(p.id, [])) for p in pedidos]

    def obtener(self, pedido_id: int) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_activo(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado(pedido_id)
            return _a_lectura(pedido, uow.detalles.list_by_pedido(pedido_id))

    def actualizar_estado(self, pedido_id: int, data: PedidoUpdate) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_activo(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado(pedido_id)
            pedido.estado = data.estado.value
            uow.session.add(pedido)
            uow.session.flush()
            return _a_lectura(pedido, uow.detalles.list_by_pedido(pedido_id))

    def eliminar(self, pedido_id: int) -> None:
        with self.uow as uow:
            pedido = uow.pedidos.get_activo(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado(pedido_id)
            # Borrado logico: no se borra la fila
            pedido.deleted_at = ahora()
            uow.session.add(pedido)
