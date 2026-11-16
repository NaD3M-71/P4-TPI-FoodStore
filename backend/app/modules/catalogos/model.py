from sqlmodel import Field, SQLModel


class EstadoPedido(SQLModel, table=True):
    """Tabla de catalogo: se carga con seed.py y la API solo la lee (RN-06)."""

    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=100)
    orden: int = Field(default=0)
