from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    def __init__(self, categoria_id: int):
        super().__init__(f"Categoria {categoria_id} no encontrada")


class NombreDuplicado(Exception):
    def __init__(self, nombre: str):
        super().__init__(f"Ya existe una categoria con el nombre '{nombre}'")


def _obtener_activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
    """Una categoria dada de baja se trata como inexistente."""
    categoria = uow.categorias.get_by_id(categoria_id)
    if categoria is None or not categoria.activo:
        raise CategoriaNoEncontrada(categoria_id)
    return categoria


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork):
        self.uow = uow

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(_obtener_activa(uow, categoria_id))

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            if uow.categorias.get_by_nombre(data.nombre) is not None:
                raise NombreDuplicado(data.nombre)
            categoria = uow.categorias.add(Categoria(**data.model_dump()))
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = _obtener_activa(uow, categoria_id)
            campos = data.model_dump(exclude_unset=True)  # solo lo enviado: el resto se conserva
            nombre = campos.get("nombre")
            if nombre is not None and nombre != categoria.nombre:
                if uow.categorias.get_by_nombre(nombre) is not None:
                    raise NombreDuplicado(nombre)
            for campo, valor in campos.items():
                setattr(categoria, campo, valor)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        # Baja logica: no se borra la fila y sus productos no se tocan
        with self.uow as uow:
            categoria = _obtener_activa(uow, categoria_id)
            categoria.activo = False
            uow.categorias.add(categoria)
