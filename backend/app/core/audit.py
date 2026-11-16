from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def ahora() -> datetime:
    return datetime.now(timezone.utc)


class AuditMixin(SQLModel):
    """Campos de auditoria del diagrama UML.

    deleted_at distinto de None significa borrado logico (soft delete).
    """

    created_at: datetime = Field(default_factory=ahora, nullable=False)
    updated_at: datetime = Field(
        default_factory=ahora,
        nullable=False,
        sa_column_kwargs={"onupdate": ahora},
    )
    deleted_at: datetime | None = Field(default=None)
