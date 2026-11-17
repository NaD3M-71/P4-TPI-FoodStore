from pydantic import model_validator
from sqlmodel import Field, SQLModel

from app.modules.categorias.schemas import CategoriaRead

# Campos que no admiten null cuando se envian en un PUT
_OBLIGATORIOS = ("nombre", "precio_base", "stock", "disponible", "categoria_id")


class ProductoCreate(SQLModel):
    nombre: str = Field(min_length=1)
    descripcion: str | None = None
    precio_base: float = Field(ge=0)
    imagen_url: str | None = None
    stock: int = Field(default=0, ge=0)
    disponible: bool = True
    categoria_id: int


class ProductoUpdate(SQLModel):
    nombre: str | None = Field(default=None, min_length=1)
    descripcion: str | None = None
    precio_base: float | None = Field(default=None, ge=0)
    imagen_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None
    categoria_id: int | None = None

    @model_validator(mode="after")
    def obligatorios_no_nulos(self):
        for campo in _OBLIGATORIOS:
            if campo in self.model_fields_set and getattr(self, campo) is None:
                raise ValueError(f"{campo} no puede ser nulo")
        return self


class ProductoStockUpdate(SQLModel):
    stock: int = Field(ge=0)
    disponible: bool


class ProductoRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None = None
    precio_base: float
    imagen_url: str | None = None
    stock: int
    disponible: bool
    activo: bool
    categoria_id: int
    categoria: CategoriaRead


class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]
