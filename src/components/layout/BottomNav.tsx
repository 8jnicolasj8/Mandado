'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, List, Store, Apple, User } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { listItems } = useApp();

  // Don't show bottom nav on auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  const uncheckedCount = listItems.filter((item) => !item.checked).length;

  const navItems = [
    {
      label: 'Mandado',
      href: '/',
      icon: ShoppingCart,
      badge: uncheckedCount > 0 ? uncheckedCount : null,
      isActive: pathname === '/',
    },
    {
      label: 'Listas',
      href: '/listas',
      icon: List,
      isActive: pathname.startsWith('/listas'),
    },
    {
      label: 'Tiendas',
      href: '/tiendas',
      icon: Store,
      isActive: pathname.startsWith('/tiendas'),
    },
    {
      label: 'Productos',
      href: '/productos',
      icon: Apple,
      isActive: pathname.startsWith('/productos'),
    },
    {
      label: 'Perfil',
      href: '/perfil',
      icon: User,
      isActive: pathname.startsWith('/perfil'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-bottom shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all relative ${
                active
                  ? 'text-emerald-700 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
