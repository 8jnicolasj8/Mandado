'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  X,
  Store as StoreIcon,
  Tag,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { PriceBadge } from '@/components/ui/PriceBadge';
import { RecordPriceModal } from '@/components/ui/RecordPriceModal';
import { formatPrice, getCategoryEmoji } from '@/lib/utils/whatsapp';
import { getPriceStatus } from '@/lib/utils/prices';

export default function ProductosPage() {
  const { products, stores, priceHistory, addProduct, addItemToList } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isRecordPriceModalOpen, setIsRecordPriceModalOpen] = useState(false);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New product form state
  const [newName, setNewName] = useState('');
  const [newStoreId, setNewStoreId] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Compute detailed price info per product
  const productsWithPrices = useMemo(() => {
    return filteredProducts.map((product) => {
      // Find all prices for this product
      const productPrices = priceHistory.filter((ph) => ph.product_id === product.id);

      // Group by store and get latest price per store
      const storePricesMap = new Map<string, { store: any; price: number; recordedAt: string }>();

      productPrices.forEach((ph) => {
        const store = stores.find((s) => s.id === ph.store_id);
        if (store) {
          const existing = storePricesMap.get(ph.store_id);
          if (!existing || new Date(ph.recorded_at).getTime() > new Date(existing.recordedAt).getTime()) {
            storePricesMap.set(ph.store_id, {
              store,
              price: ph.price,
              recordedAt: ph.recorded_at,
            });
          }
        }
      });

      const storePricesList = Array.from(storePricesMap.values()).sort(
        (a, b) => a.price - b.price
      );

      const canonicalStore = stores.find((s) => s.id === product.canonical_store_id);
      const lowestPriceObj = storePricesList.length > 0 ? storePricesList[0] : null;

      return {
        product,
        canonicalStore,
        lowestPriceObj,
        storePricesList,
      };
    });
  }, [filteredProducts, priceHistory, stores]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = addProduct({
      name: newName.trim(),
      initialStoreId: newStoreId || null,
      initialPrice: newPrice ? parseFloat(newPrice) : null,
    });

    setNewName('');
    setNewStoreId('');
    setNewPrice('');
    setIsNewProductModalOpen(false);

    setToastMessage(`Producto "${created.name}" creado con éxito`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleQuickAddToList = (product: any, canonicalStoreId?: string | null) => {
    addItemToList({
      productId: product.id,
      storeId: canonicalStoreId || null,
      isStoreOverride: false,
      quantity: 1,
      unit: 'unidad',
    });

    setToastMessage(`"${product.name}" agregado a tu lista de compras`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenRecordPrice = (productId: string) => {
    setSelectedProductForPrice(productId);
    setIsRecordPriceModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Catálogo de productos
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {products.length} productos registrados con historial de precios
          </p>
        </div>

        <button
          onClick={() => setIsNewProductModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-gray-200 rounded-2xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Products List */}
      <div className="space-y-2.5">
        {productsWithPrices.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
            <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">No encontramos productos</p>
            <p className="text-xs text-gray-400 mt-1">
              Prueba buscando con otro término o crea un nuevo producto.
            </p>
            <button
              onClick={() => {
                setNewName(searchQuery);
                setIsNewProductModalOpen(true);
              }}
              className="mt-4 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Crear &quot;{searchQuery || 'nuevo'}&quot;
            </button>
          </div>
        ) : (
          productsWithPrices.map(({ product, canonicalStore, lowestPriceObj, storePricesList }) => {
            const isExpanded = expandedProductId === product.id;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden transition-all duration-200 hover:border-gray-300"
              >
                {/* Main Card row */}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-gray-900 truncate">
                          {product.name}
                        </h2>
                      </div>

                      {/* Best Store Badge */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {canonicalStore ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                            <span>{getCategoryEmoji(canonicalStore.category)}</span>
                            <span>Más barato en: {canonicalStore.name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium">
                            Sin tienda asignada
                          </span>
                        )}

                        {lowestPriceObj && (
                          <PriceBadge
                            price={lowestPriceObj.price}
                            recordedAt={lowestPriceObj.recordedAt}
                            showPrice={true}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenRecordPrice(product.id)}
                        title="Registrar nuevo precio"
                        className="px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Precio</span>
                      </button>

                      <button
                        onClick={() => handleQuickAddToList(product, product.canonical_store_id)}
                        title="Agregar a la lista"
                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>

                      {storePricesList.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedProductId(isExpanded ? null : product.id)
                          }
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Store Comparison view */}
                {isExpanded && (
                  <div className="bg-gray-50/70 px-3.5 py-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>Comparativa de precios</span>
                      <span>{storePricesList.length} comercios</span>
                    </div>

                    <div className="space-y-1.5">
                      {storePricesList.map(({ store, price, recordedAt }, idx) => {
                        const isCheapest = idx === 0;

                        return (
                          <div
                            key={store.id}
                            className={`p-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                              isCheapest
                                ? 'bg-white border border-emerald-200 shadow-2xs'
                                : 'bg-white/80 border border-gray-200/60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{getCategoryEmoji(store.category)}</span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-800">{store.name}</span>
                                  {isCheapest && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded-md">
                                      ⭐ Mínimo
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 capitalize">
                                  {store.category}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-extrabold text-gray-900">
                                {formatPrice(price)}
                              </div>
                              <PriceBadge
                                price={price}
                                recordedAt={recordedAt}
                                showPrice={false}
                                size="sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Product */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  📦
                </div>
                <h2 className="text-base font-bold text-gray-900">Crear producto</h2>
              </div>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre del producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Leche entera 1L"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tienda donde lo viste <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <select
                  value={newStoreId}
                  onChange={(e) => setNewStoreId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">Ninguna por ahora</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {newStoreId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Precio inicial observado <span className="text-gray-400 font-normal">($)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 1200"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                >
                  Crear producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Price */}
      <RecordPriceModal
        isOpen={isRecordPriceModalOpen}
        onClose={() => setIsRecordPriceModalOpen(false)}
        defaultProductId={selectedProductForPrice || undefined}
      />
    </div>
  );
}
