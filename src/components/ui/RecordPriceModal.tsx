'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Store as StoreIcon, Tag } from 'lucide-react';
import { Product, Store } from '@/lib/types/database';
import { useApp } from '@/lib/context/AppContext';

interface RecordPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProduct?: Product | null;
  defaultStore?: Store | null;
  defaultProductId?: string | null;
  defaultStoreId?: string | null;
}

export const RecordPriceModal: React.FC<RecordPriceModalProps> = ({
  isOpen,
  onClose,
  defaultProduct,
  defaultStore,
  defaultProductId,
  defaultStoreId,
}) => {
  const { products, stores, recordPrice, getLatestPriceForStore } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');

  useEffect(() => {
    if (defaultProduct) {
      setSelectedProductId(defaultProduct.id);
    } else if (defaultProductId) {
      setSelectedProductId(defaultProductId);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }

    if (defaultStore) {
      setSelectedStoreId(defaultStore.id);
    } else if (defaultStoreId) {
      setSelectedStoreId(defaultStoreId);
    } else if (stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [defaultProduct, defaultStore, defaultProductId, defaultStoreId, products, stores, isOpen]);

  // When product or store changes, fill in latest known price as helper
  useEffect(() => {
    if (selectedProductId && selectedStoreId) {
      const latest = getLatestPriceForStore(selectedProductId, selectedStoreId);
      if (latest) {
        setPriceInput(String(latest.price));
      } else {
        setPriceInput('');
      }
    }
  }, [selectedProductId, selectedStoreId, getLatestPriceForStore]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(priceInput.replace(',', '.'));
    if (!selectedProductId || !selectedStoreId || isNaN(priceNum) || priceNum <= 0) {
      return;
    }

    recordPrice(selectedProductId, selectedStoreId, priceNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Registrar Precio</h3>
            <p className="text-xs text-gray-500">Actualiza el precio histórico de un producto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              Producto
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <StoreIcon className="w-3.5 h-3.5 text-gray-400" />
              Tienda
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              required
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              Precio ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-mono text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
            >
              Guardar Precio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
