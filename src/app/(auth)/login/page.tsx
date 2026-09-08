'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, KeyRound, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getInternalAuthEmail } from '@/lib/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [familyCode, setFamilyCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!familyCode.trim() || !username.trim() || !password) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const internalEmail = getInternalAuthEmail(username, familyCode);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

        if (error) {
          setErrorMsg('Código de familia, usuario o contraseña incorrectos');
          setLoading(false);
          return;
        }

        if (data?.user) {
          const meta = data.user.user_metadata || {};
          const displayName = meta.display_name || username.trim();
          const famCode = meta.family_code || familyCode.trim().toUpperCase();
          const profile = {
            id: data.user.id,
            family_id: 'fam-default-001',
            display_name: displayName,
            avatar_color: meta.avatar_color || '#16A34A',
            phone: meta.phone || null,
            created_at: data.user.created_at || new Date().toISOString(),
          };
          localStorage.setItem('mandado_profile', JSON.stringify(profile));
          localStorage.setItem('mandado_family_invite_code', famCode);
          if (meta.family_name) {
            localStorage.setItem('mandado_family_name', meta.family_name);
          }
        }

        window.location.href = '/';
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al iniciar sesión');
        setLoading(false);
      }
    } else {
      // Local demo mode fallback
      const cleanFam = familyCode.trim().toUpperCase();
      const profile = {
        id: `user-${Date.now()}`,
        family_id: 'fam-default-001',
        display_name: username.trim(),
        avatar_color: '#16A34A',
        phone: null,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('mandado_profile', JSON.stringify(profile));
      localStorage.setItem('mandado_family_invite_code', cleanFam);
      setTimeout(() => {
        window.location.href = '/';
      }, 400);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col justify-center max-w-sm mx-auto">
      {/* Brand Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 mb-3">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mandado</h1>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          Tu lista de compras familiar inteligente con precios históricos y tiendas locales
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Iniciar sesión</h2>
          <p className="text-xs text-gray-400 mt-0.5">Ingresa con los datos de tu familia</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Código de Familia */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Código de la Familia
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ej: MANDADO-JAUR01"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl uppercase font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Nombre de Usuario */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nombre de usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ej: Nicolas"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Link to Register */}
      <p className="text-center text-xs text-gray-500 mt-6">
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Crear cuenta o unirme a una familia
        </Link>
      </p>
    </div>
  );
}

