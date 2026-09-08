import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateFamilyInviteCode } from '@/lib/utils/family';

const DEFAULT_STORES_DATA = [
  { name: 'Supermercado Dia', category: 'supermercado', address: 'Adolfo Alsina 534, General Pinto', lat: -34.7648413, lng: -61.8927143 },
  { name: 'Supermercado El Gauchito', category: 'supermercado', address: 'General Pinto, Buenos Aires', lat: -34.7651100, lng: -61.8900772 },
  { name: 'Pollería Valeria', category: 'carniceria', address: 'Adolfo Alsina 559, General Pinto', lat: -34.7649500, lng: -61.8929000 },
  { name: 'Carnicería Justy', category: 'carniceria', address: 'General Pinto, Buenos Aires', lat: -34.7645000, lng: -61.8918000 },
  { name: 'Súper GAO', category: 'supermercado', address: 'Sarmiento 342, General Pinto', lat: -34.7652183, lng: -61.8935359 },
  { name: 'Carnicería Los Charitos', category: 'carniceria', address: 'General Pinto, Buenos Aires', lat: -34.7658000, lng: -61.8942000 },
  { name: 'Sanfra', category: 'supermercado', address: 'General Pinto, Buenos Aires', lat: -34.7684858, lng: -61.8879621 },
  { name: 'Supermercado Berlín', category: 'supermercado', address: 'General Pinto, Buenos Aires', lat: -34.7692101, lng: -61.8913783 },
  { name: 'Carnicería La Chacra', category: 'carniceria', address: 'General Pinto, Buenos Aires', lat: -34.7681164, lng: -61.8890326 },
  { name: 'Pollería Los Amigos', category: 'carniceria', address: 'General Pinto, Buenos Aires', lat: -34.7671451, lng: -61.8899217 },
  { name: 'Kiosco 84', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7630799, lng: -61.8904834 },
  { name: 'Kiosco Free PAZZ', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7660178, lng: -61.8913423 },
  { name: 'Kiosco Rey Sol', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7678752, lng: -61.8913943 },
  { name: 'Dietética Buena Vida', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7683016, lng: -61.8881593 },
  { name: 'Supermercado Luna', category: 'supermercado', address: 'General Pinto, Buenos Aires', lat: -34.7635117, lng: -61.889449 },
  { name: 'Autoservicio La Garita', category: 'supermercado', address: 'General Pinto, Buenos Aires', lat: -34.7700637, lng: -61.8869584 },
  { name: 'Panadería Los Abuelos', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7635545, lng: -61.8907016 },
  { name: 'Panadería Las Bambinas', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7652718, lng: -61.891053 },
  { name: 'Panadería La Italiana', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7657701, lng: -61.8909698 },
  { name: 'Panadería 2 de Abril', category: 'otro', address: 'General Pinto, Buenos Aires', lat: -34.7645533, lng: -61.8924035 },
];

