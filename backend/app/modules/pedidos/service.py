from datetime import datetime

from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.schemas import UserPublic

# Mapa de la maquina de estados (RN-02): estado actual -> estados a los que puede pasar
TRANSICIONES: dict[str, list[str]] = {
    "PENDIENTE": ["EN_PREPARACION", "CANCELADO"],
    "EN_PREPARACION": ["ENTREGADO", "CANCELADO"],
    "ENTREGADO": [],
    "CANCELADO": [],
}


class PedidoNoEncontrado(Exception):
    def __init__(self, pedido_id: int):
        super().__init__(f"Pedido {pedido_id} no encontrado")


class PedidoAjeno(Exception):
    def __init__(self):
        super().__init__("El pedido pertenece a otro usuario")


class ProductoRepetido(Exception):
    def __init__(self, producto_id: int):
        super().__init__(f"El producto {producto_id} esta repetido en el pedido")


class ProductoNoDisponible(Exception):
    def __init__(self, nombre: str):
        super().__init__(f"El producto '{nombre}' no esta disponible")


class StockInsuficiente(Exception):
    def __init__(self, nombre: str, stock: int, cantidad: int):
        super().__init__(
            f"Stock insuficiente de '{nombre}': hay {stock} y se pidieron {cantidad}"
        )


class TransicionInvalida(Exception):
    pass


def _obtener(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
    pedido = uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        raise PedidoNoEncontrado(pedido_id)
    return pedido


def _validar_transicion(estado_actual: str, nuevo: str) -> None:
    if nuevo not in TRANSICIONES[estado_actual]:
        raise TransicionInvalida(f"No se puede pasar de {estado_actual} a {nuevo}")


def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
    """RN-03: devuelve el stock de cada linea. Se hace en la misma transaccion que el cambio de estado."""
    for linea in pedido.items:
        producto = uow.productos.get_by_id(linea.producto_id)  # aunque este dado de baja
        if producto is not None:
            producto.stock += linea.cantidad
            uow.productos.add(producto)


def _cancelar(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
    _restituir_stock(uow, pedido)
    pedido.estado = "CANCELADO"
    uow.pedidos.add(pedido)


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork):
        self.uow = uow

    def crear(self, data: PedidoCreate, usuario_id: int) -> PedidoRead:
        """RN-01: todo ocurre en una transaccion. Si algo falla no se persiste nada."""
        ids = [item.producto_id for item in data.items]
        with self.uow as uow:
            for producto_id in ids:
                if ids.count(producto_id) > 1:
                    raise ProductoRepetido(producto_id)

            pedido = uow.pedidos.add(
                Pedido(
                    usuario_id=usuario_id,
                    estado="PENDIENTE",
                    forma_pago=data.forma_pago,
                    direccion_entrega=data.direccion_entrega,
                    notas=data.notas,
                    total=0.0,
                )
            )
            total = 0.0
            for item in data.items:
                producto = uow.productos.get_activo(item.producto_id)
                if producto is None:
                    raise ProductoNoEncontrado(item.producto_id)
                if not producto.disponible:
                    raise ProductoNoDisponible(producto.nombre)
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(producto.nombre, producto.stock, item.cantidad)

                producto.stock -= item.cantidad
                uow.productos.add(producto)
                subtotal = round(producto.precio_base * item.cantidad, 2)
                # Copia del nombre y del precio: el pedido no cambia si el producto cambia
                uow.pedidos.add_detalle(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=producto.id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)

    def listar(
        self, usuario: UserPublic, skip: int, limit: int, estado: EstadoPedido | None
    ) -> PedidosPaginados:
        """El admin ve todos los pedidos; el cliente, solo los suyos (RN-04)."""
        with self.uow as uow:
            if usuario.role == "admin":
                pedidos, total = uow.pedidos.list_all(estado, skip, limit)
            else:
                pedidos, total = uow.pedidos.list_by_usuario(usuario.id, estado, skip, limit)
            return PedidosPaginados(
                total=total, items=[PedidoRead.model_validate(p) for p in pedidos]
            )

    def obtener(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = _obtener(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno()
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, data: CambioEstado) -> PedidoRead:
        """Solo admin (RN-02 y RN-03). La transicion se valida antes de modificar el pedido."""
        with self.uow as uow:
            pedido = _obtener(uow, pedido_id)
            _validar_transicion(pedido.estado, data.estado)
            if data.estado == "CANCELADO":
                _cancelar(uow, pedido)
            else:
                pedido.estado = data.estado
                uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        """El dueno cancela su pedido solo si esta PENDIENTE (RN-03 y RN-04)."""
        with self.uow as uow:
            pedido = _obtener(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno()
            if pedido.estado != "PENDIENTE":
                raise TransicionInvalida("Solo se puede cancelar un pedido en estado PENDIENTE")
            _cancelar(uow, pedido)
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            por_estado = uow.pedidos.count_by_estado()
            hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=por_estado.get("PENDIENTE", 0),
                en_preparacion=por_estado.get("EN_PREPARACION", 0),
                entregados=por_estado.get("ENTREGADO", 0),
                cancelados=por_estado.get("CANCELADO", 0),
                pedidos_hoy=uow.pedidos.count_desde(hoy),
                ingresos_entregados=uow.pedidos.sum_total_por_estado("ENTREGADO"),
            )
