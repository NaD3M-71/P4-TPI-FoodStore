from sqlmodel import SQLModel


class UnidadMedidaRead(SQLModel):
    id: int
    nombre: str
    simbolo: str
    tipo: str


class UnidadMedidaListResponse(SQLModel):
    items: list[UnidadMedidaRead]
    total: int
