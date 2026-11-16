# Backend - FastAPI (Unidad 9: autenticacion y autorizacion)

API REST del catalogo de productos (Categorias, Productos, Ingredientes, Unidades de medida
y Pedidos) con un modulo de seguridad: registro y login con JWT en cookie HttpOnly,
usuarios y roles (`Usuario`, `Rol`, `UsuarioRol`) y autorizacion por rol. Usa SQLModel con
SQLite por defecto o PostgreSQL.

## Instalacion

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Completar `SECRET_KEY` en `.env` (al menos 32 caracteres; si falta, la aplicacion no inicia).
El archivo `.env` no se entrega ni se sube al repositorio: se entrega solo `.env.example`.
Para generar una clave: `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

## Ejecutar

Desde la carpeta `backend`:

```
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Documentacion: http://localhost:8000/docs
- Pruebas con REST Client: `auth.http` (login y usuarios), `requests.http` y `pedidos.http`
  (requieren haber hecho el login antes)

Al iniciar se crean las tablas y `app/seed.py` carga los catalogos y los usuarios de prueba.

## Usuarios de prueba (seed)

| Email | Clave | Rol |
| --- | --- | --- |
| admin@foodstore.com | Admin1234 | admin |
| juan@foodstore.com | Juan1234! | user |

## Base de datos

Por defecto usa SQLite (`productos.db`). Para PostgreSQL se define `DATABASE_URL` en `.env`
y se instala el driver (`pip install psycopg2-binary`):

```
DATABASE_URL=postgresql+psycopg2://USUARIO:CLAVE@localhost:5432/catalogo
```

## Seguridad

- Contrasenas con hash bcrypt en `password_hash` (minimo 8 y maximo 72 caracteres).
- `POST /api/v1/auth/token` valida las credenciales (formulario OAuth2, el campo `username`
  lleva el email) y entrega el JWT en la cookie HttpOnly `access_token`. El token no va en el
  cuerpo de la respuesta y el encabezado `Authorization` no se acepta.
- CORS con credenciales para `http://localhost:5173`.
- Dependencias reutilizables en `app/core/deps.py`:
  - `get_current_user`: valida el JWT y busca al usuario (401 si falla).
  - `get_current_active_user`: 400 si la cuenta esta desactivada.
  - `require_role(roles)`: 403 si ningun rol vigente esta permitido. Solo cuentan los roles
    de `UsuarioRol` sin `expires_at` o con `expires_at` todavia no vencido.

### Endpoints de autenticacion (`/api/v1/auth`)

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| POST | /register | publico | Registro; asigna el rol `user` (201, 409 si el email existe, 422) |
| POST | /token | publico | Login; deja la cookie HttpOnly |
| POST | /logout | publico | Borra la cookie |
| GET | /me | sesion | Datos del usuario y sus roles vigentes |
| GET | /admin/usuarios | admin | Listado con estado (incluye desactivados) |
| POST | /admin/usuarios/{id}/desactivar | admin | Completa `deleted_at` |
| POST | /admin/usuarios/{id}/activar | admin | Vuelve `deleted_at` a nulo |

### Permisos del catalogo

| Recurso | GET | POST / PUT / DELETE |
| --- | --- | --- |
| Categorias, Productos, Ingredientes | cualquier usuario autenticado | solo admin |
| Pedidos | cualquier usuario autenticado | crear: `user` o `admin` (el `usuario_id` sale de la sesion); cambiar estado o borrar: solo admin |
| Unidades de medida, `/api/v1/catalogos/roles` y `/estados-pedido` | cualquier usuario autenticado | no existen (405) |

Un usuario `user` que escribe sobre categorias o productos recibe 403.

## Borrado logico

Nada se elimina de la base: `DELETE` completa `deleted_at` y los listados excluyen esos
registros. En `Usuario` se hace con los endpoints de activar y desactivar. Las tablas de
enlace (`UsuarioRol`, `ProductoCategoria`) no tienen `deleted_at`: quitar un rol o una
categoria elimina la fila de enlace.

## Estructura

```
app/
  core/            config, security (bcrypt y JWT), deps (seguridad), database, audit,
                   repository y unit_of_work (base)
  modules/
    usuarios/      model, schema, repository, unit_of_work, service, router (/api/v1/auth)
    catalogos/     EstadoPedido y router de catalogos de solo lectura
  categoria/       model, schema, service, router
  producto/        model, schema, service, router, repository
  ingrediente/     model, schema, service, router
  unidad_medida/   catalogo de solo lectura
  pedidos/         models, schemas, repository, unit_of_work, service, router
  health/          /health/ y /health/db
  seed.py          roles, estados de pedido, unidades de medida y usuarios de prueba
tests/             pruebas con pytest (usan una base SQLite temporal)
```

## Pruebas

```
pytest
```

## Pedidos

Reglas: el pedido necesita al menos un detalle, con cantidad mayor o igual a 1 y sin productos
repetidos (422). Si un detalle referencia un producto inexistente responde 404 y no se guarda
nada. El `precio_unitario` de cada detalle es el `precio_base` del producto al crear el pedido
y el `total` es la suma de cantidad por precio unitario. Los estados son PENDIENTE, CONFIRMADO,
EN_PREP, EN_CAMINO, ENTREGADO y CANCELADO.
