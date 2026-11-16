from sqlmodel import Session, select

from app.core.database import engine
from app.core.security import hash_password
from app.modules.catalogos.model import EstadoPedido
from app.modules.usuarios.model import Rol, Usuario, UsuarioRol
from app.unidad_medida.model import UnidadMedida

# Tablas de catalogo: solo se cargan desde aca, la API unicamente las lee (GET)
UNIDADES_MEDIDA = [
    {"id": 1, "nombre": "kilogramo", "simbolo": "kg", "tipo": "masa"},
    {"id": 2, "nombre": "gramo", "simbolo": "g", "tipo": "masa"},
    {"id": 3, "nombre": "litro", "simbolo": "L", "tipo": "volumen"},
    {"id": 4, "nombre": "mililitro", "simbolo": "mL", "tipo": "volumen"},
    {"id": 5, "nombre": "pieza", "simbolo": "u", "tipo": "unidad"},
    {"id": 6, "nombre": "docena", "simbolo": "doc", "tipo": "unidad"},
    {"id": 7, "nombre": "metro cuadrado", "simbolo": "m²", "tipo": "area"},
]

ROLES = [
    {"id": 1, "nombre": "admin", "descripcion": "Administrador: gestiona el catalogo y los usuarios"},
    {"id": 2, "nombre": "user", "descripcion": "Usuario: consulta el catalogo y crea pedidos"},
]

# Los seis estados del diagrama, de PENDIENTE a CANCELADO
ESTADOS_PEDIDO = [
    {"codigo": "PENDIENTE", "descripcion": "Pedido recibido, a la espera de confirmacion", "orden": 1},
    {"codigo": "CONFIRMADO", "descripcion": "Pedido confirmado", "orden": 2},
    {"codigo": "EN_PREP", "descripcion": "Pedido en preparacion", "orden": 3},
    {"codigo": "EN_CAMINO", "descripcion": "Pedido en camino", "orden": 4},
    {"codigo": "ENTREGADO", "descripcion": "Pedido entregado", "orden": 5},
    {"codigo": "CANCELADO", "descripcion": "Pedido cancelado", "orden": 6},
]

# Usuarios iniciales SOLO para desarrollo y correccion del TP. En un entorno real
# se crean fuera del codigo y con otras claves.
USUARIOS_INICIALES = [
    {
        "nombre": "Admin",
        "apellido": "Sistema",
        "email": "admin@foodstore.com",
        "password": "Admin1234",
        "rol": "admin",
    },
    {
        "nombre": "Juan",
        "apellido": "Perez",
        "email": "juan@foodstore.com",
        "password": "Juan1234!",
        "rol": "user",
    },
]


def seed_unidades_medida(session: Session) -> None:
    # Se inserta solo lo que falta, asi se puede ejecutar en cada arranque
    existentes = set(session.exec(select(UnidadMedida.id)).all())
    for datos in UNIDADES_MEDIDA:
        if datos["id"] not in existentes:
            session.add(UnidadMedida(**datos))
    session.commit()


def seed_roles(session: Session) -> None:
    existentes = set(session.exec(select(Rol.id)).all())
    for datos in ROLES:
        if datos["id"] not in existentes:
            session.add(Rol(**datos))
    session.commit()


def seed_estados_pedido(session: Session) -> None:
    existentes = set(session.exec(select(EstadoPedido.codigo)).all())
    for datos in ESTADOS_PEDIDO:
        if datos["codigo"] not in existentes:
            session.add(EstadoPedido(**datos))
    session.commit()


def seed_usuarios(session: Session) -> None:
    for datos in USUARIOS_INICIALES:
        existente = session.exec(select(Usuario).where(Usuario.email == datos["email"])).first()
        if existente is not None:
            continue
        usuario = Usuario(
            nombre=datos["nombre"],
            apellido=datos["apellido"],
            email=datos["email"],
            password_hash=hash_password(datos["password"]),
        )
        session.add(usuario)
        session.flush()
        rol = session.exec(select(Rol).where(Rol.nombre == datos["rol"])).one()
        session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    session.commit()


def run_seed() -> None:
    with Session(engine) as session:
        seed_unidades_medida(session)
        seed_roles(session)
        seed_estados_pedido(session)
        seed_usuarios(session)
