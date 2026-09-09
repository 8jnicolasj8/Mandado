'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  User,
  Lock,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Phone,
  Users,
} from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { generateFamilyInviteCode } from '@/lib/utils/family';
import { getInternalAuthEmail } from '@/lib/utils/auth';

export default function RegisterPage() {
  const [familyCode, setFamilyCode] = useState('');
  const [familySurname, setFamilySurname] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateCode = () => {
    const cleanSurname = familySurname.trim();

    if (!cleanSurname) {
      setErrorMsg('Ingresa primero el apellido de tu familia para generar el código');
      return;
    }

    const newCode = generateFamilyInviteCode(cleanSurname);
    setFamilyCode(newCode);
    setErrorMsg(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanFam = familyCode.trim().toUpperCase();
    const cleanUser = username.trim();
    const cleanPhone = phone.trim();

    if (!cleanFam || !cleanUser || !cleanPhone || !password) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    if (cleanUser.length < 2) {
      setErrorMsg('El nombre de usuario debe tener al menos 2 caracteres');
      return;
    }

    if (cleanFam.length < 3) {
      setErrorMsg('El código de familia debe tener al menos 3 caracteres');
      return;
    }

    if (cleanPhone.replace(/\D/g, '').length < 6) {
      setErrorMsg('Ingresa un número de celular / WhatsApp válido');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const cleanFamilyName = familySurname.trim()
      ? `Familia ${familySurname.trim()}`
      : undefined;

    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        // 1. Call server API to create user with pre-confirmed email (no confirmation email needed)
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUser,
            familyCode: cleanFam,
            password,
            phone: cleanPhone,
            familyName: cleanFamilyName,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          setErrorMsg(result.error || 'Error al crear la cuenta');
          setLoading(false);
          return;
        }

        // 2. Sign in with the client SDK to establish the browser session
        const internalEmail = getInternalAuthEmail(cleanUser, cleanFam);
        const supabase = createClient();
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

        if (signInErr) {
          setErrorMsg('Cuenta creada. Inicia sesión con tus credenciales.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1200);
          return;
        }

        const profile = {
          id: data.user?.id || `user-${Date.now()}`,
          family_id: 'fam-default-001',
          display_name: cleanUser,
          avatar_color: '#16A34A',
          phone: cleanPhone,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('mandado_profile', JSON.stringify(profile));
        localStorage.setItem('mandado_family_invite_code', cleanFam);
        if (cleanFamilyName) {
          localStorage.setItem('mandado_family_name', cleanFamilyName);
        }

        window.location.href = '/';
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al registrarse');
        setLoading(false);
      }
    } else {
      // Offline / Demo fallback
      try {
        const newProfile = {
          id: `user-${Date.now()}`,
          family_id: 'fam-default-001',
          display_name: cleanUser,
          avatar_color: '#16A34A',
          phone: cleanPhone,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('mandado_profile', JSON.stringify(newProfile));
        localStorage.setItem('mandado_family_invite_code', cleanFam);
        if (cleanFamilyName) {
          localStorage.setItem('mandado_family_name', cleanFamilyName);
        }
      } catch (e) {
        console.error('Error saving local profile', e);
      }

      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col justify-center max-w-sm mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 mb-2.5">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Crear cuenta</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Organiza las compras de tu hogar con tu familia
        </p>
      </div>

      {/* Register Form */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Registro</h2>
          <p className="text-xs text-gray-400 mt-0.5">Crea tu usuario o únete a tu familia</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Código de Familia */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Código de la Familia <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                title="Generar un código aleatorio para una familia nueva"
              >
                <Sparkles className="w-3 h-3" />
                Generar nuevo
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ej: MANDADO-GONZALEZ-K8Y4B2"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl uppercase font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Ingresa el código que te dio tu familia, o genera uno si creas una nueva.
            </p>
          </div>

          {/* Apellido de la Familia (para generar un código nuevo) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Apellido de la familia
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ej: González"
                value={familySurname}
                onChange={(e) => setFamilySurname(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Solo es necesario si vas a generar un código nuevo para tu familia.
            </p>
          </div>

          {/* Nombre de Usuario */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nombre de usuario <span className="text-red-500">*</span>
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

          {/* Celular / WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Celular / WhatsApp <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                placeholder="Ej: 2355 512260 o +54 9..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Así tu familia puede enviarte el mandado directamente a tu WhatsApp.
            </p>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Terms & Privacy links */}
      <p className="text-[10px] text-gray-400 text-center leading-relaxed mt-3">
        Al crear tu cuenta aceptás los{' '}
        <Link href="/legal/terminos" className="font-semibold text-emerald-600 hover:underline">
          Términos y Condiciones
        </Link>{' '}
        y la{' '}
        <Link href="/legal/privacidad" className="font-semibold text-emerald-600 hover:underline">
          Política de Privacidad
        </Link>
        .
      </p>

      {/* Link to Login */}
      <p className="text-center text-xs text-gray-500 mt-5">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

