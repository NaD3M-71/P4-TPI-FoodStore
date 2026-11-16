from sqlmodel import Field

from app.core.audit import AuditMixin


class Ingrediente(AuditMixin, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, index=True)
    descripcion: str | None = Field(default=None)
