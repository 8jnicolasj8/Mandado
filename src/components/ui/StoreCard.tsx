'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight, Tag } from 'lucide-react';
import { Store } from '@/lib/types/database';
import { getCategoryEmoji } from '@/lib/utils/whatsapp';

interface StoreCardProps {
  store: Store;
  productCount?: number;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, productCount }) => {
  const emoji = getCategoryEmoji(store.category);

  return (
    <Link
      href={`/tiendas/${store.id}`}
      className="group block p-4 bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0 group-hover:bg-emerald-50 transition-colors">
            {emoji}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                {store.name}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <span className="capitalize font-medium text-gray-600">{store.category}</span>
              {store.address && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 truncate max-w-[170px]">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    {store.address}
                  </span>
                </>
              )}
            </div>

            {productCount !== undefined && (
              <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                <Tag className="w-3 h-3" />
                {productCount} {productCount === 1 ? 'precio registrado' : 'precios registrados'}
              </div>
            )}
          </div>
        </div>

        <div className="text-gray-400 group-hover:text-emerald-600 transition-colors p-1">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
};
