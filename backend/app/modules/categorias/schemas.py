from pydantic import model_validator
from sqlmodel import Field, SQLModel


class CategoriaCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = None


class CategoriaUpdate(SQLModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = None

    @model_validator(mode="after")
    def nombre_no_nulo(self):
        # Si se envia nombre, no puede ser null (es obligatorio en la tabla)
        if "nombre" in self.model_fields_set and self.nombre is None:
            raise ValueError("nombre no puede ser nulo")
        return self


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None = None
    activo: bool
