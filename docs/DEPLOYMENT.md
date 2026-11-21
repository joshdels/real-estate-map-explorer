# Deployment guide

This guide documents the intended topology. It does not add provider-specific infrastructure.

```text
Browser
  |-- https://www.example.com  -> Next.js frontend
  `-- https://api.example.com  -> TLS reverse proxy -> Django application -> PostgreSQL
```

## 1. Prepare the Django API

On the API host, configure backend-only environment values:

```dotenv
DJANGO_SECRET_KEY=generate-a-long-random-value
DJANGO_ALLOWED_HOSTS=api.example.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
CORS_ALLOWED_ORIGINS=https://www.example.com
CSRF_TRUSTED_ORIGINS=https://www.example.com
JWT_AUTH_SECURE=true
JWT_AUTH_SAMESITE=Lax
ENABLE_SOCIAL_AUTH=false
```

Then install, validate, migrate, and seed:

```bash
uv sync --frozen
uv run python manage.py check --settings=config.settings.prod
uv run python manage.py migrate --settings=config.settings.prod
uv run python manage.py seed_dataset ../real-estate-map-explorer/public/data/data.json
uv run python manage.py createsuperuser
```

Run Django behind an HTTPS reverse proxy and a production WSGI/ASGI server. Forward the original
host and `X-Forwarded-Proto: https`; the production settings already trust that protocol header.
Do not expose Django's development server publicly.

Before opening traffic, verify:

```bash
curl -fsS https://api.example.com/api/v1/dataset
curl -fsS https://api.example.com/api/schema/
```

## 2. Deploy the Next.js frontend

Configure browser-visible values in the frontend platform:

```dotenv
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://www.example.com
```

Build before deployment:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Deploy the generated Next.js application to a Node-compatible platform. No database URL, Django
secret, OAuth secret, or JWT belongs in frontend environment variables.

## 3. Verify the deployed connection

1. Open the homepage and `/explore`; confirm listings came from `api.example.com`.
2. Open `/login`, sign in with a test account, and confirm `/api/v1/auth/user/` returns `200`.
3. Confirm access and refresh cookies are HTTP-only and secure.
4. Confirm the API response allows only the deployed frontend origin.
5. Sign out and confirm `/api/v1/auth/user/` returns `401` or `403`.
6. Exercise one authorized dataset write with a staff test account, then restore the seed if needed.
7. Test mobile and desktop layouts and check for console or failed network requests.

## 4. Operational requirements

- Terminate TLS for both origins and renew certificates automatically.
- Back up PostgreSQL on a schedule and test restoration.
- Keep application logs without passwords, cookie values, or listing contacts.
- Run migrations before starting a release that depends on them.
- Seed only fictional or approved public data.
- Monitor API availability and error rates; the frontend's local fallback can hide an outage from
  casual browsing, so monitor the API independently.
- Rotate Django and database secrets through the hosting environment, never through Git.

## 5. Release and rollback order

Release:

1. Back up PostgreSQL.
2. Deploy the backward-compatible Django API and run migrations.
3. Verify dataset, schema, CORS, and login endpoints.
4. Deploy the frontend with the production `NEXT_PUBLIC_API_URL`.
5. Run the deployed checks above.

Rollback:

1. Roll back the frontend deployment first if its API assumptions are wrong.
2. Keep the compatible Django dataset endpoint available.
3. Roll back Django code only when the previous version supports the current database schema.
4. Restore the database only for confirmed data corruption, not ordinary code rollback.

## Troubleshooting

- CORS error: match the full frontend origin, including scheme and port.
- Login succeeds but user lookup fails: inspect secure, domain, and SameSite cookie attributes.
- `403` on writes: confirm the Django user role is `administrator` or `employee`.
- Empty dataset or `404`: run `seed_dataset` against the frontend's seed JSON.
- Frontend shows sample fallback: verify `NEXT_PUBLIC_API_URL`, API TLS, and `/api/v1/dataset`.
- Production settings reject startup: supply `DJANGO_SECRET_KEY` and a valid allowed host.
