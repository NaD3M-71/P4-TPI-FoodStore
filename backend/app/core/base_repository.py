from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    """Repositorio base con las operaciones genericas.

    Nunca llama a commit(): eso lo hace solo el Unit of Work.
    flush() envia el SQL dentro de la transaccion en curso, asi el objeto
    ya tiene su id sin confirmar nada.
    """

    def __init__(self, session: Session, model: type[ModelT]):
        self.session = session
        self.model = model

    def get_by_id(self, obj_id: int) -> ModelT | None:
        return self.session.get(self.model, obj_id)

    def get_all(self) -> list[ModelT]:
        return list(self.session.exec(select(self.model)).all())

    def add(self, obj: ModelT) -> ModelT:
        self.session.add(obj)
        self.session.flush()
        return obj

    def delete(self, obj: ModelT) -> None:
        self.session.delete(obj)
        self.session.flush()
