from datetime import datetime

from sqlmodel import Field, SQLModel

from app.core.audit import AuditMixin, ahora


class Pedido(AuditMixin, table=True):
    id: int | None = Field(default=None, primary_key=True)
    fecha: datetime = Field(default_factory=ahora, nullable=False)  # la asigna el backend
    estado: str = Field(default="PENDIENTE", max_length=20)  # se guarda como texto
    total: float = Field(default=0.0)  # suma de cantidad * precio_unitario de los detalles
    # Usuario que creo el pedido: se toma de la sesion, nunca del body
    usuario_id: int | None = Field(default=None, foreign_key="usuario.id", index=True)
    # deleted_at viene de AuditMixin: se completa en el borrado logico


class DetallePedido(SQLModel, table=True):
    # Clave primaria compuesta (pedido_id, producto_id), como en el diagrama UML
    pedido_id: int = Field(foreign_key="pedido.id", primary_key=True)
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    cantidad: int = Field(ge=1)
    precio_unitario: float = Field(ge=0)  # precio_base del producto al crear el pedido
