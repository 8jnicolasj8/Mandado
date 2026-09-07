import { Family, Profile, Store, Product, PriceHistory, ShoppingList, ListItemEnriched } from './types/database';

export const DEFAULT_FAMILY: Family = {
  id: 'fam-default-001',
  name: 'Mi Familia',
  invite_code: 'MAND-PINTO',
  created_at: new Date().toISOString(),
};

export const DEFAULT_PROFILES: Profile[] = [];

export const DEFAULT_STORES: Store[] = [
  {
    id: 'store-dia',
    family_id: 'fam-default-001',
    name: 'Supermercado Dia',
    category: 'supermercado',
    address: 'Adolfo Alsina 534, General Pinto',
    lat: -34.7648413,
    lng: -61.8927143,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-gauchito',
    family_id: 'fam-default-001',
    name: 'Supermercado El Gauchito',
    category: 'supermercado',
    address: 'General Pinto, Buenos Aires',
    lat: -34.7651100,
    lng: -61.8900772,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-valeria',
    family_id: 'fam-default-001',
    name: 'Pollería Valeria',
    category: 'carniceria',
    address: 'Adolfo Alsina 559, General Pinto',
    lat: -34.7649500,
    lng: -61.8929000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-justy',
    family_id: 'fam-default-001',
    name: 'Carnicería Justy',
    category: 'carniceria',
    address: 'General Pinto, Buenos Aires',
    lat: -34.7645000,
    lng: -61.8918000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-gao',
    family_id: 'fam-default-001',
    name: 'Súper GAO',
    category: 'supermercado',
    address: 'Sarmiento 342, General Pinto',
    lat: -34.7652183,
    lng: -61.8935359,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-charitos',
    family_id: 'fam-default-001',
    name: 'Carnicería Los Charitos',
    category: 'carniceria',
    address: 'General Pinto, Buenos Aires',
    lat: -34.7658000,
    lng: -61.8942000,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-ddl',
    family_id: 'fam-default-001',
    name: 'Dulce de Leche 400g',
    canonical_store_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-shampoo',
    family_id: 'fam-default-001',
    name: 'Shampoo Nutritivo 400ml',
    canonical_store_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-asado',
    family_id: 'fam-default-001',
    name: 'Tira de asado',
    canonical_store_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-pollo',
    family_id: 'fam-default-001',
    name: 'Suprema de pollo',
    canonical_store_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-manzana',
    family_id: 'fam-default-001',
    name: 'Manzana roja',
    canonical_store_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-banana',
    family_id: 'fam-default-001',
    name: 'Banana',
    canonical_store_id: null,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_PRICE_HISTORY: PriceHistory[] = [];

export const DEFAULT_LISTS: ShoppingList[] = [
  {
    id: 'list-family-001',
    family_id: 'fam-default-001',
    owner_id: null,
    name: 'Lista: Familiar',
    is_shared: true,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_LIST_ITEMS: ListItemEnriched[] = [];
