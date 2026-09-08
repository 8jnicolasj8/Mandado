'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, ListFilter, ShoppingBag, Store as StoreIcon, CheckCircle2, MessageCircle, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { ListItem } from '@/components/ui/ListItem';
import { WhatsAppButton, WhatsAppSendModal } from '@/components/ui/WhatsAppButton';
import { AddProductModal } from '@/components/ui/AddProductModal';
import { RecordPriceModal } from '@/components/ui/RecordPriceModal';
import { getCategoryEmoji } from '@/lib/utils/whatsapp';
import { formatCurrency } from '@/lib/utils/prices';
import { Product, Store, ListItemEnriched } from '@/lib/types/database';

export default function HomePage() {
  const { currentList, listItems, lists, setCurrentListId, removeCheckedItems } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStoreForAdd, setSelectedStoreForAdd] = useState<string | null>(null);
  const [storeToSendWhatsApp, setStoreToSendWhatsApp] = useState<string | null>(null);

  // Price record modal state
  const [priceModalData, setPriceModalData] = useState<{
    isOpen: boolean;
    product?: Product | null;
    store?: Store | null;
  }>({ isOpen: false });

  // Ensure current list is the shared family list if not set
  const sharedFamilyList = lists.find((l) => l.is_shared) || lists[0];

  const checkedCount = listItems.filter((i) => i.checked).length;
  const totalCount = listItems.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Group items by store
  const storeGroups = useMemo(() => {
    const groups = new Map<string, { store: Store | null; items: ListItemEnriched[]; subtotal: number }>();

    listItems.forEach((item) => {
      const storeId = item.store?.id || 'sin_tienda';
      if (!groups.has(storeId)) {
        groups.set(storeId, {
          store: item.store || null,
          items: [],
          subtotal: 0,
        });
      }

      const group = groups.get(storeId)!;
      group.items.push(item);
      if (item.latest_price) {
        group.subtotal += item.latest_price * item.quantity;
      }
    });

    return Array.from(groups.values());
  }, [listItems]);

  const estimatedTotal = useMemo(() => {
    return listItems.reduce((acc, item) => {
      if (item.latest_price) {
        return acc + item.latest_price * item.quantity;
      }
      return acc;
    }, 0);
  }, [listItems]);

  const handleOpenAddForStore = (storeId?: string) => {
    setSelectedStoreForAdd(storeId || null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Top Banner & List Switcher */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Lista Compartida
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium">
                {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mt-1">
              {currentList?.name || 'Lista Familiar'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {checkedCount > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(`¿Borrar los ${checkedCount} ${checkedCount === 1 ? 'producto comprado' : 'productos comprados'} de la lista?`)) {
                    removeCheckedItems();
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Borrar comprados
              </button>
            )}
            <Link
              href="/listas"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors"
            >
              <ListFilter className="w-3.5 h-3.5" />
              Mis Listas
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {checkedCount} de {totalCount} comprados
              </span>
              <span className="font-semibold text-emerald-700">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Estimated total */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Estimado total:</span>
          <span className="text-base font-extrabold font-mono text-gray-900">
            {formatCurrency(estimatedTotal)}
          </span>
        </div>
      </div>

      {/* Main Items grouped by Store */}
      {storeGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Tu lista está vacía</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Agrega los productos que tu familia necesita comprar hoy.
            </p>
          </div>
          <button
            onClick={() => handleOpenAddForStore()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Agregar primer producto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {storeGroups.map(({ store, items, subtotal }) => {
            const emoji = getCategoryEmoji(store?.category);

            return (
              <div
                key={store?.id || 'sin-tienda'}
                className="bg-white/60 rounded-2xl border border-gray-200/80 p-3 space-y-2.5 shadow-2xs"
              >
                {/* Store Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        {store?.name || 'Otras Tiendas / Sin Asignar'}
                      </h3>
                      {store?.category && (
                        <span className="text-[10px] text-gray-500 capitalize">
                          {store.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {subtotal > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {formatCurrency(subtotal)}
                      </span>
                    )}
                    <button
                      onClick={() => setStoreToSendWhatsApp(store?.id || 'sin-tienda')}
                      className="p-1 rounded-lg text-[#25D366] hover:bg-emerald-50 transition-colors"
                      title={`Pasar solo ${store?.name || 'esta tienda'} por WhatsApp`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenAddForStore(store?.id)}
                      className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Agregar producto a esta tienda"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items in this store */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <ListItem
                      key={item.id}
                      item={item}
                      onRecordPriceClick={() =>
                        setPriceModalData({
                          isOpen: true,
                          product: item.product,
                          store: item.store || null,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Product Button */}
      <div className="fixed bottom-24 left-4 z-30">
        <button
          onClick={() => handleOpenAddForStore()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-white/50"
          title="Agregar producto"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="font-bold text-xs tracking-wide">Agregar</span>
        </button>
      </div>

      {/* Fixed WhatsApp Export Button */}
      <WhatsAppButton listName={currentList?.name} />

      {/* WhatsApp Send Modal for specific store or custom selection */}
      <WhatsAppSendModal
        isOpen={Boolean(storeToSendWhatsApp)}
        onClose={() => setStoreToSendWhatsApp(null)}
        listName={currentList?.name}
        initialSelectedStoreId={storeToSendWhatsApp}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialStoreId={selectedStoreForAdd}
      />

      {/* Record Price Modal */}
      <RecordPriceModal
        isOpen={priceModalData.isOpen}
        onClose={() => setPriceModalData({ isOpen: false })}
        defaultProduct={priceModalData.product}
        defaultStore={priceModalData.store}
      />
    </div>
  );
}
