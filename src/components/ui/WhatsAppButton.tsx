'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Share2,
  X,
  Send,
  MessageSquare,
  ChevronRight,
  Store as StoreIcon,
  CheckSquare,
  Square,
  Sparkles,
  Copy,
  Check,
  Phone,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import {
  generateWhatsAppShoppingListText,
  getCategoryEmoji,
} from '@/lib/utils/whatsapp';

interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  listName?: string;
  initialSelectedStoreId?: string | null;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  listName,
  initialSelectedStoreId,
}) => {
  const { listItems, currentList, familyMembers, currentProfile, stores } = useApp();
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customPhone, setCustomPhone] = useState('');
  const [recentPhones, setRecentPhones] = useState<string[]>([]);

  // Load recent phone numbers from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mandado_recent_phones');
        if (saved) {
          setRecentPhones(JSON.parse(saved));
        }
      } catch (_) {}
    }
  }, []);

  // Items to use: active uncompleted items, or if all completed, use all items in list
  const itemsToUse = useMemo(() => {
    const active = listItems.filter((item) => !item.checked);
    return active.length > 0 ? active : listItems;
  }, [listItems]);

  // Unique stores present in list items
  const storesInList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; category: string; count: number }>();

    itemsToUse.forEach((item) => {
      const storeId = item.store?.id || 'sin-tienda';
      const storeName = item.store?.name || 'Otras tiendas';
      const category = item.store?.category || 'otro';

      if (!map.has(storeId)) {
        map.set(storeId, { id: storeId, name: storeName, category, count: 0 });
      }
      map.get(storeId)!.count += 1;
    });

    return Array.from(map.values());
  }, [itemsToUse]);

  // Selected store IDs for export (multi-select)
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedStoreId) {
        setSelectedStoreIds([initialSelectedStoreId]);
      } else {
        setSelectedStoreIds(storesInList.map((s) => s.id));
      }
    }
  }, [isOpen, initialSelectedStoreId, storesInList]);

  // Effective stores: fallback to all stores if none explicitly checked
  const effectiveStoreIds = useMemo(() => {
    if (selectedStoreIds.length > 0) return selectedStoreIds;
    return storesInList.map((s) => s.id);
  }, [selectedStoreIds, storesInList]);

  // Compute effective list name
  const effectiveListName = (() => {
    if (effectiveStoreIds.length === 1 && storesInList.length > 1) {
      const singleStore = storesInList.find((s) => s.id === effectiveStoreIds[0]);
      if (singleStore) {
        return `Lista: ${singleStore.name}`;
      }
    }
    return listName || currentList?.name || 'Mandado';
  })();

  if (!isOpen) {
    return null;
  }

  if (itemsToUse.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-200 relative animate-in slide-in-from-bottom-4 duration-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mx-auto shadow-xs">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Tu lista está vacía</h3>
            <p className="text-xs text-gray-500 mt-1">
              Agrega productos a tu lista familiar para poder armar y enviar el pedido por WhatsApp con comercios y precios.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const handleSelectAllStores = () => {
    setSelectedStoreIds(storesInList.map((s) => s.id));
  };

  const handleClearStores = () => {
    setSelectedStoreIds([]);
  };

  // Generate customized text for chosen stores
  const generatedText = generateWhatsAppShoppingListText({
    listName: effectiveListName,
    items: itemsToUse,
    includeChecked: true,
    selectedStoreIds: effectiveStoreIds,
  });

  const selectedItemCount = itemsToUse.filter((item) =>
    effectiveStoreIds.includes(item.store?.id || 'sin-tienda')
  ).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const shareOrCopyText = async (text: string, title?: string): Promise<'shared' | 'copied' | 'failed'> => {
    // 1. Si navigator.share está disponible (mobile/PWA), usar la hoja nativa de compartir
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text });
        return 'shared';
      } catch (err: unknown) {
        // Si el usuario cancela el diálogo, no hacer nada
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return 'failed';
        // Fallback en caso de otro fallo: copiar al portapapeles
      }
    }

    // 2. Fallback: copiar al portapapeles con aviso
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Lista copiada. Pegala en WhatsApp 📋');
        return 'copied';
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    }

    return 'failed';
  };

  const handleSendToPhone = async (phone?: string | null) => {
    if (!phone || !phone.trim()) return;

    // Save to recent
    const clean = phone.trim();
    setRecentPhones((prev) => {
      const next = [clean, ...prev.filter((p) => p !== clean)].slice(0, 4);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mandado_recent_phones', JSON.stringify(next));
      }
      return next;
    });

    const result = await shareOrCopyText(generatedText, effectiveListName);
    if (result === 'shared') onClose();
  };

  const handleSendGeneral = async () => {
    const result = await shareOrCopyText(generatedText, effectiveListName);
    if (result === 'shared') onClose();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-200 relative animate-in slide-in-from-bottom-4 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pasar el Mandado</h3>
              <p className="text-[11px] text-gray-500">
                {selectedItemCount} items seleccionados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 space-y-3.5 overflow-y-auto pr-1">
          {/* Section 1: Filter by Store (Parts of Mandado) */}
          <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
                1. ¿Qué comercios le tocan?
              </span>

              <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={handleSelectAllStores}
                  className="text-emerald-700 hover:underline"
                >
                  Todos
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleClearStores}
                  className="text-gray-500 hover:underline"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {storesInList.map((store) => {
                const isSelected = selectedStoreIds.includes(store.id);
                const emoji = getCategoryEmoji(store.category);

                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'bg-white border-emerald-500 shadow-2xs font-semibold text-gray-900'
                        : 'bg-white/50 border-gray-200/80 text-gray-500 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{emoji}</span>
                      <span className="truncate">{store.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-600">
                        {store.count} {store.count === 1 ? 'item' : 'items'}
                      </span>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Choose Recipient */}
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2">
              2. ¿A quién se lo pasas por WhatsApp?
            </p>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {familyMembers.map((member) => {
                const isMe = member.id === currentProfile.id;
                const hasPhone = Boolean(member.phone);

                return (
                  <button
                    key={member.id}
                    onClick={() => handleSendToPhone(member.phone)}
                    disabled={!hasPhone}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      hasPhone
                        ? 'bg-gray-50/80 hover:bg-emerald-50/70 border-gray-200/90 hover:border-emerald-300 active:scale-[0.99]'
                        : 'bg-gray-50/40 border-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                        style={{ backgroundColor: member.avatar_color || '#16A34A' }}
                      >
                        {member.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {member.display_name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              (Tú)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono block truncate">
                          {member.phone || 'Sin celular registrado'}
                        </span>
                      </div>
                    </div>

                    {hasPhone && (
                      <div className="flex items-center gap-1 text-[#25D366] font-bold text-xs shrink-0 pl-2">
                        <span>Enviar</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Direct Phone Number Input */}
            <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Mandar directo a un celular / WhatsApp:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="tel"
                  placeholder="Ej: 2355 442142"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendToPhone(customPhone);
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSendToPhone(customPhone)}
                  disabled={!customPhone.trim()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-xs transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </div>

              {recentPhones.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-emerald-800/80 font-medium">Recientes:</span>
                  {recentPhones.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSendToPhone(p)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100/70 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* General WhatsApp Share Option & Copy Button */}
            <div className="pt-2.5 flex flex-col gap-2">
              <button
                onClick={handleSendGeneral}
                className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Elegir otro chat o grupo de WhatsApp
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-[0.98] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">¡Texto copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copiar texto de la lista</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Toggle */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] text-gray-500 hover:text-emerald-700 underline font-medium"
            >
              {showPreview ? 'Ocultar vista previa' : 'Ver mensaje que se enviará'}
            </button>

            {showPreview && (
              <pre className="mt-2 text-left bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                {generatedText}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Toast / Snackbar */}
      {toastMessage && (
        <div className="fixed bottom-36 right-4 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="bg-gray-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xs border border-white/10">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const WhatsAppButton: React.FC<{ listName?: string }> = ({ listName }) => {
  const { listItems, currentList } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeItems = listItems.filter((item) => !item.checked);
  const itemsToExport = activeItems.length > 0 ? activeItems : listItems;

  const handleClick = async () => {
    const effectiveName = listName || currentList?.name || 'Mandado';
    const listaTexto = generateWhatsAppShoppingListText({
      listName: effectiveName,
      items: itemsToExport,
      includeChecked: false,
    });

    // 2a. Si navigator.share está disponible (mobile/PWA):
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: listaTexto });
      } catch (err: any) {
        // 4. Manejar el caso en que navigator.share esté disponible pero el usuario cancele el share dialog (catch AbortError)
        if (err?.name === 'AbortError') {
          return;
        }
        // Fallback en caso de otro fallo
        try {
          await navigator.clipboard.writeText(listaTexto);
          setToastMessage('Lista copiada. Pegala en WhatsApp 📋');
          setTimeout(() => setToastMessage(null), 3000);
        } catch (_) {}
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      // 2b. Si navigator.share NO está disponible (desktop):
      try {
        await navigator.clipboard.writeText(listaTexto);
        setToastMessage('Lista copiada. Pegala en WhatsApp 📋');
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-white/50"
        title="Enviar mandado por WhatsApp"
        aria-label="Compartir en WhatsApp"
      >
        <div className="relative">
          <Share2 className="w-5 h-5 stroke-[2.5]" />
          {activeItems.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          )}
        </div>
        <span className="font-bold text-xs tracking-wide">WhatsApp</span>
        {activeItems.length > 0 && (
          <span className="bg-white/20 text-white font-mono text-[11px] px-1.5 py-0.5 rounded-full font-bold">
            {activeItems.length}
          </span>
        )}
      </button>

      {/* Toast / Snackbar */}
      {toastMessage && (
        <div className="fixed bottom-36 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="bg-gray-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xs border border-white/10">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};
