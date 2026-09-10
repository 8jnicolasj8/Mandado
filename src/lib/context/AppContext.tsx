'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Family,
  Profile,
  Store,
  Product,
  PriceHistory,
  ShoppingList,
  ListItemEnriched,
  StoreCategory,
} from '../types/database';
import {
  DEFAULT_FAMILY,
  DEFAULT_PROFILES,
  DEFAULT_STORES,
  DEFAULT_PRODUCTS,
  DEFAULT_PRICE_HISTORY,
  DEFAULT_LISTS,
  DEFAULT_LIST_ITEMS,
} from '../initial-data';
import { isSupabaseConfigured, createClient } from '../supabase/client';
import { getPriceStatus } from '../utils/prices';
import { formatListName } from '../utils/whatsapp';
import { generateFamilyInviteCode } from '../utils/family';

interface AppContextType {
  family: Family;
  currentProfile: Profile;
  familyMembers: Profile[];
  stores: Store[];
  products: Product[];
  priceHistory: PriceHistory[];
  lists: ShoppingList[];
  currentListId: string;
  currentList: ShoppingList | undefined;
  listItems: ListItemEnriched[];
  isDemoMode: boolean;
  isLoading: boolean;
  setCurrentListId: (id: string) => void;
  toggleCheckItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, newQty: number) => void;
  addItemToList: (item: {
    productId: string;
    storeId?: string | null;
    isStoreOverride?: boolean;
    quantity: number;
    unit?: string | null;
  }) => void;
  removeItem: (itemId: string) => void;
  removeCheckedItems: () => void;
  changeItemStore: (itemId: string, newStoreId: string, isOverride: boolean) => void;
  addStore: (store: Omit<Store, 'id' | 'family_id' | 'created_at'>) => Store;
  addProduct: (product: { name: string; initialStoreId?: string | null; initialPrice?: number | null; id?: string }) => Product;
  recordPrice: (productId: string, storeId: string, price: number) => void;
  createList: (name: string, isShared: boolean) => ShoppingList;
  getLatestPriceForStore: (productId: string, storeId: string) => { price: number; recordedAt: string } | null;
  updateProfilePhone: (phone: string) => void;
  updateFamilySettings: (patch: { search_radius_km?: number | null }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Core state
  const [family, setFamily] = useState<Family>(DEFAULT_FAMILY);
  const [currentProfile, setCurrentProfile] = useState<Profile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mandado_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.display_name && parsed.display_name !== 'Mi Usuario') {
            return parsed;
          }
        }
      } catch (_) {}
    }
    return {
      id: 'user-main',
      family_id: DEFAULT_FAMILY.id,
      display_name: '',
      avatar_color: '#16A34A',
      created_at: new Date().toISOString()
    };
  });
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
  const [stores, setStores] = useState<Store[]>(DEFAULT_STORES);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>(DEFAULT_PRICE_HISTORY);
  const [lists, setLists] = useState<ShoppingList[]>(DEFAULT_LISTS);
  const [currentListId, setCurrentListId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mandado_current_list_id') || DEFAULT_LISTS[0].id;
    }
    return DEFAULT_LISTS[0].id;
  });
  const [rawItems, setRawItems] = useState(DEFAULT_LIST_ITEMS);

  // Load from localStorage or Supabase on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSupabase = isSupabaseConfigured();
    setIsDemo(!hasSupabase);

    try {
      const currentV = localStorage.getItem('mandado_version');
      if (currentV !== '3.1') {
        localStorage.setItem('mandado_version', '3.1');
      }

      const savedStores = localStorage.getItem('mandado_stores');
      if (savedStores) setStores(JSON.parse(savedStores));

      const savedProducts = localStorage.getItem('mandado_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedPrices = localStorage.getItem('mandado_price_history');
      if (savedPrices) setPriceHistory(JSON.parse(savedPrices));

      const savedLists = localStorage.getItem('mandado_lists');
      if (savedLists) {
        const parsed = JSON.parse(savedLists);
        setLists(parsed.map((l: ShoppingList) => ({ ...l, name: formatListName(l.name) })));
        // Keep the user on a list that actually exists (persisted or first available)
        setCurrentListId((prev) => {
          const persistedId = localStorage.getItem('mandado_current_list_id');
          const target = persistedId || prev;
          return parsed.some((l: ShoppingList) => l.id === target) ? target : parsed[0]?.id || prev;
        });
      }

      const savedItems = localStorage.getItem('mandado_raw_items');
      if (savedItems) setRawItems(JSON.parse(savedItems));

      const savedProfile = localStorage.getItem('mandado_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.display_name && parsed.display_name !== 'Mi Usuario') {
          setCurrentProfile(parsed);
        }
      }

      const savedFamilyName = localStorage.getItem('mandado_family_name');
      const savedInviteCode = localStorage.getItem('mandado_family_invite_code');
      if (savedFamilyName || savedInviteCode) {
        setFamily((prev) => ({
          ...prev,
          ...(savedFamilyName ? { name: savedFamilyName } : {}),
          ...(savedInviteCode ? { invite_code: savedInviteCode } : {}),
        }));
      }

      const savedMembers = localStorage.getItem('mandado_family_members');
      if (savedMembers) setFamilyMembers(JSON.parse(savedMembers));
    } catch (e) {
      console.error('Error loading stored data', e);
    }

    if (hasSupabase) {
      const supabase = createClient();

      const syncAuthUser = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const pathname = window.location.pathname;
          const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

          if (!user) {
            if (!isAuthRoute) {
              window.location.href = '/login';
            }
            return;
          }

          // Fetch full synchronized family data from server API
          try {
            const res = await fetch('/api/family/sync', { method: 'POST' });
            if (res.ok) {
              const data = await res.json();
              if (data.family) {
                setFamily(data.family);
                localStorage.setItem('mandado_family_name', data.family.name);
                localStorage.setItem('mandado_family_invite_code', data.family.invite_code);
              }
              if (data.profile) {
                setCurrentProfile(data.profile);
                localStorage.setItem('mandado_profile', JSON.stringify(data.profile));
              }
              if (data.members && data.members.length > 0) {
                setFamilyMembers(data.members);
              }
              if (data.stores && data.stores.length > 0) {
                setStores(data.stores);
              }
              if (data.products && data.products.length > 0) {
                setProducts(data.products);
              }
              if (data.lists && data.lists.length > 0) {
                setLists(data.lists);
                setCurrentListId((prev) =>
                  data.lists.some((l: any) => l.id === prev) ? prev : data.lists[0].id
                );
              }
              if (data.list_items) {
                // Merge instead of replacing: keep recent optimistic additions
                // that haven't been ingested by the server fetch yet, so a
                // sync arriving right after an add doesn't make items vanish.
                setRawItems((prev) => {
                  const merged = new Map<string, any>();
                  for (const it of data.list_items) merged.set(it.id, it);
                  for (const it of prev) if (!merged.has(it.id)) merged.set(it.id, it);
                  return Array.from(merged.values());
                });
              }
              if (data.price_history) {
                setPriceHistory(data.price_history);
              }
            }
          } catch (syncErr) {
            console.error('Error fetching /api/family/sync:', syncErr);
          }
        } catch (err) {
          console.error('Error syncing Supabase auth user', err);
        }
      };

      syncAuthUser();

      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          syncAuthUser();
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('mandado_profile');
          const pathname = window.location.pathname;
          if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
            window.location.href = '/login';
          }
        }
      });

      // Connect Supabase Realtime for instant multi-device synchronization
      const realtimeChannel = supabase
        .channel('mandado-global-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any;
            setRawItems((prev) => (prev.some((i) => i.id === newItem.id) ? prev : [newItem, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setRawItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) setRawItems((prev) => prev.filter((i) => i.id !== deletedId));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newP = payload.new as Product;
            setProducts((prev) => (prev.some((p) => p.id === newP.id) ? prev : [...prev, newP]));
          } else if (payload.eventType === 'UPDATE') {
            const updatedP = payload.new as Product;
            setProducts((prev) => prev.map((p) => (p.id === updatedP.id ? updatedP : p)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) setProducts((prev) => prev.filter((p) => p.id !== deletedId));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newS = payload.new as Store;
            setStores((prev) => (prev.some((s) => s.id === newS.id) ? prev : [...prev, newS]));
          } else if (payload.eventType === 'UPDATE') {
            const updatedS = payload.new as Store;
            setStores((prev) => prev.map((s) => (s.id === updatedS.id ? updatedS : s)));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'price_history' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPh = payload.new as PriceHistory;
            setPriceHistory((prev) => [newPh, ...prev]);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newL = payload.new as ShoppingList;
            setLists((prev) => (prev.some((l) => l.id === newL.id) ? prev : [...prev, newL]));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedMember = payload.new as Profile;
            setFamilyMembers((prev) => {
              if (prev.some((m) => m.id === updatedMember.id)) {
                return prev.map((m) => (m.id === updatedMember.id ? updatedMember : m));
              }
              return [...prev, updatedMember];
            });
          }
        })
        .subscribe();

      return () => {
        authListener.subscription.unsubscribe();
        supabase.removeChannel(realtimeChannel);
      };
    }
  }, []);

  // Save to localStorage for offline persistence
  const persistData = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mandado_stores', JSON.stringify(stores));
      localStorage.setItem('mandado_products', JSON.stringify(products));
      localStorage.setItem('mandado_price_history', JSON.stringify(priceHistory));
      localStorage.setItem('mandado_lists', JSON.stringify(lists));
      localStorage.setItem('mandado_current_list_id', currentListId);
      localStorage.setItem('mandado_raw_items', JSON.stringify(rawItems));
      if (currentProfile.display_name && currentProfile.display_name !== 'Mi Usuario') {
        localStorage.setItem('mandado_profile', JSON.stringify(currentProfile));
      }
      localStorage.setItem('mandado_family_members', JSON.stringify(familyMembers));
    } catch (e) {
      console.error('Error saving data', e);
    }
  }, [stores, products, priceHistory, lists, currentListId, rawItems, currentProfile, familyMembers]);

  useEffect(() => {
    persistData();
  }, [persistData]);

  // Helper to fetch latest price of a product at a given store
  const getLatestPriceForStore = useCallback(
    (productId: string, storeId: string): { price: number; recordedAt: string } | null => {
      const records = priceHistory
        .filter((ph) => ph.product_id === productId && ph.store_id === storeId)
        .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

      if (records.length === 0) return null;
      return { price: records[0].price, recordedAt: records[0].recorded_at };
    },
    [priceHistory]
  );

  // Helper to find canonical store (store with the lowest latest price)
  const calculateCanonicalStore = useCallback(
    (productId: string): { storeId: string | null; lowestPrice: number | null } => {
      const productPrices = priceHistory.filter((ph) => ph.product_id === productId);
      if (productPrices.length === 0) return { storeId: null, lowestPrice: null };

      // Latest price for each store
      const storeLatestMap = new Map<string, { price: number; recordedAt: string }>();
      productPrices.forEach((ph) => {
        const existing = storeLatestMap.get(ph.store_id);
        if (!existing || new Date(ph.recorded_at).getTime() > new Date(existing.recordedAt).getTime()) {
          storeLatestMap.set(ph.store_id, { price: ph.price, recordedAt: ph.recorded_at });
        }
      });

      let lowestPrice: number | null = null;
      let canonicalStoreId: string | null = null;

      storeLatestMap.forEach(({ price }, sId) => {
        if (lowestPrice === null || price < lowestPrice) {
          lowestPrice = price;
          canonicalStoreId = sId;
        }
      });

      return { storeId: canonicalStoreId, lowestPrice };
    },
    [priceHistory]
  );

  // Enriched list items with resolved products, stores, latest prices, and canonical data
  const listItems = useMemo<ListItemEnriched[]>(() => {
    return rawItems
      .filter((item) => item.list_id === currentListId)
      .map((item) => {
        const product = products.find((p) => p.id === item.product_id) || {
          id: item.product_id,
          family_id: family.id,
          name: 'Producto sin nombre',
          canonical_store_id: null,
          created_at: item.created_at,
        };

        const store = stores.find((s) => s.id === item.store_id) || null;
        const canonicalStore = stores.find((s) => s.id === product.canonical_store_id) || null;

        // Current assigned store latest price
        let latestPrice: number | null = null;
        let priceRecordedAt: string | null = null;
        let isPriceOutdated = false;

        if (item.store_id) {
          const storePrice = getLatestPriceForStore(item.product_id, item.store_id);
          if (storePrice) {
            latestPrice = storePrice.price;
            priceRecordedAt = storePrice.recordedAt;
            const status = getPriceStatus(storePrice.recordedAt);
            isPriceOutdated = status ? status.isOutdated : false;
          }
        }

        // Canonical store price
        let canonicalLatestPrice: number | null = null;
        if (product.canonical_store_id) {
          const cPrice = getLatestPriceForStore(item.product_id, product.canonical_store_id);
          if (cPrice) canonicalLatestPrice = cPrice.price;
        }

        return {
          ...item,
          product,
          store,
          canonical_store: canonicalStore,
          latest_price: latestPrice,
          price_recorded_at: priceRecordedAt,
          is_price_outdated: isPriceOutdated,
          canonical_latest_price: canonicalLatestPrice,
        };
      });
  }, [rawItems, currentListId, products, stores, family.id, getLatestPriceForStore]);

  const currentList = useMemo(() => {
    return lists.find((l) => l.id === currentListId);
  }, [lists, currentListId]);

  // Helper to send mutations to server
  const mutateServer = useCallback(async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/family/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error(`mutateServer (${action}) falló:`, body);
      }
    } catch (err) {
      console.error(`Error in mutateServer (${action}):`, err);
    }
  }, []);

  // Actions
  const toggleCheckItem = useCallback(
    (itemId: string) => {
      setRawItems((prev) => {
        const item = prev.find((i) => i.id === itemId);
        const nextChecked = item ? !item.checked : true;
        mutateServer('toggle_item', { id: itemId, checked: nextChecked });
        return prev.map((i) => (i.id === itemId ? { ...i, checked: nextChecked } : i));
      });
    },
    [mutateServer]
  );

  const updateItemQuantity = useCallback(
    (itemId: string, newQty: number) => {
      if (newQty <= 0) return;
      setRawItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
      );
      mutateServer('update_item_qty', { id: itemId, quantity: newQty });
    },
    [mutateServer]
  );

  const addItemToList = useCallback(
    ({
      productId,
      storeId,
      isStoreOverride = false,
      quantity,
      unit,
    }: {
      productId: string;
      storeId?: string | null;
      isStoreOverride?: boolean;
      quantity: number;
      unit?: string | null;
    }) => {
      const product = products.find((p) => p.id === productId);
      const chosenStoreId = storeId !== undefined ? storeId : product?.canonical_store_id || null;
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`;

      const newItem: any = {
        id: newId,
        list_id: currentListId,
        product_id: productId,
        store_id: chosenStoreId,
        is_store_override: isStoreOverride,
        quantity: quantity || 1,
        unit: unit || 'unidad',
        checked: false,
        added_by: currentProfile.id,
        created_at: new Date().toISOString(),
        product_name: product?.name || null,
      };

      setRawItems((prev) => [newItem, ...prev]);
      mutateServer('add_item', newItem);
    },
    [currentListId, products, currentProfile.id, mutateServer]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setRawItems((prev) => prev.filter((item) => item.id !== itemId));
      mutateServer('remove_item', { id: itemId });
    },
    [mutateServer]
  );

  const removeCheckedItems = useCallback(() => {
    setRawItems((prev) => prev.filter((item) => !(item.list_id === currentListId && item.checked)));
    mutateServer('remove_checked_items', { list_id: currentListId });
  }, [currentListId, mutateServer]);

  const changeItemStore = useCallback(
    (itemId: string, newStoreId: string, isOverride: boolean) => {
      setRawItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                store_id: newStoreId,
                is_store_override: isOverride,
              }
            : item
        )
      );
      mutateServer('change_item_store', { id: itemId, store_id: newStoreId, is_store_override: isOverride });
    },
    [mutateServer]
  );

  const addStore = useCallback(
    (storeData: Omit<Store, 'id' | 'family_id' | 'created_at'>): Store => {
      const newStoreId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `store-${Date.now()}`;
      const newStore: Store = {
        id: newStoreId,
        family_id: family.id,
        name: storeData.name,
        category: storeData.category,
        address: storeData.address || null,
        lat: storeData.lat || null,
        lng: storeData.lng || null,
        created_at: new Date().toISOString(),
      };

      setStores((prev) => [...prev, newStore]);
      mutateServer('add_store', newStore);
      return newStore;
    },
    [family.id, mutateServer]
  );

  const addProduct = useCallback(
    (productData: { name: string; initialStoreId?: string | null; initialPrice?: number | null; id?: string }): Product => {
      // Los ids determinísticos del formato catalog-N / seed-... no caben en la
      // columna uuid de Supabase. Si vienen con un id no-UUID, generamos uno
      // real (la deduplicación por nombre ya evita duplicados).
      const isValidUuid = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const newProductId =
        productData.id && isValidUuid(productData.id)
          ? productData.id
          : typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `prod-${Date.now()}`;
      const newProduct: Product = {
        id: newProductId,
        family_id: family.id,
        name: productData.name,
        canonical_store_id: productData.initialStoreId || null,
        created_at: new Date().toISOString(),
      };

      setProducts((prev) => [...prev, newProduct]);
      mutateServer('add_product', newProduct);

      if (productData.initialStoreId && productData.initialPrice) {
        const newPriceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ph-${Date.now()}`;
        const newPriceRecord: PriceHistory = {
          id: newPriceId,
          product_id: newProductId,
          store_id: productData.initialStoreId,
          price: productData.initialPrice,
          recorded_by: currentProfile.id,
          recorded_at: new Date().toISOString(),
        };
        setPriceHistory((prev) => [...prev, newPriceRecord]);
        mutateServer('record_price', newPriceRecord);
      }

      return newProduct;
    },
    [family.id, currentProfile.id, mutateServer]
  );

  const recordPrice = useCallback(
    (productId: string, storeId: string, price: number) => {
      const newPriceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ph-${Date.now()}`;
      const newRecord: PriceHistory = {
        id: newPriceId,
        product_id: productId,
        store_id: storeId,
        price,
        recorded_by: currentProfile.id,
        recorded_at: new Date().toISOString(),
      };

      const updatedHistory = [...priceHistory, newRecord];
      setPriceHistory(updatedHistory);
      mutateServer('record_price', newRecord);

      // Recalculate canonical store
      const { storeId: newCanonicalStoreId } = calculateCanonicalStore(productId);
      if (newCanonicalStoreId) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, canonical_store_id: newCanonicalStoreId } : p
          )
        );
      }
    },
    [currentProfile.id, priceHistory, calculateCanonicalStore, mutateServer]
  );

  const createList = useCallback(
    (name: string, isShared: boolean): ShoppingList => {
      const formattedName = formatListName(name);
      const newListId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `list-${Date.now()}`;
      const newList: ShoppingList = {
        id: newListId,
        family_id: family.id,
        owner_id: isShared ? null : currentProfile.id,
        name: formattedName,
        is_shared: isShared,
        created_at: new Date().toISOString(),
      };

      setLists((prev) => [...prev, newList]);
      setCurrentListId(newList.id);
      mutateServer('create_list', newList);
      return newList;
    },
    [family.id, currentProfile.id, mutateServer]
  );

  const updateProfilePhone = useCallback((phone: string) => {
    setCurrentProfile((prev) => {
      const updated = { ...prev, phone };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mandado_profile', JSON.stringify(updated));
      }
      return updated;
    });
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === currentProfile.id ? { ...m, phone } : m))
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.updateUser({
        data: { phone },
      }).catch(console.error);
    }
  }, [currentProfile.id]);

  const updateFamilySettings = useCallback(
    (patch: { search_radius_km?: number | null }) => {
      setFamily((prev) => ({ ...prev, ...patch }));
      mutateServer('update_family', patch);
    },
    [mutateServer]
  );

  const value = {
    family,
    currentProfile,
    familyMembers,
    stores,
    products,
    priceHistory,
    lists,
    currentListId,
    currentList,
    listItems,
    isDemoMode: isDemo,
    isLoading,
    setCurrentListId,
    toggleCheckItem,
    updateItemQuantity,
    addItemToList,
    removeItem,
    removeCheckedItems,
    changeItemStore,
    addStore,
    addProduct,
    recordPrice,
    createList,
    getLatestPriceForStore,
    updateProfilePhone,
    updateFamilySettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
