-- ==============================================================================
-- MANDADO - Tier system, community prices & pricing add-on
-- Apply via Supabase SQL Editor.
-- ==============================================================================

-- 1. Families: tier system columns
alter table public.families
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'mandado', 'plus')),
  add column if not exists pueblo text,
  add column if not exists share_prices boolean not null default true,
  add column if not exists search_radius_km integer,
  add column if not exists has_price_import boolean not null default false;

-- 1b. Familia administradora (la que crea la app): se la asigna Mandado Plus.
-- Si en el futuro se usa otro código admin, actualizar esta línea.
update public.families set tier = 'plus' where invite_code = 'MANDADO-JAUREGUI-D36E83';

-- 2. Price history: source of each record ('manual' | 'community_import')
alter table public.price_history
  add column if not exists source text not null default 'manual',
  alter column recorded_by drop not null;

-- 3. Helper: does the requesting family have access to community data?
create or replace function public.can_access_community_prices()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.families f on f.id = pr.family_id
    where pr.id = auth.uid()
      and (f.tier = 'plus' or f.has_price_import = true)
  );
$$;

-- 4. Internal (unguarded) view used only by definer functions.
-- It matches a product+store pair to its latest recorded price of
-- families that opted into sharing.
create or replace view public.community_prices_data
with (security_invoker = false) as
  select
    ph.product_id,
    p.name as product_name,
    ph.store_id,
    s.name as store_name,
    s.category as store_category,
    f.pueblo,
    ph.price,
    ph.recorded_at,
    ph.recorded_by,
    s.family_id as price_family_id
  from public.price_history ph
  join public.products p on p.id = ph.product_id
  join public.stores s on s.id = ph.store_id
  join public.families f on f.id = s.family_id
  where f.share_prices = true
    and ph.recorded_at = (
      select max(ph2.recorded_at)
      from public.price_history ph2
      where ph2.product_id = ph.product_id
        and ph2.store_id = ph.store_id
    );

-- 5. Public view "community_prices": only rows for families with tier 'plus'
-- or has_price_import = true. Never exposes family_id, recorded_by, nor any
-- data that could identify who registered a price.
create or replace view public.community_prices
with (security_invoker = false) as
  select
    product_id,
    product_name,
    store_id,
    store_name,
    store_category,
    pueblo,
    price,
    recorded_at
  from public.community_prices_data
  where public.can_access_community_prices();

-- 6. Expose via PostgREST only to authenticated users (anon stays blocked).
grant select on public.community_prices to authenticated;
revoke all on public.community_prices from anon;
revoke all on public.community_prices_data from anon, authenticated;

-- 7. Import community prices for a family (same pueblo, name match).
-- Inserts with recorded_by = NULL and source = 'community_import'. The existing
-- AFTER INSERT trigger recalculates canonical_store_id for each imported product.
create or replace function public.import_community_prices(p_family_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pueblo text;
  v_counter integer := 0;
  v_r record;
begin
  select pueblo into v_pueblo
  from public.families
  where id = p_family_id;

  if v_pueblo is null then
    return 0;
  end if;

  for v_r in
    select
      fp.id as local_product_id,
      cp.price,
      cp.recorded_at,
      cp.store_id
    from public.products fp
    join public.community_prices_data cp
      on lower(cp.product_name) = lower(fp.name)
    where fp.family_id = p_family_id
      and cp.pueblo = v_pueblo
      and not exists (
        select 1
        from public.price_history ph
        where ph.product_id = fp.id
          and ph.store_id = cp.store_id
          and ph.source = 'community_import'
      )
  loop
    insert into public.price_history
      (product_id, store_id, price, recorded_by, recorded_at, source)
    values
      (v_r.local_product_id, v_r.store_id, v_r.price, null, v_r.recorded_at, 'community_import');
    v_counter := v_counter + 1;
  end loop;

  return v_counter;
end;
$$;