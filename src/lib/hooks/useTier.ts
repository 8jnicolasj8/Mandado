'use client';

import { useApp } from '@/lib/context/AppContext';

export type PlanTierLike = 'free' | 'mandado' | 'plus';

const ADMIN_FAMILY_ID = process.env.NEXT_PUBLIC_ADMIN_FAMILY_ID?.trim();

export function useTier() {
  const { family } = useApp();

  const rawTier: PlanTierLike = family.tier || 'free';
  const isAdminFamily = Boolean(ADMIN_FAMILY_ID && family.id === ADMIN_FAMILY_ID);
  const tier: PlanTierLike = isAdminFamily ? 'plus' : rawTier;

  return {
    tier,
    isFree: tier === 'free',
    isMandado: tier === 'mandado',
    isPlus: tier === 'plus',
    hasPriceImport: Boolean(family.has_price_import),
  };
}