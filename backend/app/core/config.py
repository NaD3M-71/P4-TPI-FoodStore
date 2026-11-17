from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Variables de entorno leidas del archivo .env.

    DATABASE_URL y SECRET_KEY no tienen valor por defecto: si faltan, la aplicacion
    no inicia en lugar de arrancar con valores inseguros.
    """

    DATABASE_URL: str
    SECRET_KEY: str  # minimo 32 caracteres
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
