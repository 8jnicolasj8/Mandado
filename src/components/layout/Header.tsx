'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { ShoppingBag, Users } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { family, currentProfile } = useApp();

  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/Mandado.png" alt="Mandado logo" className="h-8 w-8 rounded-xl object-cover" />
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight flex items-center gap-1.5">
              Mandado
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Familiar
              </span>
            </h1>
            <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-gray-400" />
              {family.name}
            </p>
          </div>
        </Link>

        <Link
          href="/perfil"
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          title={`Perfil de ${currentProfile.display_name}`}
        >
          <span className="text-xs font-medium text-gray-700 max-w-[80px] truncate">
            {currentProfile.display_name}
          </span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs ring-2 ring-white"
            style={{ backgroundColor: currentProfile.avatar_color || '#16A34A' }}
          >
            {currentProfile.display_name.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
};
