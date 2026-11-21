# Django REST API integration

The frontend calls the sibling Django project at `../real-estate-map-explorer-backend`. Set the
public API origin without a trailing slash:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Interactive backend documentation is available while Django is running:

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

## Endpoints used by the frontend

| Method | Path | Authentication | Frontend use |
| --- | --- | --- | --- |
| `GET` | `/api/v1/dataset` | Public | Load listings, providers, groups, reviews, and settings |
| `PUT` | `/api/v1/dataset` | Administrator or employee | Replace the temporary whole-dataset document |
| `POST` | `/api/v1/auth/login/` | Email and password | Create access and refresh cookies |
| `GET` | `/api/v1/auth/user/` | Access cookie | Read the signed-in user and role |
| `POST` | `/api/v1/auth/logout/` | Access cookie | End the browser session |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh cookie | Refresh the short-lived access cookie |
| `POST` | `/api/v1/auth/registration/` | Public | Register an email/password account |
| `POST` | `/api/v1/auth/password/reset/` | Public | Request a password reset email |
| `POST` | `/api/v1/auth/password/reset/confirm/` | Reset token | Confirm a new password |

Google and Facebook authentication are not used by the frontend. Email/password is the active
contract.

## Dataset contract

The migration-stage endpoint sends and receives the complete document:

```json
{
  "metadata": {
    "name": "Open Lot Plans",
    "version": 1,
    "isSample": true,
    "notice": "Sample data"
  },
  "utilities": {},
  "destinations": [],
  "routes": [],
  "properties": [],
  "providers": [],
  "groups": [],
  "reviews": []
}
```

The frontend validates every response before rendering it. Django validates every replacement
before saving it. The whole-dataset endpoint stays until normalized listing and provider endpoints
replace the browser's blob mutation model.

## Login request

```http
POST /api/v1/auth/login/
Content-Type: application/json

{"email":"staff@example.com","password":"your-password"}
```

The browser must use `credentials: "include"`. JavaScript does not read or store the JWT values;
Django writes them as HTTP-only cookies.

## Cross-origin requirements

Local defaults assume these exact origins:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`

Django must include the frontend origin in both `CORS_ALLOWED_ORIGINS` and
`CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOW_CREDENTIALS` must remain enabled. `localhost` and
`127.0.0.1` are different origins; use one consistently.

For production, prefer same-site subdomains such as `www.example.com` and `api.example.com`.
Cookies must be secure over HTTPS. Keep CORS and CSRF lists explicit; never use wildcard origins
with credentialed requests.

## Error and fallback behavior

- Dataset load timeout or server failure: the frontend loads bundled sample data locally.
- Dataset write failure: the validated mutation is retained in local storage for that browser.
- `400` login: show Django's validation message.
- `401` or `403` from `/auth/user/`: treat the visitor as signed out.
- Missing `NEXT_PUBLIC_API_URL`: use local sample data; login reports that Django is unconfigured.

Use the browser Network panel to confirm the request URL, `Access-Control-Allow-Origin`,
`Access-Control-Allow-Credentials`, and cookie attributes when debugging authentication.
