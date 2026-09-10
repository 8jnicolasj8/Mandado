-- ==============================================================================
-- MANDADO - Enable DELETE events in Supabase Realtime
-- Apply via Supabase SQL Editor.
--
-- Sin REPLICA IDENTITY FULL, Supabase Realtime NO emite eventos DELETE, así que
-- cuando un miembro de la familia borra items, los demás dispositivos no se
-- enteran en vivo.
-- ==============================================================================

alter table public.list_items replica identity full;
alter table public.products replica identity full;
alter table public.stores replica identity full;
alter table public.price_history replica identity full;
alter table public.lists replica identity full;
alter table public.profiles replica identity full;
alter table public.families replica identity full;