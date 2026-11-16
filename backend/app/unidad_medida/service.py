from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.unidad_medida.model import UnidadMedida
from app.unidad_medida.schema import UnidadMedidaListResponse


def listar(session: Session) -> UnidadMedidaListResponse:
    unidades = list(session.exec(select(UnidadMedida).order_by(UnidadMedida.id)).all())
    return UnidadMedidaListResponse(items=unidades, total=len(unidades))


def obtener(session: Session, unidad_id: int) -> UnidadMedida:
    unidad = session.get(UnidadMedida, unidad_id)
    if unidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidad de medida no encontrada",
        )
    return unidad
