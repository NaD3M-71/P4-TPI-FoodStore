from datetime import datetime

from sqlmodel import Field, SQLModel

from app.core.audit import AuditMixin, ahora


class Usuario(AuditMixin, table=True):
    """Dominio Identidad & Acceso. deleted_at completo = cuenta desactivada."""

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    apellido: str = Field(max_length=100)
    email: str = Field(max_length=255, unique=True, index=True)  # RN-02
    celular: str | None = Field(default=None, max_length=30)
    password_hash: str = Field(max_length=255)  # RN-01: hash bcrypt, nunca texto plano


class Rol(SQLModel, table=True):
    """Tabla de catalogo: se carga con seed.py y la API solo la lee (RN-06)."""

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True, index=True)  # RN-02
    descripcion: str = Field(default="", max_length=255)


class UsuarioRol(SQLModel, table=True):
    """Tabla de enlace Usuario - Rol (sin deleted_at: quitar un rol borra la fila)."""

    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    rol_id: int = Field(foreign_key="rol.id", primary_key=True)
    # Usuario que asigno el rol; nulo cuando lo asigna el registro
    asignado_por_id: int | None = Field(default=None, foreign_key="usuario.id")
    # Nulo significa sin vencimiento (RN-14)
    expires_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=ahora)
