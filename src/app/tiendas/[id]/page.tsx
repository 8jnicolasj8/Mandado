'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store as StoreIcon,
  MapPin,
  Tag,
  Plus,
  Sparkles,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { PriceBadge } from '@/components/ui/PriceBadge';
import { RecordPriceModal } from '@/components/ui/RecordPriceModal';
import { StoreMap } from '@/components/maps/StoreMap';
import { getCategoryEmoji, CATEGORY_LABELS, formatPrice } from '@/lib/utils/whatsapp';
import { getPriceStatus } from '@/lib/utils/prices';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const { stores, products, priceHistory, addItemToList } = useApp();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [justAddedMsg, setJustAddedMsg] = useState<string | null>(null);

  const store = useMemo(() => stores.find((s) => s.id === storeId), [stores, storeId]);

  // Find all prices recorded for this store (latest price per product)
  const storeProducts = useMemo(() => {
    if (!store) return [];

    const productMap = new Map<string, {
      product: any;
      latestPrice: number;
      recordedAt: string;
      isCanonical: boolean;
      allStorePrices: { storeName: string; price: number }[];
    }>();

    // Group priceHistory for this store
    const storeHistory = priceHistory
      .filter((ph) => ph.store_id === storeId)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    storeHistory.forEach((ph) => {
      if (!productMap.has(ph.product_id)) {
        const prod = products.find((p) => p.id === ph.product_id);
        if (prod) {
          const isCanonical = prod.canonical_store_id === storeId;

          // Find prices in other stores for comparison
          const otherStorePrices: { storeName: string; price: number }[] = [];
          stores.forEach((s) => {
            const latest = priceHistory
              .filter((h) => h.product_id === prod.id && h.store_id === s.id)
              .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
            if (latest) {
              otherStorePrices.push({ storeName: s.name, price: latest.price });
            }
          });

          productMap.set(ph.product_id, {
            product: prod,
            latestPrice: ph.price,
            recordedAt: ph.recorded_at,
            isCanonical,
            allStorePrices: otherStorePrices,
          });
        }
      }
    });

    return Array.from(productMap.values());
  }, [store, priceHistory, products, storeId, stores]);

  if (!store) {
    return (
      <div className="py-12 text-center space-y-3">
        <StoreIcon className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="text-sm font-semibold text-gray-800">Tienda no encontrada</p>
        <Link
          href="/tiendas"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a tiendas
        </Link>
      </div>
    );
  }

  const emoji = getCategoryEmoji(store.category);

  const handleQuickAddToList = (productId: string, productName: string) => {
    addItemToList({
      productId,
      storeId: store.id,
      isStoreOverride: true,
      quantity: 1,
      unit: 'unidad',
    });
    setJustAddedMsg(`"${productName}" agregado a tu lista`);
    setTimeout(() => setJustAddedMsg(null), 2500);
  };

  const handleOpenRecordPrice = (productId?: string) => {
    setSelectedProductId(productId || null);
    setIsRecordModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/tiendas"
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tiendas
        </Link>

        <button
          onClick={() => handleOpenRecordPrice()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar precio
        </button>
      </div>

      {/* Success alert toast */}
      {justAddedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {justAddedMsg}
        </div>
      )}

      {/* Store Hero Card */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            {emoji}
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900 tracking-tight">{store.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="capitalize font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {CATEGORY_LABELS[store.category] || store.category}
              </span>
              {store.address && (
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {store.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
          <div className="bg-gray-50 p-2.5 rounded-xl">
            <span className="text-[11px] text-gray-500 block">Precios registrados</span>
            <span className="text-base font-bold text-gray-900">
              {storeProducts.length}{' '}
              <span className="text-xs font-normal text-gray-400">productos</span>
            </span>
          </div>
          <div className="bg-emerald-50/60 p-2.5 rounded-xl">
            <span className="text-[11px] text-emerald-800 block">Precios más bajos</span>
            <span className="text-base font-bold text-emerald-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {storeProducts.filter((p) => p.isCanonical).length}
            </span>
          </div>
        </div>

        {/* Map view if coordinates exist */}
        {store.lat && store.lng && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Ubicación
            </p>
            <StoreMap
              stores={[store]}
              selectedStoreId={store.id}
              className="h-36 w-full rounded-xl"
            />
          </div>
        )}
      </div>

      {/* Products list for this store */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Precios registrados en esta tienda
          </h2>
          <span className="text-[11px] text-gray-500 font-medium">
            {storeProducts.length} items
          </span>
        </div>

        {storeProducts.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
            <Tag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-gray-700">Aún no hay precios registrados aquí</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Cuando compres o visites esta tienda, anota los precios para que Mandado aprenda dónde conviene comprar.
            </p>
            <button
              onClick={() => handleOpenRecordPrice()}
              className="mt-3 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Registrar primer precio
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {storeProducts.map((item) => {
              const status = getPriceStatus(item.recordedAt);

              return (
                <div
                  key={item.product.id}
                  className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3 hover:border-gray-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {item.product.name}
                      </h3>
                      {item.isCanonical && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                          ⭐ Mejor precio
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-gray-900">
                        {formatPrice(item.latestPrice)}
                      </span>
                      <PriceBadge
                        price={item.latestPrice}
                        recordedAt={item.recordedAt}
                        showPrice={false}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenRecordPrice(item.product.id)}
                      title="Actualizar precio"
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      Actualizar
                    </button>
                    <button
                      onClick={() => handleQuickAddToList(item.product.id, item.product.name)}
                      title="Agregar a lista de compras"
                      className="p-1.5 text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record price modal */}
      <RecordPriceModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        defaultStoreId={store.id}
        defaultProductId={selectedProductId || undefined}
      />
    </div>
  );
}
