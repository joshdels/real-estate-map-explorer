# Application architecture

## Runtime overview

```text
Browser
  Next.js pages and explorer
    |-- DjangoAuthClient ------ /api/v1/auth/*
    |-- PropertyStore
    |     |-- DjangoRepository - /api/v1/dataset
    |     `-- LocalRepository -- bundled seed + localStorage fallback
    `-- BoundaryService ------- static public/data/boundaries files

Django REST Framework API
  |-- accounts app ------------ users, roles, email/password, JWT cookies
  `-- datasets app ------------ temporary whole-dataset JSON contract
```

The browser communicates with Django through `NEXT_PUBLIC_API_URL`. No database credentials or
authentication tokens are stored in the frontend. Django sets HTTP-only access and refresh cookies,
and browser requests use `credentials: "include"`.

## Data flow

`src/lib/repositories/factory.ts` selects `DjangoRepository` when `NEXT_PUBLIC_API_URL` exists. It
loads `GET /api/v1/dataset` with a six-second timeout. If configuration or the API is unavailable,
the app uses `LocalRepository`, which loads the validated bundled sample and persists browser-only
changes in `localStorage`.

Every remote and local dataset passes through `validateDataset()`. `PropertyStore` is the only
mutation boundary. A failed remote save keeps the validated in-memory state and changes subsequent
persistence to local storage.

The local fallback is for demos and outages. It is not a second backend and does not synchronize
changes to Django later.

## Authentication flow

`src/lib/django-auth.ts` owns the browser API calls:

1. `/login` posts email and password to Django.
2. Django returns HTTP-only JWT cookies.
3. The frontend reads the current public user representation from `/api/v1/auth/user/`.
4. Dataset writes include the cookies and Django enforces administrator/employee permissions.
5. Logout invalidates the Django session cookies.

The public `admin` and `staff` passcodes are still a local demonstration layer. They are not a
security boundary. Do not store private information behind them. Replace each dashboard and staff
permission with the authenticated Django role before real operations.

## Trust boundaries

- The dataset endpoint is publicly readable and contains publishable information only.
- Django owns credentials, role checks, OAuth secrets if enabled later, and database access.
- Browser code receives only `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`.
- Reports, assisted cases, and the activity log remain local to one browser.
- Administrative outlines are simplified search aids, not surveyed or legal boundaries.

## Source layout

- `src/lib/django-auth.ts`: email/password login, current user, logout.
- `src/lib/repositories/django-repository.ts`: whole-dataset DRF adapter.
- `src/lib/repositories/local-repository.ts`: validated seed and local fallback.
- `src/lib/repositories/factory.ts`: remote selection, timeout, and fallback.
- `src/components/auth/login-card.tsx`: real email/password login surface.
- `src/explorer/auth.ts`: cookie-session status for the map workspace.
- `docs/API.md`: exact endpoint contract and troubleshooting.
- `docs/DEPLOYMENT.md`: deployment order and production configuration.
