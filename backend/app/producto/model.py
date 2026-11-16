from datetime import datetime

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.core.audit import AuditMixin, ahora


class Producto(AuditMixin, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=150)
    descripcion: str | None = Field(default=None)
    precio_base: float = Field(ge=0)
    imagenes_url: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    disponible: bool = Field(default=True)


class ProductoCategoria(SQLModel, table=True):
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)
    created_at: datetime = Field(default_factory=ahora)


class ProductoIngrediente(SQLModel, table=True):
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", primary_key=True)
    cantidad: float = Field(gt=0)
    unidad_medida_id: int = Field(foreign_key="unidadmedida.id")
    created_at: datetime = Field(default_factory=ahora)
