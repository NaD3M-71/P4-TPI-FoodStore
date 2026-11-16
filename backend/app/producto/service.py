from fastapi import HTTPException, status
from sqlmodel import Session, delete, func, select

from app.categoria.model import Categoria
from app.core.audit import ahora
from app.ingrediente.model import Ingrediente
from app.producto.model import Producto, ProductoCategoria, ProductoIngrediente
from app.producto.schema import (
    IngredienteEnProducto,
    ProductoCreate,
    ProductoIngredienteRead,
    ProductoPaginatedResponse,
    ProductoRead,
    ProductoUpdate,
)
from app.unidad_medida.model import UnidadMedida


def _no_encontrado(detalle: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detalle)


# ---------- Armado de las respuestas ----------


def _ingredientes_de(
    session: Session, producto_ids: list[int]
) -> dict[int, list[ProductoIngredienteRead]]:
    """Trae los ingredientes de varios productos con una sola consulta (sin N+1)."""
    consulta = (
        select(ProductoIngrediente, Ingrediente, UnidadMedida)
        .select_from(ProductoIngrediente)
        .join(Ingrediente, Ingrediente.id == ProductoIngrediente.ingrediente_id)
        .join(UnidadMedida, UnidadMedida.id == ProductoIngrediente.unidad_medida_id)
        .where(ProductoIngrediente.producto_id.in_(producto_ids))
        .order_by(ProductoIngrediente.producto_id, Ingrediente.id)
    )
    resultado: dict[int, list[ProductoIngredienteRead]] = {}
    for relacion, ingrediente, unidad in session.exec(consulta).all():
        resultado.setdefault(relacion.producto_id, []).append(
            ProductoIngredienteRead(
                ingrediente_id=ingrediente.id,
                ingrediente_nombre=ingrediente.nombre,
                cantidad=relacion.cantidad,
                unidad_medida_id=unidad.id,
                unidad_simbolo=unidad.simbolo,
            )
        )
    return resultado


def _a_lectura(session: Session, productos: list[Producto]) -> list[ProductoRead]:
    if not productos:
        return []
    ids = [p.id for p in productos]

    # La categoria principal va primero en categoria_ids
    relaciones = session.exec(
        select(ProductoCategoria)
        .where(ProductoCategoria.producto_id.in_(ids))
        .order_by(ProductoCategoria.es_principal.desc(), ProductoCategoria.categoria_id)
    ).all()
    categorias: dict[int, list[int]] = {}
    for relacion in relaciones:
        categorias.setdefault(relacion.producto_id, []).append(relacion.categoria_id)

    ingredientes = _ingredientes_de(session, ids)

    return [
        ProductoRead.model_validate(
            p,
            update={
                "categoria_ids": categorias.get(p.id, []),
                "ingredientes": ingredientes.get(p.id, []),
            },
        )
        for p in productos
    ]


# ---------- Validaciones de relaciones (antes de escribir nada, RN-17) ----------


def _deduplicar(ids: list[int]) -> list[int]:
    return list(dict.fromkeys(ids))  # conserva el orden


def _validar_categorias(session: Session, categoria_ids: list[int]) -> list[int]:
    ids = _deduplicar(categoria_ids)
    encontradas = set(
        session.exec(
            select(Categoria.id).where(
                Categoria.id.in_(ids), Categoria.deleted_at.is_(None)
            )
        ).all()
    )
    faltantes = [i for i in ids if i not in encontradas]
    if faltantes:  # RN-11
        raise _no_encontrado(f"Categoria(s) no encontrada(s): {faltantes}")
    return ids


def _validar_ingredientes(
    session: Session, ingredientes: list[IngredienteEnProducto]
) -> list[IngredienteEnProducto]:
    # Si un ingrediente viene repetido se queda con el ultimo
    unicos = {i.ingrediente_id: i for i in ingredientes}
    if not unicos:
        return []

    ingredientes_ok = set(
        session.exec(
            select(Ingrediente.id).where(
                Ingrediente.id.in_(list(unicos)), Ingrediente.deleted_at.is_(None)
            )
        ).all()
    )
    faltantes = [i for i in unicos if i not in ingredientes_ok]
    if faltantes:
        raise _no_encontrado(f"Ingrediente(s) no encontrado(s): {faltantes}")

    unidades_pedidas = {i.unidad_medida_id for i in unicos.values()}
    unidades_ok = set(
        session.exec(
            select(UnidadMedida.id).where(UnidadMedida.id.in_(list(unidades_pedidas)))
        ).all()
    )
    faltantes_u = sorted(unidades_pedidas - unidades_ok)
    if faltantes_u:
        raise _no_encontrado(f"Unidad(es) de medida no encontrada(s): {faltantes_u}")

    return list(unicos.values())


def _guardar_categorias(session: Session, producto_id: int, categoria_ids: list[int]):
    session.exec(delete(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id))
    for posicion, categoria_id in enumerate(categoria_ids):
        session.add(
            ProductoCategoria(
                producto_id=producto_id,
                categoria_id=categoria_id,
                es_principal=(posicion == 0),  # la primera es la principal
            )
        )


