'use client';

import React from 'react';
import Link from 'next/link';
import {
  Crown,
  Check,
  X,
  MessageCircle,
  Rocket,
} from 'lucide-react';
import { useTier } from '@/lib/hooks/useTier';
import { createWhatsAppUrl, createWhatsAppDeepLink } from '@/lib/utils/whatsapp';
import { formatPrice, formatPriceNumber } from '@/lib/utils/whatsapp';

const TIER_LABEL: Record<string, string> = {
  free: 'GRATIS',
  mandado: 'MANDADO',
  plus: 'PLUS',
};

const openWhatsApp = (message: string) => {
  const isMobile =
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = createWhatsAppDeepLink(message);
  } else {
    window.open(createWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  }
};

export default function PlanesPage() {
  const { tier, isPlus, hasPriceImport } = useTier();

  const plans = [
    {
      key: 'free' as const,
      name: 'FREE',
      price: 0,
      desc: 'Gratis para siempre',
      features: [
        'Lista de compras compartida en tiempo real',
        'Tiendas y precios locales de tu familia',
        'Catálogo de productos habituales',
        'Envío del mandado por WhatsApp',
      ],
      highlight: false,
      cta: 'Plan actual',
    },
    {
      key: 'mandado' as const,
      name: 'MANDADO',
      price: 2000,
      desc: '2.000 ARS / mes',
      features: [
        'Todo lo de FREE',
        'Escaneo de tickets con IA (BETA)',
        'Detección automática de productos',
        'Carga de precios con la cámara',
      ],
      highlight: false,
      cta: 'Suscribirse',
    },
    {
      key: 'plus' as const,
      name: 'PLUS',
      price: 3500,
      desc: '3.500 ARS / mes',
      features: [
        'Todo lo de MANDADO',
        'Datos cruzados entre familias de tu pueblo',
        'Precios de la comunidad para comparar',
        'Soporte prioritario por WhatsApp',
      ],
      highlight: true,
      cta: 'Suscribirse',
    },
  ];

  const whatsappMessages: Record<string, string> = {
    free: 'Hola! Quiero suscribirme al plan FREE de Mandado.',
    mandado: 'Hola! Quiero suscribirme al plan MANDADO de Mandado.',
    plus: 'Hola! Quiero suscribirme al plan PLUS de Mandado.',
  };

  const handleSubscribe = (key: string) => {
    openWhatsApp(whatsappMessages[key] || 'Hola! Quiero suscribirme a un plan de Mandado.');
  };

  const handleBuyImportAddon = () => {
    openWhatsApp('Hola! Quiero comprar el add-on de importación de precios para Mandado.');
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Planes y precios
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Elegí el plan que mejor se adapte a tu familia
          </p>
        </div>

        <span
          className={`px-2 py-1 text-[10px] font-black rounded-lg ${
            isPlus
              ? 'bg-emerald-600 text-white'
              : tier === 'mandado'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {TIER_LABEL[tier] || 'FREE'}
        </span>
      </div>

      {/* Plan Cards */}
      <div className="space-y-3">
        {plans.map((plan) => {
          const isCurrent = tier === plan.key;

          return (
            <div
              key={plan.key}
              className={`relative bg-white rounded-3xl p-5 border shadow-2xs space-y-3 ${
                plan.highlight ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-gray-200'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full shadow-xs">
                  RECOMENDADO
                </span>
              )}

              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-base font-black text-gray-900 tracking-tight">{plan.name}</h2>
                  <p className="text-[11px] text-gray-500">{plan.desc}</p>
                </div>

                {isCurrent && (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full">
                    Tu plan actual
                  </span>
                )}
              </div>

              {plan.key !== 'free' && (
                <div className="text-xs text-gray-400 font-semibold">
                  {formatPriceNumber(plan.price)} ARS
                  <span className="text-gray-300 font-normal"> / mes</span>
                </div>
              )}

              <ul className="space-y-1.5 pt-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={isCurrent}
                className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : plan.highlight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-xs active:scale-[0.98]'
                } flex items-center justify-center gap-1.5`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {isCurrent ? plan.cta : `${plan.cta} por WhatsApp`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add-on card */}
      <div className="bg-white rounded-3xl p-5 border border-dashed border-amber-300 bg-amber-50/40 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Rocket className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              Add-on Importación de precios
              {hasPriceImport && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  ACTIVO
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Pago único.{' '}
              <span className="font-bold text-amber-700">
                {formatPrice(2000)}
              </span>{' '}
              — importá de una vez los precios de la comunidad de tu pueblo y compará con tus comercios.
            </p>
          </div>
        </div>

        <button
          onClick={handleBuyImportAddon}
          disabled={hasPriceImport}
          className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
            hasPriceImport
              ? 'bg-emerald-50 text-emerald-700 cursor-default'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-[0.98]'
          } flex items-center justify-center gap-1.5`}
        >
          {hasPriceImport ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Add-on activo
            </>
          ) : (
            <>
              <MessageCircle className="w-3.5 h-3.5" />
              Comprar add-on por WhatsApp
            </>
          )}
        </button>
      </div>

      {/* Free features reminder */}
      <div className="text-xs text-gray-400 flex items-start gap-2 px-1">
        <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          Los planes se activan manualmente al confirmar el pago por WhatsApp. Los pagos se gestionan fuera de la app (ver pagos).
        </p>
      </div>

      {/* Legal links */}
      <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-semibold text-gray-500">
        <Link href="/legal/terminos" className="hover:text-emerald-700 hover:underline">
          Términos
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/legal/privacidad" className="hover:text-emerald-700 hover:underline">
          Privacidad
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/legal/pagos" className="hover:text-emerald-700 hover:underline">
          Pagos
        </Link>
      </div>
    </div>
  );
}