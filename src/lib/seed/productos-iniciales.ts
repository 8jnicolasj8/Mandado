// Seed inicial de productos para el catálogo de la familia (server-side).
// Solo se insertan los productos que aún no existen (comparados por nombre
// normalizado), así nunca se duplican los que ya están hardcodeados o creados
// en la app. La categoría queda como metadata (la tabla products no tiene
// columna de categoría: el catálogo hardcodeado la maneja por su cuenta).

import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeProductName } from '@/lib/data/productCatalog';

export interface InitialSeedProduct {
  nombre: string;
  categoria: string;
}

export const INITIAL_PRODUCTS: InitialSeedProduct[] = [
  { nombre: 'Azúcar', categoria: 'almacén' },
  { nombre: 'Chicle Uva', categoria: 'kiosco' },
  { nombre: 'Papel Higiénico', categoria: 'limpieza' },
  { nombre: 'Choclo en Granos', categoria: 'verdulería' },
  { nombre: 'Manteca', categoria: 'lácteos' },
  { nombre: 'Leche Sachet Descremada', categoria: 'lácteos' },
  { nombre: 'Galletitas Chocolate Vainilla', categoria: 'almacén' },
  { nombre: 'Medallón de Espinaca', categoria: 'congelados' },
  { nombre: 'Gelatina Frambuesa', categoria: 'almacén' },
  { nombre: 'Arroz Parboil', categoria: 'almacén' },
  { nombre: 'Cacao en Polvo', categoria: 'almacén' },
  { nombre: 'Oblea Vainilla 100g', categoria: 'kiosco' },
  { nombre: 'Obleas Chocolate', categoria: 'kiosco' },
  { nombre: 'Ketchup', categoria: 'almacén' },
  { nombre: 'Crema de Leche', categoria: 'lácteos' },
  { nombre: 'Dulce de Leche', categoria: 'lácteos' },
  { nombre: 'Queso Crema', categoria: 'lácteos' },
  { nombre: 'Huevos', categoria: 'lácteos' },
  { nombre: 'Limones', categoria: 'verdulería' },
  { nombre: 'Jugo de Uva', categoria: 'almacén' },
  { nombre: 'Vino Blanco', categoria: 'otro' },
  { nombre: 'Mermelada', categoria: 'almacén' },
];

// Computa las filas a insertar a partir de los nombres ya existentes.
// Pura (sin DB): fácil de testear.
export function computeSeedRows(existingNames: Set<string>, familyId: string) {
  const missing = INITIAL_PRODUCTS.filter(
    (p) => !existingNames.has(normalizeProductName(p.nombre))
  );
  const now = new Date().toISOString();
  return missing.map((p, i) => ({
    id: `seed-${familyId.slice(0, 8)}-${i}`,
    family_id: familyId,
    name: p.nombre,
    canonical_store_id: null,
    created_at: now,
  }));
}

// Inserta los productos iniciales que falten. Devuelve cuántos insertó.
export async function seedInitialProducts(familyId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('products')
    .select('name')
    .eq('family_id', familyId);

  const existingNames = new Set((existing || []).map((p) => p.name));
  const rows = computeSeedRows(existingNames, familyId);
  if (rows.length === 0) return 0;

  // El id lo genera la base (uuid por default). Los ids seed-... no caben en
  // la columna uuid de Supabase.
  const { error } = await admin
    .from('products')
    .insert(rows.map(({ name, family_id, canonical_store_id, created_at }) => ({
      name,
      family_id,
      canonical_store_id,
      created_at,
    })));
  if (error) {
    console.error('seedInitialProducts error:', error.message);
    return 0;
  }
  return rows.length;
}