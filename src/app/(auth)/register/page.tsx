'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  User,
  Mail,
  Lock,
  Users,
  KeyRound,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Palette,
  Phone,
} from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const AVATAR_COLORS = [
  '#16A34A', // Emerald green
  '#2563EB', // Blue
  '#9333EA', // Purple
  '#DB2777', // Pink
  '#EA580C', // Orange
  '#0D9488', // Teal
];

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  // Family Mode: 'create' or 'join'
  const [familyMode, setFamilyMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (familyMode === 'create' && !familyName.trim()) {
      setErrorMsg('Por favor ingresa un nombre para tu familia');
      return;
    }
    if (familyMode === 'join' && !familyCode.trim()) {
      setErrorMsg('Por favor ingresa el código de tu familia');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Por favor ingresa tu número de celular / WhatsApp');
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              avatar_color: avatarColor,
              phone: phone.trim(),
              family_mode: familyMode,
              family_name: familyMode === 'create' ? familyName : null,
              family_code: familyMode === 'join' ? familyCode : null,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        router.push('/');
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al registrarse');
        setLoading(false);
      }
    } else {
      // Demo / Local storage mode
      try {
        const newProfile = {
          id: `user-${Date.now()}`,
          family_id: 'fam-demo-001',
          display_name: displayName,
          avatar_color: avatarColor,
          phone: phone.trim(),
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('mandado_profile', JSON.stringify(newProfile));
      } catch (e) {
        console.error('Error saving local profile', e);
      }

      setTimeout(() => {
        router.push('/');
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
          Comienza a organizar las compras de tu hogar
        </p>
      </div>

      {/* Register Form */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* User Display Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tu nombre o apodo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ej: Mamá, Lucas, Flor"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Celular / WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Celular / WhatsApp <span className="text-red-500">*</span></span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                placeholder="Ej: 2355 512260 o +54 9..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Así tu familia puede enviarte el mandado directamente a tu WhatsApp.
            </p>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-gray-400" />
              Color de tu perfil
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-xl transition-all ${
                    avatarColor === c ? 'ring-3 ring-emerald-500 ring-offset-2 scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password */}
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
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Family Mode Selector */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Grupo familiar
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setFamilyMode('create')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  familyMode === 'create'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Crear nueva familia
              </button>

              <button
                type="button"
                onClick={() => setFamilyMode('join')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  familyMode === 'join'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Tengo un código
              </button>
            </div>

            {familyMode === 'create' ? (
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Nombre del grupo familiar
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required={familyMode === 'create'}
                    placeholder="Ej: Familia González"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Código de invitación familiar
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required={familyMode === 'join'}
                    placeholder="Ej: MANDADO-DEMO"
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl uppercase font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Creando cuenta...' : 'Completar registro'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

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