const LEGACY_SEED_PRODUCTS = [
  'Dulce de Leche 400g',
  'Shampoo Nutritivo 400ml',
  'Tira de asado',
  'Suprema de pollo',
  'Manzana roja',
  'Banana',
];

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

  const { data: { user }, error: userErr } = await supabaseServer.auth.getUser();
  if (!user || userErr) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = createAdminClient();
  const meta = user.user_metadata || {};
  const displayName = meta.display_name || user.email?.split('@')[0] || 'Mi Usuario';
  const avatarColor = meta.avatar_color || '#16A34A';
  const phone = meta.phone || null;

  // 1. Check if profile exists
  let { data: profile } = await admin
    .from('profiles')
    .select('*, families(*)')
    .eq('id', user.id)
    .maybeSingle();

  let familyId: string;
  let familyData: any;

  if (!profile) {
    // Determine family
    if (meta.family_code) {
      const { data: existingFam } = await admin
        .from('families')
        .select('*')
        .ilike('invite_code', meta.family_code.trim())
        .maybeSingle();

      if (existingFam) {
        familyId = existingFam.id;
        familyData = existingFam;
      }
    }

    if (!familyId!) {
      const inviteCode = meta.family_code || generateFamilyInviteCode();
      const familyName = meta.family_name || `Familia de ${displayName}`;
      const { data: newFam, error: newFamErr } = await admin
        .from('families')
        .insert({ name: familyName, invite_code: inviteCode })
        .select()
        .single();

      if (newFamErr || !newFam) {
        return NextResponse.json({ error: 'Error al crear la familia' }, { status: 500 });
      }
      familyId = newFam.id;
      familyData = newFam;
    }

    const { data: newProfile, error: newProfErr } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        family_id: familyId,
        display_name: displayName,
        avatar_color: avatarColor,
        phone,
      })
      .select('*, families(*)')
      .single();

    if (newProfErr || !newProfile) {
      return NextResponse.json({ error: 'Error al crear el perfil' }, { status: 500 });
    }
    profile = newProfile;
  } else {
    familyId = profile.family_id;
    familyData = profile.families;
  }

  // 2. Ensure default stores exist for this family (insert only the missing ones)
  const { data: existingStores } = await admin.from('stores').select('*').eq('family_id', familyId);
  if (!existingStores || existingStores.length === 0) {
    await admin.from('stores').insert(
      DEFAULT_STORES_DATA.map((s) => ({ ...s, family_id: familyId }))
    );
  } else {
    const existingNames = new Set(existingStores.map((s) => s.name));
    const missing = DEFAULT_STORES_DATA.filter((s) => !existingNames.has(s.name));
    if (missing.length > 0) {
      await admin.from('stores').insert(missing.map((s) => ({ ...s, family_id: familyId })));
    }
  }

  // 3. Remove legacy seed/mock products (they now live in the hardcoded
  // catalog). Only delete rows that aren't referenced by lists or prices.
  const { data: legacyProducts } = await admin
    .from('products')
    .select('id')
    .eq('family_id', familyId)
    .in('name', LEGACY_SEED_PRODUCTS);

  if (legacyProducts && legacyProducts.length > 0) {
    const legacyIds = legacyProducts.map((p) => p.id);
    const [{ data: itemRefs }, { data: priceRefs }] = await Promise.all([
      admin.from('list_items').select('product_id').in('product_id', legacyIds),
      admin.from('price_history').select('product_id').in('product_id', legacyIds),
    ]);
    const referenced = new Set<string>([
      ...(itemRefs || []).map((r) => r.product_id),
      ...(priceRefs || []).map((r) => r.product_id),
    ]);
    const toDelete = legacyIds.filter((id) => !referenced.has(id));
    if (toDelete.length > 0) {
      await admin.from('products').delete().eq('family_id', familyId).in('id', toDelete);
    }
  }

  // 4. Ensure default list exists
  const { data: existingLists } = await admin.from('lists').select('*').eq('family_id', familyId);
  if (!existingLists || existingLists.length === 0) {
    await admin.from('lists').insert({
      family_id: familyId,
      owner_id: null,
      name: 'Lista: Familiar',
      is_shared: true,
    });
  }

  // 5. Fetch all fresh data for this family
  const [
    { data: members },
    { data: stores },
    { data: products },
    { data: lists },
    { data: listItems },
    { data: priceHistory },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('family_id', familyId),
    admin.from('stores').select('*').eq('family_id', familyId),
    admin.from('products').select('*').eq('family_id', familyId),
    admin.from('lists').select('*').eq('family_id', familyId),
    admin.from('list_items').select('*'),
    admin.from('price_history').select('*').order('recorded_at', { ascending: false }),
  ]);

  // Filter list items that belong to the family's lists
  const familyListIds = new Set((lists || []).map((l) => l.id));
  const familyItems = (listItems || []).filter((item) => familyListIds.has(item.list_id));

  return NextResponse.json({
    family: familyData,
    profile,
    members: members || [profile],
    stores: stores || [],
    products: products || [],
    lists: lists || [],
    list_items: familyItems,
    price_history: priceHistory || [],
  });
}
