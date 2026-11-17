# Food Store

Trabajo Práctico Integrador de Programación 4 (UTN, Tecnicatura Universitaria en Programación a Distancia).

Aplicación web para un negocio de comidas: los clientes se registran, recorren el catálogo, arman un carrito y confirman pedidos; el administrador gestiona categorías, productos, stock, pedidos y usuarios desde un panel.

- Repositorio: https://github.com/NaD3M-71/P4-TPI-FoodStore
- Video de demostración: (link pendiente)

## Tecnologías

- Backend: FastAPI, SQLModel, PostgreSQL, JWT en cookie HttpOnly, bcrypt.
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, TanStack Form, TanStack Table, React Router, Zustand, Axios.

## Estructura

```
backend/    API REST (FastAPI) bajo /api/v1
frontend/   Aplicación React
```

## Requisitos

- Python 3.11 a 3.13 (SQLModel 0.0.22 no funciona con 3.14)
- PostgreSQL 15 o superior (para desarrollo local también se acepta SQLite)
- Node.js 20.19 o superior
- pnpm 9 o superior

## Backend

Desde la carpeta `backend`:

1. Crear y activar el entorno virtual.

   Windows (PowerShell):

   ```
   python -m venv .venv
   .venv\Scripts\activate
   ```

   Linux o macOS:

   ```
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Instalar las dependencias:

   ```
   pip install -r requirements.txt
   ```

3. Copiar el archivo de variables de entorno y completarlo:

   ```
   copy .env.example .env      (Windows)
   cp .env.example .env        (Linux o macOS)
   ```

4. Si se usa PostgreSQL, crear antes una base vacía (por ejemplo `foodstore_db`) y ajustar `DATABASE_URL` en el `.env`. Para probar sin PostgreSQL, usar SQLite:

   ```
   DATABASE_URL=sqlite:///./foodstore.db
   ```

5. Cargar los datos iniciales (crea las tablas, el usuario administrador, las categorías y los productos). Se puede ejecutar más de una vez sin duplicar datos:

   ```
   python -m app.db.seed
   ```

6. Iniciar el servidor:

   ```
   uvicorn app.main:app --reload
   ```

La API queda en http://localhost:8000 y la documentación en http://localhost:8000/docs y http://localhost:8000/redoc.

### Variables de entorno del backend

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `DATABASE_URL` | Conexión a la base | `postgresql://user:pass@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Clave para firmar el JWT (mínimo 32 caracteres) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración de la sesión en minutos | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS | `http://localhost:5173` |

Para generar una clave: `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

### Usuario administrador (seed)

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `Admin1234!` | admin |

Los clientes se crean desde la pantalla de registro de la aplicación.

## Frontend

Desde la carpeta `frontend`:

1. Copiar el archivo de variables de entorno:

   ```
   copy .env.example .env      (Windows)
   cp .env.example .env        (Linux o macOS)
   ```

   Contiene `VITE_API_URL=http://localhost:8000/api/v1`.

2. Instalar las dependencias, verificar los tipos y ejecutar:

   ```
   pnpm install
   pnpm build
   pnpm dev
   ```

La aplicación queda en http://localhost:5173. El backend tiene que estar corriendo para que funcione.
