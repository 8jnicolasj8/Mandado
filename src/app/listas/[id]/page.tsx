'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, ShoppingBag, CheckCircle2, MessageCircle } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { ListItem } from '@/components/ui/ListItem';
import { WhatsAppButton, WhatsAppSendModal } from '@/components/ui/WhatsAppButton';
import { AddProductModal } from '@/components/ui/AddProductModal';
import { RecordPriceModal } from '@/components/ui/RecordPriceModal';
import { getCategoryEmoji } from '@/lib/utils/whatsapp';
import { formatCurrency } from '@/lib/utils/prices';
import { Product, Store, ListItemEnriched } from '@/lib/types/database';

export default function SingleListPage() {
  const params = useParams();
  const listId = params?.id as string;
  const router = useRouter();
  const { lists, currentListId, setCurrentListId, listItems } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStoreForAdd, setSelectedStoreForAdd] = useState<string | null>(null);
  const [storeToSendWhatsApp, setStoreToSendWhatsApp] = useState<string | null>(null);

  const [priceModalData, setPriceModalData] = useState<{
    isOpen: boolean;
    product?: Product | null;
    store?: Store | null;
  }>({ isOpen: false });

  useEffect(() => {
    if (listId && listId !== currentListId) {
      setCurrentListId(listId);
    }
  }, [listId, currentListId, setCurrentListId]);

  const list = lists.find((l) => l.id === listId);

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

  if (!list) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-gray-500">Lista no encontrada.</p>
        <Link
          href="/listas"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Listas
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Back button and List Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/listas"
          className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                list.is_shared
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {list.is_shared ? 'Familiar' : 'Personal'}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 truncate mt-0.5">{list.name}</h2>
        </div>
      </div>

      {/* Progress & Total card */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3">
        {totalCount > 0 && (
          <div className="space-y-1.5">
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

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Estimado total:</span>
          <span className="text-base font-extrabold font-mono text-gray-900">
            {formatCurrency(estimatedTotal)}
          </span>
        </div>
      </div>

      {/* Store Groups */}
      {storeGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Esta lista está vacía</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Agrega productos para comenzar a comprar.
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
      <WhatsAppButton listName={list.name} />

      {/* WhatsApp Send Modal for specific store or custom selection */}
      <WhatsAppSendModal
        isOpen={Boolean(storeToSendWhatsApp)}
        onClose={() => setStoreToSendWhatsApp(null)}
        listName={list.name}
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
