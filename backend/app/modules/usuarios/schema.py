from datetime import datetime
from typing import Annotated

from pydantic import EmailStr, StringConstraints, field_validator
from sqlmodel import Field, SQLModel

NombrePersona = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class UserCreate(SQLModel):
    """Lo que entra al registrarse. La contrasena viaja en texto plano y se guarda como hash."""

    nombre: NombrePersona
    apellido: NombrePersona
    email: EmailStr  # RN-09: un email invalido responde 422
    celular: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=72)  # RN-09

    @field_validator("celular")
    @classmethod
    def celular_vacio_es_nulo(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        valor = valor.strip()
        return valor or None

    @field_validator("password")
    @classmethod
    def limite_de_bytes_de_bcrypt(cls, valor: str) -> str:
        # bcrypt solo procesa los primeros 72 bytes: un caracter acentuado ocupa mas de uno
        if len(valor.encode("utf-8")) > 72:
            raise ValueError("La contrasena no puede superar los 72 bytes")
        return valor


class UserPublic(SQLModel):
    """Lo que sale: sin password_hash y con los nombres de los roles vigentes."""

    id: int
    nombre: str
    apellido: str
    email: str
    celular: str | None = None
    roles: list[str] = Field(default_factory=list)
    activo: bool = True
    created_at: datetime
    deleted_at: datetime | None = None


class RolRead(SQLModel):
    id: int
    nombre: str
    descripcion: str
