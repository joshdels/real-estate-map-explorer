-- PSA/NAMRIA administrative boundaries (COD-AB Philippines) for accurate
-- area search. Load the rows with scripts/load-boundaries-db.sh after this
-- migration is applied. Outlines are simplified; they are not legal or
-- surveyed boundaries.
create extension if not exists postgis with schema extensions;

create table if not exists public.admin_regions (
  code text primary key,
  name text not null,
  geom extensions.geometry(MultiPolygon, 4326) not null
);

create table if not exists public.admin_provinces (
  code text primary key,
  name text not null,
  region_code text not null references public.admin_regions (code),
  geom extensions.geometry(MultiPolygon, 4326) not null
);

create table if not exists public.admin_cities (
  code text primary key,
  name text not null,
  province_code text not null references public.admin_provinces (code),
  region_code text not null references public.admin_regions (code),
  geom extensions.geometry(MultiPolygon, 4326) not null
);

create index if not exists admin_regions_geom_idx on public.admin_regions using gist (geom);
create index if not exists admin_provinces_geom_idx on public.admin_provinces using gist (geom);
create index if not exists admin_cities_geom_idx on public.admin_cities using gist (geom);
create index if not exists admin_provinces_region_idx on public.admin_provinces (region_code);
create index if not exists admin_cities_province_idx on public.admin_cities (province_code);

alter table public.admin_regions enable row level security;
alter table public.admin_provinces enable row level security;
alter table public.admin_cities enable row level security;

-- Reference data: readable by everyone, writable only through a trusted
-- database connection (no insert/update/delete policies are defined).
create policy "public can read regions" on public.admin_regions
  for select to anon, authenticated using (true);
create policy "public can read provinces" on public.admin_provinces
  for select to anon, authenticated using (true);
create policy "public can read cities" on public.admin_cities
  for select to anon, authenticated using (true);

-- Returns the region, province, and city/municipality that contain a point.
-- Falls back to the nearest city within about 5 km for points that land in a
-- simplification gap or just offshore, and marks that result approximate.
create or replace function public.locate_admin_area(lat double precision, lng double precision)
returns table (
  region_code text,
  region text,
  province_code text,
  province text,
  city_code text,
  city text,
  approximate boolean
)
language sql
stable
set search_path = public, extensions
as $$
  with point as (
    select st_setsrid(st_makepoint(lng, lat), 4326) as geom
  ),
  hit as (
    select c.code, false as approximate
    from public.admin_cities c, point
    where st_covers(c.geom, point.geom)
    limit 1
  ),
  nearest as (
    select c.code, true as approximate
    from public.admin_cities c, point
    where not exists (select 1 from hit)
      and st_dwithin(c.geom, point.geom, 0.05)
    order by c.geom <-> point.geom
    limit 1
  ),
  match as (
    select * from hit union all select * from nearest
  )
  select r.code, r.name, p.code, p.name, c.code, c.name, match.approximate
  from match
  join public.admin_cities c on c.code = match.code
  join public.admin_provinces p on p.code = c.province_code
  join public.admin_regions r on r.code = c.region_code;
$$;

grant execute on function public.locate_admin_area(double precision, double precision) to anon, authenticated;
