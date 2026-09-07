'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        router.push('/');
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al iniciar sesión');
        setLoading(false);
      }
    } else {
      // In demo / local fallback mode
      setTimeout(() => {
        router.push('/');
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
          <p className="text-xs text-gray-400 mt-0.5">Ingresa a la cuenta de tu familia</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

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
