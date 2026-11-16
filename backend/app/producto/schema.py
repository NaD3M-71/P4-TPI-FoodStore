from datetime import datetime
from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

# RN-06: obligatorio, min_length=1 y no puede ser solo espacios. No es unico.
NombreProducto = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)
]


class IngredienteEnProducto(SQLModel):
    """Ingrediente que se envia dentro del body al crear/editar un producto."""

    ingrediente_id: int
    cantidad: float = Field(gt=0)
    unidad_medida_id: int


class ProductoCreate(SQLModel):
    nombre: NombreProducto
    descripcion: str | None = None
    precio_base: float = Field(ge=0)  # RN-07
    imagenes_url: list[str] = Field(default_factory=list)  # RN-09
    disponible: bool = True  # RN-08
    categoria_ids: list[int] = Field(min_length=1)  # RN-19
    ingredientes: list[IngredienteEnProducto] = Field(default_factory=list)  # RN-20


class ProductoUpdate(SQLModel):
    nombre: NombreProducto
    descripcion: str | None = None
    precio_base: float = Field(ge=0)
    imagenes_url: list[str] = Field(default_factory=list)
    disponible: bool = True
    # Si se envian, reemplazan por completo lo existente (RN-12, RN-21).
    # Si se omiten (None), las relaciones quedan como estaban.
    categoria_ids: list[int] | None = Field(default=None, min_length=1)
    ingredientes: list[IngredienteEnProducto] | None = None


class ProductoIngredienteRead(SQLModel):
    ingrediente_id: int
    ingrediente_nombre: str
    cantidad: float
    unidad_medida_id: int
    unidad_simbolo: str


class ProductoRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None = None
    precio_base: float
    imagenes_url: list[str]
    disponible: bool
    categoria_ids: list[int] = Field(default_factory=list)
    ingredientes: list[ProductoIngredienteRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class ProductoPaginatedResponse(SQLModel):
    items: list[ProductoRead]
    total: int
    offset: int
    limit: int
