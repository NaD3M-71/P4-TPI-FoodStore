from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    """Repositorio base con el CRUD generico.

    Nunca llama a commit(): eso lo hace solo el Unit of Work.
    flush() envia el SQL a la base dentro de la transaccion en curso, asi el
    objeto ya tiene su id disponible sin confirmar nada.
    """

    def __init__(self, session: Session, model: type[ModelT]):
        self.session = session
        self.model = model

    def create(self, obj: ModelT) -> ModelT:
        self.session.add(obj)
        self.session.flush()
        return obj

    def get_by_id(self, obj_id: int) -> ModelT | None:
        return self.session.get(self.model, obj_id)

    def get_all(self) -> list[ModelT]:
        return list(self.session.exec(select(self.model)).all())

    def delete(self, obj: ModelT) -> None:
        self.session.delete(obj)
        self.session.flush()
