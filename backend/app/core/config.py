from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuracion leida de variables de entorno (archivo .env).

    SECRET_KEY no tiene valor por defecto: si falta, la aplicacion falla al
    iniciar (fail-fast) en lugar de arrancar con una clave conocida.
    """

    DATABASE_URL: str = "sqlite:///./productos.db"

    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    COOKIE_SECURE: bool = False  # en produccion, con HTTPS: True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
