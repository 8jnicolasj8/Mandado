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
  changeItemStore: (itemId: string, newStoreId: string, isOverride: boolean) => void;
  addStore: (store: Omit<Store, 'id' | 'family_id' | 'created_at'>) => Store;
  addProduct: (product: { name: string; initialStoreId?: string | null; initialPrice?: number | null }) => Product;
  recordPrice: (productId: string, storeId: string, price: number) => void;
  createList: (name: string, isShared: boolean) => ShoppingList;
  getLatestPriceForStore: (productId: string, storeId: string) => { price: number; recordedAt: string } | null;
  updateProfilePhone: (phone: string) => void;
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
  const [currentListId, setCurrentListId] = useState<string>(DEFAULT_LISTS[0].id);
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
      if (savedFamilyName) {
        setFamily((prev) => ({ ...prev, name: savedFamilyName }));
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

          const meta = user.user_metadata || {};
          const displayName = meta.display_name || user.email?.split('@')[0] || 'Mi Perfil';
          const avatarColor = meta.avatar_color || '#16A34A';
          const phone = meta.phone || null;

          const updatedProfile: Profile = {
            id: user.id,
            family_id: DEFAULT_FAMILY.id,
            display_name: displayName,
            avatar_color: avatarColor,
            phone: phone,
            created_at: user.created_at || new Date().toISOString(),
          };

          setCurrentProfile(updatedProfile);
          localStorage.setItem('mandado_profile', JSON.stringify(updatedProfile));

          if (meta.family_name) {
            setFamily((prev) => ({ ...prev, name: meta.family_name }));
            localStorage.setItem('mandado_family_name', meta.family_name);
          }

          setFamilyMembers((prev) => {
            if (prev.length === 0 || !prev.some((m) => m.id === user.id)) {
              return [updatedProfile];
            }
            return prev.map((m) => (m.id === user.id ? updatedProfile : m));
          });
        } catch (err) {
          console.error('Error syncing Supabase auth user', err);
        }
      };

      syncAuthUser();

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const user = session.user;
          const meta = user.user_metadata || {};
          const displayName = meta.display_name || user.email?.split('@')[0] || 'Mi Perfil';
          const avatarColor = meta.avatar_color || '#16A34A';
          const phone = meta.phone || null;

          const updatedProfile: Profile = {
            id: user.id,
            family_id: DEFAULT_FAMILY.id,
            display_name: displayName,
            avatar_color: avatarColor,
            phone: phone,
            created_at: user.created_at || new Date().toISOString(),
          };

          setCurrentProfile(updatedProfile);
          localStorage.setItem('mandado_profile', JSON.stringify(updatedProfile));

          if (meta.family_name) {
            setFamily((prev) => ({ ...prev, name: meta.family_name }));
            localStorage.setItem('mandado_family_name', meta.family_name);
          }

          setFamilyMembers((prev) => {
            if (prev.length === 0 || !prev.some((m) => m.id === user.id)) {
              return [updatedProfile];
            }
            return prev.map((m) => (m.id === user.id ? updatedProfile : m));
          });
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('mandado_profile');
          const pathname = window.location.pathname;
          if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
            window.location.href = '/login';
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
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
      localStorage.setItem('mandado_raw_items', JSON.stringify(rawItems));
      if (currentProfile.display_name && currentProfile.display_name !== 'Mi Usuario') {
        localStorage.setItem('mandado_profile', JSON.stringify(currentProfile));
      }
      localStorage.setItem('mandado_family_members', JSON.stringify(familyMembers));
    } catch (e) {
      console.error('Error saving data', e);
    }
  }, [stores, products, priceHistory, lists, rawItems, currentProfile, familyMembers]);

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

  // Actions
  const toggleCheckItem = useCallback((itemId: string) => {
    setRawItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item))
    );
  }, []);

  const updateItemQuantity = useCallback((itemId: string, newQty: number) => {
    if (newQty <= 0) return;
    setRawItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
  }, []);

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

      const newItem: any = {
        id: `item-${Date.now()}`,
        list_id: currentListId,
        product_id: productId,
        store_id: chosenStoreId,
        is_store_override: isStoreOverride,
        quantity: quantity || 1,
        unit: unit || 'unidad',
        checked: false,
        added_by: currentProfile.id,
        created_at: new Date().toISOString(),
      };

      setRawItems((prev) => [newItem, ...prev]);
    },
    [currentListId, products, currentProfile.id]
  );

  const removeItem = useCallback((itemId: string) => {
    setRawItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const changeItemStore = useCallback((itemId: string, newStoreId: string, isOverride: boolean) => {
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
  }, []);

  const addStore = useCallback(
    (storeData: Omit<Store, 'id' | 'family_id' | 'created_at'>): Store => {
      const newStore: Store = {
        id: `store-${Date.now()}`,
        family_id: family.id,
        name: storeData.name,
        category: storeData.category,
        address: storeData.address || null,
        lat: storeData.lat || null,
        lng: storeData.lng || null,
        created_at: new Date().toISOString(),
      };

      setStores((prev) => [...prev, newStore]);
      return newStore;
    },
    [family.id]
  );

  const addProduct = useCallback(
    (productData: { name: string; initialStoreId?: string | null; initialPrice?: number | null }): Product => {
      const newProductId = `prod-${Date.now()}`;
      const newProduct: Product = {
        id: newProductId,
        family_id: family.id,
        name: productData.name,
        canonical_store_id: productData.initialStoreId || null,
        created_at: new Date().toISOString(),
      };

      setProducts((prev) => [...prev, newProduct]);

      if (productData.initialStoreId && productData.initialPrice) {
        const newPriceRecord: PriceHistory = {
          id: `ph-${Date.now()}`,
          product_id: newProductId,
          store_id: productData.initialStoreId,
          price: productData.initialPrice,
          recorded_by: currentProfile.id,
          recorded_at: new Date().toISOString(),
        };
        setPriceHistory((prev) => [...prev, newPriceRecord]);
      }

      return newProduct;
    },
    [family.id, currentProfile.id]
  );

  const recordPrice = useCallback(
    (productId: string, storeId: string, price: number) => {
      const newRecord: PriceHistory = {
        id: `ph-${Date.now()}`,
        product_id: productId,
        store_id: storeId,
        price,
        recorded_by: currentProfile.id,
        recorded_at: new Date().toISOString(),
      };

      const updatedHistory = [...priceHistory, newRecord];
      setPriceHistory(updatedHistory);

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
    [currentProfile.id, priceHistory, calculateCanonicalStore]
  );

  const createList = useCallback(
    (name: string, isShared: boolean): ShoppingList => {
      const formattedName = formatListName(name);
      const newList: ShoppingList = {
        id: `list-${Date.now()}`,
        family_id: family.id,
        owner_id: isShared ? null : currentProfile.id,
        name: formattedName,
        is_shared: isShared,
        created_at: new Date().toISOString(),
      };

      setLists((prev) => [...prev, newList]);
      setCurrentListId(newList.id);
      return newList;
    },
    [family.id, currentProfile.id]
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
    changeItemStore,
    addStore,
    addProduct,
    recordPrice,
    createList,
    getLatestPriceForStore,
    updateProfilePhone,
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
