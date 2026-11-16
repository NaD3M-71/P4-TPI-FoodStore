from datetime import datetime
from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import SQLModel

NombreIngrediente = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class IngredienteCreate(SQLModel):
    nombre: NombreIngrediente
    descripcion: str | None = None


class IngredienteUpdate(SQLModel):
    nombre: NombreIngrediente
    descripcion: str | None = None


class IngredienteRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class IngredientePaginatedResponse(SQLModel):
    items: list[IngredienteRead]
    total: int
    offset: int
    limit: int
