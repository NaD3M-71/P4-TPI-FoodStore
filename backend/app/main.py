from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.categoria.router import router as categoria_router
from app.core.database import create_db_and_tables
from app.health.router import router as health_router
from app.ingrediente.router import router as ingrediente_router
from app.modules.catalogos.router import router as catalogos_router
from app.modules.usuarios.router import router as usuarios_router
from app.pedidos.router import router as pedidos_router
from app.producto.router import router as producto_router
from app.seed import run_seed
from app.unidad_medida.router import router as unidad_medida_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    run_seed()
    yield


app = FastAPI(title="API Catalogo de Productos", lifespan=lifespan)

# CORS con credenciales: el navegador acepta y envia la cookie HttpOnly desde el frontend.
# Con allow_credentials=True los origenes deben ser explicitos (no se admite "*").
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios_router)
app.include_router(catalogos_router)
app.include_router(categoria_router)
app.include_router(producto_router)
app.include_router(ingrediente_router)
app.include_router(pedidos_router)
app.include_router(unidad_medida_router)
app.include_router(health_router)


@app.get("/")
def raiz():
    return {"mensaje": "API funcionando. Documentacion en /docs"}
