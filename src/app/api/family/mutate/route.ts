import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndsbngixgweetvrnzasz.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kc2JuZ2l4Z3dlZXR2cm56YXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTkwMDMsImV4cCI6MjEwNDM5NTAwM30.vOVi6bhvmWVhYJ79J8GLxAf9Lwy2a9mG-BCcCHrRik4';

  const supabaseServer = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = createAdminClient();
  const body = await request.json();
  const { action, payload } = body;

  try {
    switch (action) {
      case 'add_item': {
        const { data, error } = await admin
          .from('list_items')
          .insert({
            id: payload.id,
            list_id: payload.list_id,
            product_id: payload.product_id,
            store_id: payload.store_id || null,
            is_store_override: payload.is_store_override || false,
            quantity: payload.quantity || 1,
            unit: payload.unit || 'unidad',
            checked: false,
            added_by: user.id,
          })
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      case 'toggle_item': {
        const { data, error } = await admin
          .from('list_items')
          .update({ checked: payload.checked })
          .eq('id', payload.id)
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      case 'remove_item': {
        const { error } = await admin.from('list_items').delete().eq('id', payload.id);
        return NextResponse.json({ success: !error, error });
      }

      case 'remove_checked_items': {
        const { data, error } = await admin
          .from('list_items')
          .delete()
          .eq('list_id', payload.list_id)
          .eq('checked', true)
          .select('id');

        return NextResponse.json({ success: !error, error, removed: data });
      }

      case 'update_item_qty': {
        const { data, error } = await admin
          .from('list_items')
          .update({ quantity: payload.quantity })
          .eq('id', payload.id)
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      case 'change_item_store': {
        const { data, error } = await admin
          .from('list_items')
          .update({
            store_id: payload.store_id,
            is_store_override: payload.is_store_override,
          })
          .eq('id', payload.id)
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      case 'add_product': {
        const { data, error } = await admin
          .from('products')
          .insert({
            id: payload.id,
            family_id: payload.family_id,
            name: payload.name,
            canonical_store_id: payload.canonical_store_id || null,
          })
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      case 'record_price': {
        const { data, error } = await admin
          .from('price_history')
          .insert({
            id: payload.id,
            product_id: payload.product_id,
            store_id: payload.store_id,
            price: payload.price,
            recorded_by: user.id,
          })
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      case 'add_store': {
        const { data, error } = await admin
          .from('stores')
          .insert({
            id: payload.id,
            family_id: payload.family_id,
            name: payload.name,
            category: payload.category,
            address: payload.address || null,
            lat: payload.lat || null,
            lng: payload.lng || null,
          })
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      case 'create_list': {
        const { data, error } = await admin
          .from('lists')
          .insert({
            id: payload.id,
            family_id: payload.family_id,
            owner_id: payload.owner_id || null,
            name: payload.name,
            is_shared: payload.is_shared ?? true,
          })
          .select()
          .single();

        return NextResponse.json({ data, error });
      }

      default:
        return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en mutación' }, { status: 500 });
  }
}
