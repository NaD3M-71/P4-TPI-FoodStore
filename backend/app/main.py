from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router

# Se importan los modelos para que SQLModel conozca todas las tablas antes de crearlas
from app.modules.categorias.models import Categoria  # noqa: F401
from app.modules.pedidos.models import DetallePedido, Pedido  # noqa: F401
from app.modules.productos.models import Producto  # noqa: F401
from app.modules.usuarios.models import Usuario  # noqa: F401
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all_tables()
    yield


app = FastAPI(title="Food Store API", lifespan=lifespan)

# CORS con credenciales: el navegador envia la cookie HttpOnly desde el frontend.
# Con allow_credentials=True el origen debe ser explicito (no se admite "*").
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(usuarios_router, prefix="/api/v1")
