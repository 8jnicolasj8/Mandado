export type StoreCategory = 'verdulería' | 'verduleria' | 'supermercado' | 'carnicería' | 'carniceria' | 'otro';

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface Profile {
  id: string;
  family_id: string;
  display_name: string;
  avatar_color: string;
  phone?: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  family_id: string;
  name: string;
  category: StoreCategory;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  created_at: string;
}

export interface Product {
  id: string;
  family_id: string;
  name: string;
  canonical_store_id?: string | null;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  recorded_by?: string | null;
  recorded_at: string;
}

export interface ShoppingList {
  id: string;
  family_id: string;
  owner_id?: string | null; // null = shared family list
  name: string;
  is_shared: boolean;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  product_id: string;
  store_id?: string | null;
  is_store_override: boolean;
  quantity: number;
  unit?: string | null;
  checked: boolean;
  added_by?: string | null;
  created_at: string;
}

// Extended types for enriched views
export interface ListItemEnriched extends ListItem {
  product: Product;
  store?: Store | null;
  canonical_store?: Store | null;
  latest_price?: number | null;
  price_recorded_at?: string | null;
  is_price_outdated?: boolean;
  canonical_latest_price?: number | null;
}

export interface StoreGroupedItems {
  store: Store | null;
  items: ListItemEnriched[];
  subtotal: number;
}
