from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    def __init__(self, producto_id: int):
        super().__init__(f"Producto {producto_id} no encontrado")


def _obtener_activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
    """Un producto dado de baja se trata como inexistente."""
    producto = uow.productos.get_activo(producto_id)
    if producto is None:
        raise ProductoNoEncontrado(producto_id)
    return producto


def _validar_categoria(uow: ProductoUnitOfWork, categoria_id: int) -> None:
    categoria = uow.categorias.get_by_id(categoria_id)
    if categoria is None or not categoria.activo:
        raise CategoriaNoEncontrada(categoria_id)


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork):
        self.uow = uow

    def listar(
        self,
        skip: int,
        limit: int,
        search: str | None,
        categoria_id: int | None,
        disponible: bool | None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            productos, total = uow.productos.search(skip, limit, search, categoria_id, disponible)
            return ProductosPaginados(
                total=total, items=[ProductoRead.model_validate(p) for p in productos]
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(_obtener_activo(uow, producto_id))

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            _validar_categoria(uow, data.categoria_id)
            producto = uow.productos.add(Producto(**data.model_dump()))
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = _obtener_activo(uow, producto_id)
            campos = data.model_dump(exclude_unset=True)  # solo lo enviado: el resto se conserva
            if "categoria_id" in campos:
                _validar_categoria(uow, campos["categoria_id"])
            for campo, valor in campos.items():
                setattr(producto, campo, valor)
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(self, producto_id: int, data: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = _obtener_activo(uow, producto_id)
            producto.stock = data.stock
            producto.disponible = data.disponible
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        # Baja logica: no se borra la fila (los pedidos viejos siguen referenciandola)
        with self.uow as uow:
            producto = _obtener_activo(uow, producto_id)
            producto.activo = False
            uow.productos.add(producto)
