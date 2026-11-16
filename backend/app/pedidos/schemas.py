from datetime import datetime
from enum import Enum

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class EstadoPedido(str, Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADO = "CONFIRMADO"
    EN_PREP = "EN_PREP"
    EN_CAMINO = "EN_CAMINO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


class DetallePedidoCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)  # mayor o igual a 1


class PedidoCreate(SQLModel):
    # RN-12: al menos un detalle y sin productos repetidos
    detalles: list[DetallePedidoCreate] = Field(min_length=1)

    @field_validator("detalles")
    @classmethod
    def sin_productos_repetidos(
        cls, detalles: list[DetallePedidoCreate]
    ) -> list[DetallePedidoCreate]:
        ids = [d.producto_id for d in detalles]
        if len(ids) != len(set(ids)):
            raise ValueError("Un mismo producto no puede repetirse en los detalles")
        return detalles


class PedidoUpdate(SQLModel):
    # Un estado fuera de los cuatro permitidos hace que FastAPI responda 422
    estado: EstadoPedido


class DetallePedidoRead(SQLModel):
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: float


class PedidoRead(SQLModel):
    id: int
    fecha: datetime
    estado: str
    total: float
    usuario_id: int | None = None
    detalles: list[DetallePedidoRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
