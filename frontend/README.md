# Frontend - React + TypeScript (Unidad 10)

Catalogo de productos con autenticacion, refactorizado con una arquitectura por features
y rutas protegidas por sesion y por rol. Usa Vite, Tailwind CSS, TanStack Query, TanStack Table,
TanStack Form, Zustand y React Router. El backend de la Unidad 9 se reutiliza sin cambios.

## Instalacion y ejecucion

```
pnpm install
pnpm dev
```

La aplicacion corre en http://localhost:5173 y espera el backend en http://localhost:8000
(se puede cambiar con la variable `VITE_API_URL`).

## Estructura de features

```
src/
├── features/
│   ├── auth/            LoginPage, RegisterPage, AdminUsersPage, authStore, useAuth
│   ├── categories/      CategoriesPage, useCategories
│   ├── products/        ProductsPage, useProducts
│   └── ingredients/     IngredientsPage, useIngredients
├── shared/
│   ├── components/      Navbar, Toast, UnauthorizedPage, TablaDatos, Paginacion y ui/
│   └── api/             api.ts, setupInterceptors.ts, paginacion.ts, notificarError.ts
├── store/               themeStore.ts, notificationStore.ts
├── routes/              AppRouter.tsx, ProtectedRoute.tsx
├── App.tsx
└── main.tsx
```

Cada feature tiene sus subcarpetas `components/`, `hooks/`, `types/` y `pages/` (la de auth
ademas tiene `store/`) y un `index.ts` (barrel) con su API publica.

Reglas que sigue el codigo:

- Una feature solo importa de otra a traves de su barrel. Por ejemplo, las paginas de categorias
  leen el rol con `useAuth` desde `@/features/auth`, y `ProductsPage` usa `useCategories` desde
  `@/features/categories`.
- Lo que usan varias features va en `shared/` o en `store/`.
- Los imports entre carpetas usan el alias `@/` (configurado en `vite.config.ts` y en
  `tsconfig.app.json`). Dentro de una misma feature se usan imports relativos cortos.
- Las rutas se declaran en `routes/AppRouter.tsx`. `App.tsx` solo verifica la sesion con
  `checkAuth` al iniciar y monta `<AppRouter />` y `<Toast />`.

## Autenticacion y rutas protegidas

- El JWT viaja en una cookie HttpOnly: ningun archivo del frontend lee ni guarda el token.
- `features/auth/store/authStore.ts`: store de Zustand con `user`, `checking` y las acciones
  `login`, `logout`, `checkAuth` y `clearUser`. No usa `persist`: la sesion se recupera con
  `GET /auth/me` al iniciar.
- `routes/ProtectedRoute.tsx`: mientras `checking` es `true` muestra un indicador de carga; sin
  sesion redirige a `/login`; con sesion pero rol no permitido, a `/unauthorized`; si todo es
  valido muestra la ruta hija con `<Outlet />`.
- `shared/api/setupInterceptors.ts` (se importa una vez en `main.tsx`): un 401 (salvo en
  `/auth/token` y `/auth/me`) limpia la sesion del store; un 403 muestra la notificacion
  "acceso denegado" sin cerrar la sesion.

| Ruta | Acceso |
| --- | --- |
| /login, /register, /unauthorized | publicas |
| /categories, /products, /ingredients | cualquier usuario autenticado |
| /admin/users | solo admin |

Los botones de crear, editar y eliminar se muestran solo al rol `admin` (el backend responde
403 igualmente a un `user`).

## Custom hooks

`useCategories`, `useProducts` y `useIngredients` encapsulan las llamadas a Axios y las
consultas (`useQuery`) y mutaciones (`useMutation`) de TanStack Query. `useAuth` encapsula el
inicio y el cierre de sesion y la lectura del store. Las paginas no llaman a Axios ni a
TanStack Query directamente.

## Estado de interfaz

- `store/themeStore.ts`: `darkMode` y `toggleTheme`, con `persist` (`theme-storage`). El boton
  de la Navbar alterna el tema y la preferencia se mantiene al recargar.
- `store/notificationStore.ts`: mensaje y visibilidad, con `showNotification` y
  `hideNotification`. `shared/components/Toast.tsx` se monta una vez en `App.tsx` y se oculta
  solo a los 3 segundos. Los hooks de cada feature lo usan para informar altas, ediciones,
  bajas y errores.

## Usuarios de prueba

| Email | Clave | Rol |
| --- | --- | --- |
| admin@foodstore.com | Admin1234 | admin |
| juan@foodstore.com | Juan1234! | user |

## Scripts

- `pnpm dev`: servidor de desarrollo
- `pnpm build`: compila TypeScript y genera `dist/`
- `pnpm lint`: oxlint
