'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Users,
  Copy,
  Check,
  Share2,
  RefreshCw,
  LogOut,
  Sparkles,
  Phone,
  Edit2,
  Save,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { createWhatsAppUrl } from '@/lib/utils/whatsapp';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function PerfilPage() {
  const {
    currentProfile,
    family,
    familyMembers,
    isDemoMode,
    updateProfilePhone,
  } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(currentProfile.phone || '');
  const [phoneSaved, setPhoneSaved] = useState(false);

  // Invite code is based on family.id (first 8 chars uppercase) or fixed code
  const familyInviteCode = family?.id
    ? `MANDADO-${family.id.slice(0, 8).toUpperCase()}`
    : 'MANDADO-PINTO';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(familyInviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `¡Hola! 👋 Te invito a unirte a nuestra lista de compras familiar en Mandado 🛒.\n\nCódigo de nuestra familia:\n👉 *${familyInviteCode}*\n\nIngresa este código al registrarte en la app.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfilePhone(phoneInput.trim());
    setIsEditingPhone(false);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2000);
  };

  const handleOpenMemberWhatsApp = (phone?: string | null, name?: string) => {
    if (!phone) return;
    const greeting = `¡Hola ${name || ''}! 👋 ¿Cómo va el mandado?`;
    const url = createWhatsAppUrl(greeting, phone);
    window.open(url, '_blank');
  };

  const handleResetCatalog = () => {
    if (confirm('¿Restablecer comercios de General Pinto a valores originales?')) {
      localStorage.removeItem('mandado_stores');
      localStorage.removeItem('mandado_products');
      localStorage.removeItem('mandado_price_history');
      localStorage.removeItem('mandado_lists');
      localStorage.removeItem('mandado_raw_items');
      localStorage.removeItem('mandado_profile');
      localStorage.removeItem('mandado_family_members');
      localStorage.removeItem('mandado_version');
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          Mi Perfil y Familia
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Gestiona tu cuenta y la sincronización con tu familia
        </p>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xs shrink-0"
            style={{ backgroundColor: currentProfile.avatar_color || '#16A34A' }}
          >
            {(currentProfile.display_name || 'U').charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold text-gray-900 truncate">
              {currentProfile.display_name || 'Mi Perfil'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-500">Miembro de:</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md truncate">
                {family?.name || 'Familia'}
              </span>
            </div>
          </div>
        </div>

        {/* User Phone Box */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Mi Celular / WhatsApp
            </span>

            {!isEditingPhone && (
              <button
                type="button"
                onClick={() => {
                  setPhoneInput(currentProfile.phone || '');
                  setIsEditingPhone(true);
                }}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                {currentProfile.phone ? 'Modificar' : 'Agregar'}
              </button>
            )}
          </div>

          {isEditingPhone ? (
            <form onSubmit={handleSavePhone} className="flex items-center gap-2 mt-2">
              <input
                type="tel"
                placeholder="Ej: +54 9 2355 512260"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsEditingPhone(false)}
                className="px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-xl">
              <span className="font-mono text-gray-800">
                {currentProfile.phone || 'Sin número registrado'}
              </span>
              {phoneSaved && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Guardado
                </span>
              )}
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-1">
            Permite que otros miembros de la familia te envíen la lista de compras directamente a tu WhatsApp.
          </p>
        </div>


      </div>

      {/* Family Invitation Code Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4 text-emerald-200" />
            Código de Invitación Familiar
          </div>

          <p className="text-xs text-emerald-50 mt-1">
            Comparte este código con los miembros de tu familia para que vean la misma lista y precios.
          </p>

          <div className="mt-4 bg-black/20 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/10">
            <span className="font-mono text-base font-black tracking-wider text-white">
              {familyInviteCode}
            </span>

            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="w-full mt-3 py-2.5 bg-emerald-500/80 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-400/40 transition-all shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartir código por WhatsApp
          </button>
        </div>
      </div>

      {/* Family Members List with WhatsApp Direct Contact */}
      {/* Family Members List with WhatsApp Direct Contact */}
      {(() => {
        const activeMembers =
          familyMembers.length > 0
            ? familyMembers
            : currentProfile.display_name
            ? [currentProfile]
            : [];

        return (
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Miembros de la familia
              </h2>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {activeMembers.length} activos
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {activeMembers.map((member) => {
                const isMe = member.id === currentProfile.id;
                const hasPhone = Boolean(member.phone);

                return (
                  <div key={member.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: member.avatar_color || '#16A34A' }}
                      >
                        {(member.display_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {member.display_name || 'Miembro'}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-sm shrink-0">
                              Tú
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono block truncate">
                          {member.phone || 'Sin celular'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasPhone && (
                        <button
                          onClick={() => handleOpenMemberWhatsApp(member.phone, member.display_name)}
                          title={`Abrir WhatsApp con ${member.display_name}`}
                          className="p-1.5 text-[#25D366] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Device & Settings */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Opciones y Datos
        </h2>

        <div className="space-y-2 text-xs">
          <button
            onClick={handleResetCatalog}
            className="w-full p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-gray-500" />
              <span>Restablecer comercios locales</span>
            </div>
            {resetSuccess && (
              <span className="text-[10px] text-emerald-600 font-bold">¡Restablecido!</span>
            )}
          </button>

          <button
            type="button"
            onClick={async () => {
              if (isSupabaseConfigured()) {
                try {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                } catch (e) {
                  console.error(e);
                }
              }
              localStorage.removeItem('mandado_profile');
              window.location.href = '/login';
            }}
            className="w-full p-3 rounded-2xl bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 font-semibold flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-gray-500 hover:text-red-600" />
              <span>Cerrar sesión / Iniciar con otra cuenta</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>
      </div>
    </div>
  );
}
