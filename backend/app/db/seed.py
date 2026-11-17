"""Carga los datos iniciales: usuario admin, categorias y productos.

Se ejecuta desde la carpeta backend con:  python -m app.db.seed
Es idempotente: se puede correr varias veces sin duplicar nada.
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, engine
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.pedidos.models import DetallePedido, Pedido  # noqa: F401
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "full_name": "Administrador",
    "email": "admin@foodstore.com",
    "password": "Admin1234!",
}

CATEGORIAS = [
    ("Pizzas", "Pizzas al horno de piedra"),
    ("Hamburguesas", "Hamburguesas con papas"),
    ("Bebidas", "Gaseosas, aguas y cervezas"),
    ("Postres", "Dulces para cerrar la comida"),
]

# (categoria, nombre, descripcion, precio_base, stock)
PRODUCTOS = [
    ("Pizzas", "Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9500.0, 20),
    ("Pizzas", "Napolitana", "Muzzarella, rodajas de tomate, ajo y albahaca", 11000.0, 15),
    ("Pizzas", "Fugazzeta", "Muzzarella y abundante cebolla", 10500.0, 12),
    ("Hamburguesas", "Clásica", "Carne, lechuga, tomate y queso cheddar", 8500.0, 25),
    ("Hamburguesas", "Doble con queso", "Doble carne y doble cheddar", 11500.0, 18),
    ("Hamburguesas", "Veggie", "Medallón de lentejas, rúcula y tomate", 9000.0, 10),
    ("Bebidas", "Gaseosa 1,5 L", "Cola, lima o naranja", 3200.0, 40),
    ("Bebidas", "Agua mineral 500 ml", "Sin gas", 1500.0, 50),
    ("Bebidas", "Cerveza artesanal", "Rubia, 500 ml", 4500.0, 30),
    ("Postres", "Flan con dulce de leche", "Con crema", 3800.0, 14),
    ("Postres", "Brownie con helado", "Brownie tibio y bocha de vainilla", 5200.0, 9),
]


def cargar_admin(session: Session) -> None:
    existente = session.exec(select(Usuario).where(Usuario.username == ADMIN["username"])).first()
    if existente is not None:
        print("Admin: ya existe, no se modifica")
        return
    session.add(
        Usuario(
            username=ADMIN["username"],
            full_name=ADMIN["full_name"],
            email=ADMIN["email"],
            hashed_password=hash_password(ADMIN["password"]),
            role="admin",
        )
    )
    session.commit()
    print("Admin: creado")


def cargar_catalogo(session: Session) -> None:
    categorias: dict[str, Categoria] = {}
    nuevas = 0
    for nombre, descripcion in CATEGORIAS:
        categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
        if categoria is None:
            categoria = Categoria(nombre=nombre, descripcion=descripcion)
            session.add(categoria)
            session.flush()
            nuevas += 1
        categorias[nombre] = categoria

    nuevos = 0
    for categoria_nombre, nombre, descripcion, precio, stock in PRODUCTOS:
        categoria = categorias[categoria_nombre]
        existente = session.exec(
            select(Producto).where(Producto.nombre == nombre, Producto.categoria_id == categoria.id)
        ).first()
        if existente is None:
            session.add(
                Producto(
                    categoria_id=categoria.id,
                    nombre=nombre,
                    descripcion=descripcion,
                    precio_base=precio,
                    stock=stock,
                )
            )
            nuevos += 1
    session.commit()
    print(f"Categorias nuevas: {nuevas}. Productos nuevos: {nuevos}")


def run_seed() -> None:
    create_all_tables()
    with Session(engine) as session:
        cargar_admin(session)
        cargar_catalogo(session)


if __name__ == "__main__":
    run_seed()