def _guardar_ingredientes(
    session: Session, producto_id: int, ingredientes: list[IngredienteEnProducto]
):
    session.exec(
        delete(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id)
    )
    for item in ingredientes:
        session.add(
            ProductoIngrediente(
                producto_id=producto_id,
                ingrediente_id=item.ingrediente_id,
                cantidad=item.cantidad,
                unidad_medida_id=item.unidad_medida_id,
            )
        )


# ---------- CRUD ----------


def listar(
    session: Session,
    offset: int,
    limit: int,
    nombre: str | None,
    incluir_inactivos: bool,
) -> ProductoPaginatedResponse:
    filtros = []
    if not incluir_inactivos:
        filtros.append(Producto.deleted_at.is_(None))
    if nombre:
        filtros.append(
            func.lower(Producto.nombre).contains(nombre.strip().lower(), autoescape=True)
        )

    total = session.exec(select(func.count()).select_from(Producto).where(*filtros)).one()
    productos = session.exec(
        select(Producto).where(*filtros).order_by(Producto.id).offset(offset).limit(limit)
    ).all()
    return ProductoPaginatedResponse(
        items=_a_lectura(session, list(productos)),
        total=total,
        offset=offset,
        limit=limit,
    )


def obtener_modelo(session: Session, producto_id: int) -> Producto:
    """RN-10: si no existe (o esta borrado logicamente) -> 404."""
    producto = session.get(Producto, producto_id)
    if producto is None or producto.deleted_at is not None:
        raise _no_encontrado("Producto no encontrado")
    return producto


def obtener(session: Session, producto_id: int) -> ProductoRead:
    return _a_lectura(session, [obtener_modelo(session, producto_id)])[0]


def crear(session: Session, data: ProductoCreate) -> ProductoRead:
    categoria_ids = _validar_categorias(session, data.categoria_ids)
    ingredientes = _validar_ingredientes(session, data.ingredientes)

    producto = Producto(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio_base=data.precio_base,
        imagenes_url=data.imagenes_url,
        disponible=data.disponible,
    )
    session.add(producto)
    session.flush()  # genera el id sin cerrar la transaccion

    _guardar_categorias(session, producto.id, categoria_ids)
    _guardar_ingredientes(session, producto.id, ingredientes)
    session.commit()
    session.refresh(producto)
    return _a_lectura(session, [producto])[0]


def actualizar(session: Session, producto_id: int, data: ProductoUpdate) -> ProductoRead:
    producto = obtener_modelo(session, producto_id)

    categoria_ids = (
        _validar_categorias(session, data.categoria_ids)
        if data.categoria_ids is not None
        else None
    )
    ingredientes = (
        _validar_ingredientes(session, data.ingredientes)
        if data.ingredientes is not None
        else None
    )

    producto.nombre = data.nombre
    producto.descripcion = data.descripcion
    producto.precio_base = data.precio_base
    producto.imagenes_url = data.imagenes_url
    producto.disponible = data.disponible
    session.add(producto)

    if categoria_ids is not None:
        _guardar_categorias(session, producto_id, categoria_ids)
    if ingredientes is not None:
        _guardar_ingredientes(session, producto_id, ingredientes)

    session.commit()
    session.refresh(producto)
    return _a_lectura(session, [producto])[0]


def eliminar(session: Session, producto_id: int) -> None:
    producto = obtener_modelo(session, producto_id)

    # Borrado logico del producto + cascada sobre sus asociaciones (RN-14)
    session.exec(delete(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id))
    session.exec(delete(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id))
    producto.deleted_at = ahora()
    session.add(producto)
    session.commit()


# ---------- Relaciones N:M (solo consulta) ----------


def listar_categorias(session: Session, producto_id: int) -> list[Categoria]:
    obtener_modelo(session, producto_id)  # 404 si no existe
    return list(
        session.exec(
            select(Categoria)
            .join(ProductoCategoria, ProductoCategoria.categoria_id == Categoria.id)
            .where(
                ProductoCategoria.producto_id == producto_id,
                Categoria.deleted_at.is_(None),
            )
            .order_by(ProductoCategoria.es_principal.desc(), Categoria.id)
        ).all()
    )


def listar_ingredientes(
    session: Session, producto_id: int
) -> list[ProductoIngredienteRead]:
    obtener_modelo(session, producto_id)  # 404 si no existe
    return _ingredientes_de(session, [producto_id]).get(producto_id, [])


def listar_por_categoria(session: Session, categoria_id: int) -> list[ProductoRead]:
    productos = session.exec(
        select(Producto)
        .join(ProductoCategoria, ProductoCategoria.producto_id == Producto.id)
        .where(
            ProductoCategoria.categoria_id == categoria_id,
            Producto.deleted_at.is_(None),
        )
        .order_by(Producto.id)
    ).all()
    return _a_lectura(session, list(productos))
