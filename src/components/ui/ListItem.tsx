'use client';

import React, { useState } from 'react';
import { Check, Trash2, ShieldAlert, Sparkles, Plus, Minus, Check as CheckIcon } from 'lucide-react';
import { ListItemEnriched } from '@/lib/types/database';
import { PriceBadge } from './PriceBadge';
import { getCategoryEmoji, formatQuantityDisplay } from '@/lib/utils/whatsapp';
import { useApp } from '@/lib/context/AppContext';

interface ListItemProps {
  item: ListItemEnriched;
  onRecordPriceClick?: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({ item, onRecordPriceClick }) => {
  const { toggleCheckItem, updateItemQuantity, removeItem } = useApp();
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [customQty, setCustomQty] = useState(String(item.quantity));

  const isChecked = item.checked;
  const store = item.store;
  const isOverride = item.is_store_override;
  const isCanonical = item.canonical_store && item.store && item.canonical_store.id === item.store.id;

  const isWeightUnit = item.unit === 'kg' || item.unit === 'kilos' || item.unit === 'kilo' || item.unit === 'litro' || item.unit === 'l';
  const step = isWeightUnit ? 0.5 : 1;

  const handleDecrease = () => {
    const minVal = isWeightUnit ? 0.25 : 1;
    const newQty = Math.max(minVal, Number((item.quantity - step).toFixed(2)));
    updateItemQuantity(item.id, newQty);
  };

  const handleIncrease = () => {
    const newQty = Number((item.quantity + step).toFixed(2));
    updateItemQuantity(item.id, newQty);
  };

  const handleSaveCustomQty = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customQty.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      updateItemQuantity(item.id, parsed);
    }
    setIsEditingQty(false);
  };

  return (
    <div
      className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
        isChecked
          ? 'bg-gray-100/70 border-gray-200 opacity-60'
          : 'bg-white border-gray-200/90 shadow-xs hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => toggleCheckItem(item.id)}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
            isChecked
              ? 'bg-emerald-600 text-white'
              : 'border-2 border-gray-300 hover:border-emerald-500 bg-white'
          }`}
          aria-label={isChecked ? 'Desmarcar' : 'Marcar'}
        >
          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h4
              className={`text-sm font-semibold break-words leading-snug ${
                isChecked ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {item.product.name}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
            {/* Store Badge */}
            {store ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                <span>{getCategoryEmoji(store.category)}</span>
                <span className="truncate max-w-[120px]">{store.name}</span>
                {isCanonical && (
                  <span title="Mejor precio histórico registrado" className="text-amber-500">
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                )}
                {isOverride && (
                  <span
                    title="Tienda elegida manualmente a pesar de haber otra más barata"
                    className="text-amber-600 bg-amber-50 rounded px-1 text-[9px] font-bold"
                  >
                    Manual
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px]">
                Sin tienda fija
              </span>
            )}

            {/* If store has override warning */}
            {item.canonical_store && item.store && item.canonical_store.id !== item.store.id && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
                Más barato en {item.canonical_store.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Quantity & Price */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quantity control */}
        {isEditingQty ? (
          <form onSubmit={handleSaveCustomQty} className="flex items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
              className="w-14 text-center px-1 py-0.5 text-xs font-bold bg-white border border-emerald-500 rounded-lg focus:outline-hidden"
            />
            <button
              type="submit"
              className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <CheckIcon className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
            <button
              type="button"
              onClick={handleDecrease}
              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-900 active:scale-95"
              title="Disminuir"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomQty(String(item.quantity));
                setIsEditingQty(true);
              }}
              className="text-xs font-semibold px-1 min-w-[24px] text-center text-gray-800 hover:text-emerald-700 hover:underline"
              title="Tocar para editar cantidad escribiendo"
            >
              {item.quantity}
            </button>
            <button
              type="button"
              onClick={handleIncrease}
              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-900 active:scale-95"
              title="Aumentar"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {item.unit && item.unit !== 'unidad' && (
          <span className="text-[11px] font-medium text-gray-500 -ml-1">
            {item.unit === 'kg' ? (item.quantity === 0.5 ? '½ kg' : 'kg') : item.unit}
          </span>
        )}

        {/* Price badge */}
        <PriceBadge
          price={item.latest_price ? item.latest_price * item.quantity : null}
          recordedAt={item.price_recorded_at}
          onClick={onRecordPriceClick}
        />

        {/* Delete button */}
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="text-gray-300 hover:text-red-500 p-1 rounded-md transition-colors"
          title="Eliminar de la lista"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
