from sqlmodel import Session, select

from app.core.audit import ahora
from app.core.database import engine
from app.modules.usuarios.model import Rol, Usuario, UsuarioRol
from tests.conftest import ADMIN, USER, login

CATEGORIA = {"nombre": "Pizzas", "descripcion": "Pizzas al horno"}


def test_catalogo_sin_sesion_da_401(client):
    assert client.get("/categorias/").status_code == 401
    assert client.get("/productos/").status_code == 401
    assert client.post("/categorias/", json=CATEGORIA).status_code == 401


def test_usuario_user_lee_pero_no_escribe(client):
    login(client, USER)
    assert client.get("/categorias/").status_code == 200
    assert client.get("/productos/").status_code == 200
    assert client.post("/categorias/", json=CATEGORIA).status_code == 403
    assert client.put("/categorias/1", json=CATEGORIA).status_code == 403
    assert client.delete("/categorias/1").status_code == 403
    assert client.post("/productos/", json={}).status_code == 403


def test_admin_hace_el_crud_con_borrado_logico(client):
    login(client, ADMIN)
    r = client.post("/categorias/", json={"nombre": "Bebidas", "descripcion": ""})
    assert r.status_code == 201
    cid = r.json()["id"]
    assert client.put(f"/categorias/{cid}", json={"nombre": "Bebidas frias", "descripcion": ""}).status_code == 200
    assert client.delete(f"/categorias/{cid}").status_code == 204

    # Borrado logico: la fila sigue en la base y el listado la excluye
    nombres = [c["nombre"] for c in client.get("/categorias/?limit=100").json()["items"]]
    assert "Bebidas frias" not in nombres
    assert client.get(f"/categorias/{cid}").status_code == 404


def test_pedido_toma_usuario_id_de_la_sesion(client):
    login(client, ADMIN)
    cat = client.post("/categorias/", json={"nombre": "Combos", "descripcion": ""}).json()
    prod = client.post(
        "/productos/",
        json={"nombre": "Combo 1", "precio_base": 100, "categoria_ids": [cat["id"]]},
    ).json()

    client.cookies.clear()
    login(client, USER)
    me = client.get("/api/v1/auth/me").json()
    # Aunque el body traiga un usuario_id ajeno, se ignora
    r = client.post("/pedidos", json={"usuario_id": 999, "detalles": [{"producto_id": prod["id"], "cantidad": 2}]})
    assert r.status_code == 201
    assert r.json()["usuario_id"] == me["id"]
    assert r.json()["total"] == 200
    # Cambiar el estado es de admin
    assert client.put(f"/pedidos/{r.json()['id']}", json={"estado": "EN_CAMINO"}).status_code == 403


def test_catalogos_de_solo_lectura(client):
    login(client, USER)
    assert [r["nombre"] for r in client.get("/api/v1/catalogos/roles").json()] == ["admin", "user"]
    estados = [e["codigo"] for e in client.get("/api/v1/catalogos/estados-pedido").json()]
    assert estados[0] == "PENDIENTE" and estados[-1] == "CANCELADO" and len(estados) == 6
    assert client.post("/api/v1/catalogos/roles", json={"nombre": "x"}).status_code == 405
    assert client.delete("/api/v1/catalogos/roles").status_code == 405


def test_rol_vencido_no_otorga_permisos(client):
    """RN-14: una asignacion con expires_at vencido no cuenta."""
    from datetime import timedelta

    client.post(
        "/api/v1/auth/register",
        json={"nombre": "Temp", "apellido": "Admin", "email": "temp@test.com", "password": "Clave1234"},
    )
    with Session(engine) as s:
        usuario = s.exec(select(Usuario).where(Usuario.email == "temp@test.com")).one()
        rol_admin = s.exec(select(Rol).where(Rol.nombre == "admin")).one()
        usuario_id, rol_id = usuario.id, rol_admin.id  # ids antes del commit (la sesion expira los objetos)
        s.add(UsuarioRol(usuario_id=usuario_id, rol_id=rol_id, expires_at=ahora() + timedelta(days=1)))
        s.commit()

    login(client, ("temp@test.com", "Clave1234"))
    assert client.get("/api/v1/auth/admin/usuarios").status_code == 200  # rol vigente

    with Session(engine) as s:
        enlace = s.get(UsuarioRol, (usuario_id, rol_id))
        enlace.expires_at = ahora() - timedelta(minutes=1)
        s.add(enlace)
        s.commit()
    assert client.get("/api/v1/auth/admin/usuarios").status_code == 403  # rol vencido
