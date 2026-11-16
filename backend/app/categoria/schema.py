from datetime import datetime
from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import SQLModel

# RN-01: obligatorio, min_length=1 y no puede ser solo espacios
# (strip_whitespace recorta los espacios antes de validar el largo)
NombreCategoria = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class CategoriaCreate(SQLModel):
    nombre: NombreCategoria
    descripcion: str = ""  # RN-03


class CategoriaUpdate(SQLModel):
    nombre: NombreCategoria
    descripcion: str = ""


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class CategoriaPaginatedResponse(SQLModel):
    items: list[CategoriaRead]
    total: int
    offset: int
    limit: int
