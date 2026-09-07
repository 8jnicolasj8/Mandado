'use client';

import React from 'react';
import { Sparkles, ArrowRight, Check, X } from 'lucide-react';
import { Store } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/prices';

interface StoreSavingsModalProps {
  isOpen: boolean;
  productName: string;
  chosenStore: Store | null;
  chosenPrice: number | null;
  canonicalStore: Store | null;
  canonicalPrice: number | null;
  onSwitchToCanonical: () => void;
  onKeepOverride: () => void;
  onClose: () => void;
}

export const StoreSavingsModal: React.FC<StoreSavingsModalProps> = ({
  isOpen,
  productName,
  chosenStore,
  chosenPrice,
  canonicalStore,
  canonicalPrice,
  onSwitchToCanonical,
  onKeepOverride,
  onClose,
}) => {
  if (!isOpen || !canonicalStore) return null;

  const savings = chosenPrice && canonicalPrice ? Math.max(0, chosenPrice - canonicalPrice) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-amber-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-3 mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="text-center mb-4">
          <h3 className="text-base font-bold text-gray-900">
            ¿Sabías que este producto está más barato?
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Encontramos un mejor precio registrado para{' '}
            <span className="font-semibold text-gray-800">{productName}</span>.
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Tienda elegida:</span>
            <span className="font-medium text-gray-800">
              {chosenStore?.name || 'Tienda manual'} {chosenPrice ? `(${formatCurrency(chosenPrice)})` : ''}
            </span>
          </div>

          <div className="flex items-center justify-center py-1 text-amber-600">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          <div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-amber-300 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-emerald-800">{canonicalStore.name}</span>
            </div>
            <span className="font-bold text-emerald-700 text-sm font-mono">
              {formatCurrency(canonicalPrice)}
            </span>
          </div>

          {savings && savings > 0 && (
            <div className="text-center text-[11px] font-semibold text-emerald-700 pt-1">
              🎉 ¡Ahorrás {formatCurrency(savings)} por unidad!
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={onSwitchToCanonical}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            Cambiar a {canonicalStore.name}
          </button>

          <button
            onClick={onKeepOverride}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-xs transition-colors"
          >
            Mantener en {chosenStore?.name || 'esta tienda'}
          </button>
        </div>
      </div>
    </div>
  );
};
