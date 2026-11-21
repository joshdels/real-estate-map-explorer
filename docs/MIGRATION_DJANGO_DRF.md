# Django REST Framework migration status

The frontend remote boundary now uses Django REST Framework exclusively.

Completed:

- `DjangoRepository` loads and saves the Stage 1 whole-dataset contract.
- `NEXT_PUBLIC_API_URL` selects the remote API.
- Email/password login, current-user lookup, and logout use Django HTTP-only cookies.
- The previous remote client, packages, callback route, proxy, repository, and migrations were
  removed from the frontend.
- Local validated sample data remains as an offline/demo fallback only.

Remaining migration work:

1. Replace public demo passcodes with Django role checks throughout dashboard and staff surfaces.
2. Normalize listings, providers, groups, reviews, reports, and assisted cases in PostgreSQL.
3. Replace whole-dataset writes with granular DRF endpoints and ownership checks.
4. Move reports and activity history from browser storage to server-side tables.
5. Add server-managed media uploads with size and type validation.
6. Move administrative-area lookup to PostGIS when the backend boundary tables are ready.

See [API.md](API.md) for the active contract and [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.
