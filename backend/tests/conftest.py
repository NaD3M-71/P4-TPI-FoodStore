import os
import tempfile

# La configuracion se lee al importar la app: se define antes de importarla.
# Las pruebas usan una base SQLite temporal, nunca la del proyecto.
_directorio = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_directorio}/test.db"
os.environ["SECRET_KEY"] = "clave-solo-para-pruebas-de-al-menos-32-caracteres"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

ADMIN = ("admin@foodstore.com", "Admin1234")
USER = ("juan@foodstore.com", "Juan1234!")


@pytest.fixture(scope="session")
def _app_iniciada():
    # El with ejecuta el lifespan: crea las tablas y carga el seed
    with TestClient(app):
        yield


@pytest.fixture()
def client(_app_iniciada):
    with TestClient(app) as c:
        yield c


def login(client: TestClient, credenciales: tuple[str, str]):
    email, password = credenciales
    # OAuth2: formulario (no JSON); el campo username lleva el email
    return client.post("/api/v1/auth/token", data={"username": email, "password": password})
