-- ==============================================================================
-- MANDADO - Database Schema & Security Configuration
-- Family grocery shopping app with local stores, historical prices, and RLS
-- ==============================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Tables

-- Families
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#16A34A',
  phone text,
  created_at timestamptz not null default now()
);

-- Stores
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category text not null check (category in ('verdulería', 'verduleria', 'supermercado', 'carnicería', 'carniceria', 'otro')),
  address text,
  lat float8,
  lng float8,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  canonical_store_id uuid references public.stores(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Price History
create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  price numeric(10,2) not null check (price >= 0),
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default now()
);

-- Lists
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

-- List Items
create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  is_store_override boolean not null default false,
  quantity numeric not null default 1 check (quantity > 0),
  unit text default 'unidad',
  checked boolean not null default false,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Indexes for fast querying
create index if not exists idx_profiles_family_id on public.profiles(family_id);
create index if not exists idx_stores_family_id on public.stores(family_id);
create index if not exists idx_products_family_id on public.products(family_id);
create index if not exists idx_products_canonical_store on public.products(canonical_store_id);
create index if not exists idx_price_history_product_store on public.price_history(product_id, store_id, recorded_at desc);
create index if not exists idx_lists_family_owner on public.lists(family_id, owner_id);
create index if not exists idx_list_items_list_id on public.list_items(list_id);
create index if not exists idx_list_items_product_id on public.list_items(product_id);
create index if not exists idx_list_items_store_id on public.list_items(store_id);

-- 4. Business Logic Functions & Triggers

-- Automatically recalculate canonical_store_id when price_history changes
create or replace function public.recalculate_canonical_store()
returns trigger as $$
declare
  v_canonical_store_id uuid;
begin
  -- For each store that has recorded prices for this product, pick its latest price.
  -- Then pick the store with the minimum latest price.
  with latest_prices as (
    select distinct on (store_id) store_id, price, recorded_at
    from public.price_history
    where product_id = new.product_id
    order by store_id, recorded_at desc
  )
  select store_id into v_canonical_store_id
  from latest_prices
  order by price asc, recorded_at desc
  limit 1;

  update public.products
  set canonical_store_id = v_canonical_store_id
  where id = new.product_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_recalculate_canonical_store on public.price_history;
create trigger trg_recalculate_canonical_store
after insert or update on public.price_history
for each row execute function public.recalculate_canonical_store();

-- Automatically create default shared family list when a family is created
create or replace function public.handle_new_family()
returns trigger as $$
begin
  insert into public.lists (family_id, owner_id, name, is_shared)
  values (new.id, null, 'Lista Familiar', true);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_new_family_default_list on public.families;
create trigger trg_new_family_default_list
after insert on public.families
for each row execute function public.handle_new_family();

-- 5. Row Level Security (RLS) Helper Functions & Policies

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.price_history enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- Function to get the current authenticated user's family_id
create or replace function public.current_user_family_id()
returns uuid as $$
  select family_id from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- Profiles Policies
create policy "Users can view profiles within their family"
  on public.profiles for select
  using (family_id = public.current_user_family_id() or id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Families Policies
create policy "Users can view their own family"
  on public.families for select
  using (id = public.current_user_family_id());

create policy "Authenticated users can create a family"
  on public.families for insert
  to authenticated
  with check (true);

-- Stores Policies
create policy "Users can view stores of their family"
  on public.stores for select
  using (family_id = public.current_user_family_id());

create policy "Users can insert stores in their family"
  on public.stores for insert
  with check (family_id = public.current_user_family_id());

create policy "Users can update stores in their family"
  on public.stores for update
  using (family_id = public.current_user_family_id());

create policy "Users can delete stores in their family"
  on public.stores for delete
  using (family_id = public.current_user_family_id());

-- Products Policies
create policy "Users can view products of their family"
  on public.products for select
  using (family_id = public.current_user_family_id());

create policy "Users can insert products in their family"
  on public.products for insert
  with check (family_id = public.current_user_family_id());

create policy "Users can update products in their family"
  on public.products for update
  using (family_id = public.current_user_family_id());

create policy "Users can delete products in their family"
  on public.products for delete
  using (family_id = public.current_user_family_id());

-- Price History Policies
create policy "Users can view price history of family products"
  on public.price_history for select
  using (
    exists (
      select 1 from public.products
      where products.id = price_history.product_id
      and products.family_id = public.current_user_family_id()
    )
  );

create policy "Users can record prices for family products"
  on public.price_history for insert
  with check (
    exists (
      select 1 from public.products
      where products.id = price_history.product_id
      and products.family_id = public.current_user_family_id()
    )
  );

-- Lists Policies
create policy "Users can view shared family lists or their own personal lists"
  on public.lists for select
  using (
    family_id = public.current_user_family_id()
    and (is_shared = true or owner_id is null or owner_id = auth.uid())
  );

create policy "Users can insert lists in their family"
  on public.lists for insert
  with check (family_id = public.current_user_family_id());

create policy "Users can update lists they have access to"
  on public.lists for update
  using (
    family_id = public.current_user_family_id()
    and (is_shared = true or owner_id is null or owner_id = auth.uid())
  );

create policy "Users can delete lists they own or shared family lists"
  on public.lists for delete
  using (
    family_id = public.current_user_family_id()
    and (is_shared = true or owner_id is null or owner_id = auth.uid())
  );

-- List Items Policies
create policy "Users can view items of lists they can access"
  on public.list_items for select
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
      and lists.family_id = public.current_user_family_id()
      and (lists.is_shared = true or lists.owner_id is null or lists.owner_id = auth.uid())
    )
  );

create policy "Users can insert items in accessible lists"
  on public.list_items for insert
  with check (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
      and lists.family_id = public.current_user_family_id()
    )
  );

create policy "Users can update items in accessible lists"
  on public.list_items for update
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
      and lists.family_id = public.current_user_family_id()
    )
  );

create policy "Users can delete items in accessible lists"
  on public.list_items for delete
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
      and lists.family_id = public.current_user_family_id()
    )
  );

-- 6. Enable Realtime Publications
-- Add list_items and lists to supabase_realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.list_items, public.lists, public.stores, public.products, public.price_history;
commit;
