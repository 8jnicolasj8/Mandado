'use client';

import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { getPriceStatus, formatCurrency } from '@/lib/utils/prices';

interface PriceBadgeProps {
  price?: number | null;
  recordedAt?: string | null;
  size?: 'sm' | 'md';
  showPrice?: boolean;
  onClick?: () => void;
}

export const PriceBadge: React.FC<PriceBadgeProps> = ({
  price,
  recordedAt,
  size = 'md',
  showPrice = true,
  onClick,
}) => {
  if (price === undefined || price === null) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-gray-400 bg-gray-100 rounded-md font-mono ${
          size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
        } ${onClick ? 'cursor-pointer hover:bg-gray-200' : ''}`}
      >
        Sin precio
      </span>
    );
  }

  const status = getPriceStatus(recordedAt);
  const isOutdated = status?.isOutdated ?? false;

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-end ${
        onClick ? 'cursor-pointer group' : ''
      }`}
    >
      {showPrice && (
        <div className="flex items-center gap-1">
          <span
            className={`font-semibold font-mono tracking-tight ${
              isOutdated ? 'text-amber-700' : 'text-gray-900'
            } ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
          >
            {formatCurrency(price)}
          </span>
        </div>
      )}

      {status && (
        <div className="flex items-center gap-1 mt-0.5">
          {isOutdated ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300">
              <AlertCircle className="w-2.5 h-2.5 shrink-0" />
              Desactualizado ({status.daysAgo}d)
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
              <Clock className="w-2.5 h-2.5" />
              {status.relativeTime}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
