from sqlmodel import Field, SQLModel


class UnidadMedida(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50)
    simbolo: str = Field(max_length=10)
    tipo: str = Field(max_length=20)
