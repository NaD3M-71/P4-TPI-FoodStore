from fastapi import HTTPException, status
from sqlmodel import Session, func, select

from app.core.audit import ahora
from app.ingrediente.model import Ingrediente
from app.ingrediente.schema import (
    IngredienteCreate,
    IngredientePaginatedResponse,
    IngredienteUpdate,
)
from app.producto.model import Producto, ProductoIngrediente


def listar(session: Session, offset: int, limit: int) -> IngredientePaginatedResponse:
    activo = Ingrediente.deleted_at.is_(None)
    total = session.exec(select(func.count()).select_from(Ingrediente).where(activo)).one()
    items = session.exec(
        select(Ingrediente).where(activo).order_by(Ingrediente.id).offset(offset).limit(limit)
    ).all()
    return IngredientePaginatedResponse(
        items=list(items), total=total, offset=offset, limit=limit
    )


def obtener(session: Session, ingrediente_id: int) -> Ingrediente:
    ingrediente = session.get(Ingrediente, ingrediente_id)
    if ingrediente is None or ingrediente.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado"
        )
    return ingrediente


def crear(session: Session, data: IngredienteCreate) -> Ingrediente:
    ingrediente = Ingrediente.model_validate(data)
    session.add(ingrediente)
    session.commit()
    session.refresh(ingrediente)
    return ingrediente


def actualizar(
    session: Session, ingrediente_id: int, data: IngredienteUpdate
) -> Ingrediente:
    ingrediente = obtener(session, ingrediente_id)
    ingrediente.nombre = data.nombre
    ingrediente.descripcion = data.descripcion
    session.add(ingrediente)
    session.commit()
    session.refresh(ingrediente)
    return ingrediente


def eliminar(session: Session, ingrediente_id: int) -> None:
    ingrediente = obtener(session, ingrediente_id)

    # Mismo criterio que las categorias: no se borra si lo usa algun producto activo
    en_uso = session.exec(
        select(func.count())
        .select_from(ProductoIngrediente)
        .join(Producto, Producto.id == ProductoIngrediente.producto_id)
        .where(
            ProductoIngrediente.ingrediente_id == ingrediente_id,
            Producto.deleted_at.is_(None),
        )
    ).one()
    if en_uso > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar: el ingrediente esta asociado a productos",
        )

    ingrediente.deleted_at = ahora()
    session.add(ingrediente)
    session.commit()
