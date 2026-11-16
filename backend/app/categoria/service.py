from fastapi import HTTPException, status
from sqlmodel import Session, func, select

from app.categoria.model import Categoria
from app.categoria.schema import (
    CategoriaCreate,
    CategoriaPaginatedResponse,
    CategoriaUpdate,
)
from app.core.audit import ahora
from app.producto.model import Producto, ProductoCategoria


def _nombre_duplicado(
    session: Session, nombre: str, excluir_id: int | None = None
) -> bool:
    """RN-02: unicidad sin distinguir mayusculas ni espacios externos.

    Solo se comparan categorias activas (las borradas logicamente no cuentan).
    """
    consulta = select(Categoria.id, Categoria.nombre).where(
        Categoria.deleted_at.is_(None)
    )
    objetivo = nombre.strip().casefold()
    for categoria_id, otro in session.exec(consulta).all():
        if categoria_id != excluir_id and otro.strip().casefold() == objetivo:
            return True
    return False


def listar(
    session: Session,
    offset: int,
    limit: int,
    nombre: str | None,
    incluir_inactivos: bool,
) -> CategoriaPaginatedResponse:
    filtros = []
    if not incluir_inactivos:
        filtros.append(Categoria.deleted_at.is_(None))
    if nombre:
        filtros.append(
            func.lower(Categoria.nombre).contains(nombre.strip().lower(), autoescape=True)
        )

    # El total y la pagina se piden por separado: count en SQL, sin traer todo
    total = session.exec(select(func.count()).select_from(Categoria).where(*filtros)).one()
    items = session.exec(
        select(Categoria).where(*filtros).order_by(Categoria.id).offset(offset).limit(limit)
    ).all()
    return CategoriaPaginatedResponse(
        items=list(items), total=total, offset=offset, limit=limit
    )


def obtener(session: Session, categoria_id: int) -> Categoria:
    """RN-04: si no existe (o esta borrada logicamente) -> 404."""
    categoria = session.get(Categoria, categoria_id)
    if categoria is None or categoria.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada"
        )
    return categoria


def crear(session: Session, data: CategoriaCreate) -> Categoria:
    if _nombre_duplicado(session, data.nombre):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoria con ese nombre",
        )
    categoria = Categoria.model_validate(data)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


def actualizar(session: Session, categoria_id: int, data: CategoriaUpdate) -> Categoria:
    categoria = obtener(session, categoria_id)
    if _nombre_duplicado(session, data.nombre, excluir_id=categoria_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoria con ese nombre",
        )
    categoria.nombre = data.nombre
    categoria.descripcion = data.descripcion
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


def eliminar(session: Session, categoria_id: int) -> None:
    categoria = obtener(session, categoria_id)

    # RN-05: no se puede eliminar si tiene productos (activos) asociados
    productos_asociados = session.exec(
        select(func.count())
        .select_from(ProductoCategoria)
        .join(Producto, Producto.id == ProductoCategoria.producto_id)
        .where(
            ProductoCategoria.categoria_id == categoria_id,
            Producto.deleted_at.is_(None),
        )
    ).one()
    if productos_asociados > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar: la categoria tiene productos asociados",
        )

    # Borrado logico: no se borra la fila
    categoria.deleted_at = ahora()
    session.add(categoria)
    session.commit()
