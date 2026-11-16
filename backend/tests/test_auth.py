from tests.conftest import ADMIN, USER, login

BASE = "/api/v1/auth"
NUEVO = {
    "nombre": "Ana",
    "apellido": "Lopez",
    "email": "ana@test.com",
    "celular": "2804123456",
    "password": "Clave1234",
}


# ---------- Registro (HU-01, RN-01, RN-02, RN-08, RN-09) ----------


def test_registro_devuelve_201_sin_hash_y_con_rol_user(client):
    r = client.post(f"{BASE}/register", json=NUEVO)
    assert r.status_code == 201
    cuerpo = r.json()
    assert cuerpo["email"] == "ana@test.com"
    assert cuerpo["roles"] == ["user"]
    assert "password" not in cuerpo and "password_hash" not in cuerpo


def test_registro_email_repetido_da_409(client):
    r = client.post(f"{BASE}/register", json={**NUEVO, "email": "juan@foodstore.com"})
    assert r.status_code == 409
    assert isinstance(r.json()["detail"], str)


def test_registro_invalido_da_422(client):
    assert client.post(f"{BASE}/register", json={**NUEVO, "email": "no-es-email"}).status_code == 422
    assert client.post(f"{BASE}/register", json={**NUEVO, "email": "x@test.com", "password": "corta"}).status_code == 422


# ---------- Login, /me y logout (HU-02, HU-03, RN-03, RN-10) ----------


def test_login_entrega_cookie_httponly_y_no_el_token_en_el_cuerpo(client):
    r = login(client, USER)
    assert r.status_code == 200
    set_cookie = r.headers["set-cookie"].lower()
    assert "access_token=" in set_cookie and "httponly" in set_cookie
    assert "access_token" not in r.json()


def test_login_con_clave_incorrecta_da_401(client):
    assert login(client, (USER[0], "otra-clave")).status_code == 401


def test_me_sin_cookie_da_401(client):
    assert client.get(f"{BASE}/me").status_code == 401


def test_me_devuelve_usuario_y_roles(client):
    login(client, ADMIN)
    r = client.get(f"{BASE}/me")
    assert r.status_code == 200
    assert r.json()["roles"] == ["admin"]


def test_encabezado_authorization_no_se_acepta(client):
    token = login(client, USER).cookies["access_token"]
    client.cookies.clear()
    r = client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_token_adulterado_da_401(client):
    client.cookies.set("access_token", "esto.no.es-un-jwt")
    assert client.get(f"{BASE}/me").status_code == 401


def test_logout_borra_la_cookie(client):
    login(client, USER)
    r = client.post(f"{BASE}/logout")
    assert r.status_code == 200
    assert "access_token" in r.headers["set-cookie"].lower()
    assert client.get(f"{BASE}/me").status_code == 401


# ---------- Roles y administracion (HU-05, RN-14) ----------


def test_usuario_comun_en_ruta_de_admin_da_403(client):
    login(client, USER)
    assert client.get(f"{BASE}/admin/usuarios").status_code == 403


def test_admin_lista_usuarios_con_estado(client):
    login(client, ADMIN)
    r = client.get(f"{BASE}/admin/usuarios")
    assert r.status_code == 200
    assert all("activo" in u and "roles" in u for u in r.json())


def test_desactivar_y_activar_usuario(client):
    client.post(f"{BASE}/register", json={**NUEVO, "email": "baja@test.com"})
    login(client, ADMIN)
    uid = next(u["id"] for u in client.get(f"{BASE}/admin/usuarios").json() if u["email"] == "baja@test.com")

    r = client.post(f"{BASE}/admin/usuarios/{uid}/desactivar")
    assert r.status_code == 200 and r.json()["activo"] is False and r.json()["deleted_at"]
    # Sigue en el listado, con su estado
    assert any(u["id"] == uid and not u["activo"] for u in client.get(f"{BASE}/admin/usuarios").json())

    # Desactivado: 400 en el login
    client.cookies.clear()
    r = login(client, ("baja@test.com", NUEVO["password"]))
    assert r.status_code == 400 and r.json()["detail"] == "Cuenta de usuario desactivada"

    login(client, ADMIN)
    r = client.post(f"{BASE}/admin/usuarios/{uid}/activar")
    assert r.json()["activo"] is True and r.json()["deleted_at"] is None
    client.cookies.clear()
    assert login(client, ("baja@test.com", NUEVO["password"])).status_code == 200


def test_usuario_desactivado_con_token_vigente_recibe_400(client):
    client.post(f"{BASE}/register", json={**NUEVO, "email": "vigente@test.com"})
    login(client, ("vigente@test.com", NUEVO["password"]))
    cookie = client.cookies["access_token"]

    client.cookies.clear()
    login(client, ADMIN)
    uid = next(u["id"] for u in client.get(f"{BASE}/admin/usuarios").json() if u["email"] == "vigente@test.com")
    client.post(f"{BASE}/admin/usuarios/{uid}/desactivar")

    client.cookies.clear()
    client.cookies.set("access_token", cookie)
    assert client.get(f"{BASE}/me").status_code == 400
