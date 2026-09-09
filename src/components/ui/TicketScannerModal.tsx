'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Coins,
  Sparkles,
  AlertTriangle,
  ScanLine,
  Check,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { PRODUCT_CATALOG, normalizeProductName } from '@/lib/data/productCatalog';
import {
  buildPlan,
  rematchAsInventory,
  MatcherContext,
  TicketMatch,
} from '@/lib/utils/ticketMatcher';
import { ParsedTicket } from '@/lib/utils/ticketParser';
import { formatCurrency } from '@/lib/utils/prices';

interface TicketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
}

type Step = 'pick' | 'parsing' | 'review' | 'done' | 'error';

export const TicketScannerModal: React.FC<TicketScannerModalProps> = ({
  isOpen,
  onClose,
  storeId,
  storeName,
}) => {
  const { listItems, products, toggleCheckItem, updateItemQuantity, recordPrice, addProduct, changeItemStore } = useApp();

  const [step, setStep] = useState<Step>('pick');
  const [ticket, setTicket] = useState<ParsedTicket | null>(null);
  const [matches, setMatches] = useState<TicketMatch[]>([]);
  const [modoBIds, setModoBIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastImage, setLastImage] = useState<{ image: string; mimeType: string } | null>(null);
  const [includedNews, setIncludedNews] = useState<Record<number, boolean>>({});
  const [excluded, setExcluded] = useState<Record<number, boolean>>({});

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const matcherCtx = useMemo<MatcherContext>(
    () => ({ listItems, products, storeId }),
    [listItems, products, storeId]
  );

  const runParse = useCallback(
    async (image: string, mimeType: string) => {
      setStep('parsing');
      setLastImage({ image, mimeType });
      setErrorMsg('');
      try {
        const res = await fetch('/api/ticket/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, mimeType }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data.error || 'No pudimos leer el ticket, intentá de nuevo');
          setStep('error');
          return;
        }
        const data = await res.json();
        const parsed = data.ticket as ParsedTicket;
        setTicket(parsed);

        const plan = buildPlan(parsed, matcherCtx);
        setExcluded({});
        setIncludedNews({});
        if (parsed.modo === 'A') {
          setMatches(plan.matches);
          setModoBIds([]);
        } else {
          setMatches([]);
          setModoBIds(plan.toCheckModoB.map((i) => i.id));
        }
        setStep('review');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'El servidor está ocupado, intentá de nuevo en un momento');
        setStep('error');
      }
    },
    [matcherCtx]
  );

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(',');
      const image = dataUrl.slice(comma + 1);
      const mimeType = dataUrl.slice(5, comma).split(';')[0] || 'image/jpeg';
      runParse(image, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const autoMatches = matches.map((m, i) => ({ i, m })).filter(({ m }) => m.kind === 'auto');
  const confirmMatches = matches.map((m, i) => ({ i, m })).filter(({ m }) => m.kind === 'confirm');
  const priceMatches = matches.map((m, i) => ({ i, m })).filter(({ m }) => m.kind === 'price');
  const newMatches = matches.map((m, i) => ({ i, m })).filter(({ m }) => m.kind === 'new');

  const toggleExclude = (index: number) => {
    setExcluded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const markConfirmSame = (index: number) => {
    setMatches((prev) => prev.map((m, i) => (i === index ? { ...m, kind: 'auto' } : m)));
  };

  const markConfirmDifferent = (index: number) => {
    const m = matches[index];
    if (!m) return;
    const re = rematchAsInventory(m.article, matcherCtx);
    setMatches((prev) => prev.map((item, i) => (i === index ? re : item)));
  };

  const ensureDbProduct = (name: string, candidateId?: string | null): string | null => {
    const key = normalizeProductName(name);
    const existing = products.find((p) => normalizeProductName(p.name) === key);
    if (existing) return existing.id;
    const created = addProduct({
      name,
      initialStoreId: storeId,
      id: candidateId || undefined,
    });
    return created.id;
  };

  const applyListMatch = (m: TicketMatch) => {
    if (m.listItemId && m.checkFull) {
      toggleCheckItem(m.listItemId);
    } else if (m.listItemId && !m.checkFull && m.remainingQty > 0) {
      updateItemQuantity(m.listItemId, m.remainingQty);
    }
    // Asegurar que el ítem quede asignado a la tienda del ticket
    if (m.listItemId) {
      const item = listItems.find((i) => i.id === m.listItemId);
      if (item && item.store?.id !== storeId) {
        changeItemStore(m.listItemId, storeId, true);
      }
    }
    if (m.candidateId && m.article.precio_unitario > 0) {
      recordPrice(m.candidateId, storeId, m.article.precio_unitario);
    }
  };

  const applyPriceMatch = (m: TicketMatch) => {
    const id = ensureDbProduct(m.candidateName, m.candidateId);
    if (id && m.article.precio_unitario > 0) {
      recordPrice(id, storeId, m.article.precio_unitario);
    }
  };

  const handleConfirm = () => {
    matches.forEach((m, i) => {
      if (excluded[i]) return;
      if (m.kind === 'auto') applyListMatch(m);
      else if (m.kind === 'price') applyPriceMatch(m);
      else if (m.kind === 'new' && includedNews[i]) {
        const id = ensureDbProduct(m.candidateName, null);
        if (id && m.article.precio_unitario > 0) {
          recordPrice(id, storeId, m.article.precio_unitario);
        }
      }
    });
    for (const id of modoBIds) {
      toggleCheckItem(id);
      const item = listItems.find((i) => i.id === id);
      if (item && item.store?.id !== storeId) {
        changeItemStore(id, storeId, true);
      }
    }
    setStep('done');
  };

  if (!isOpen) return null;

  const close = () => {
    setStep('pick');
    setTicket(null);
    setMatches([]);
    setModoBIds([]);
    setErrorMsg('');
    setLastImage(null);
    setIncludedNews({});
    setExcluded({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-gray-200 relative max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Escanear Ticket</h3>
              <p className="text-xs text-gray-500">{storeName}</p>
            </div>
          </div>
          <button
            onClick={close}
            disabled={step === 'parsing'}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1">
          {step === 'pick' && (
            <div className="pt-4 space-y-3">
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Sacá una foto del ticket de compra
                </p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Cargamos precios y tachamos automáticamente los productos que
                  compraste aquí, en {storeName}.
                </p>
              </div>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xs"
              >
                <Camera className="w-4 h-4" />
                Sacar foto
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <ImageIcon className="w-4 h-4" />
                Elegir de la galería
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          {step === 'parsing' && (
            <div className="pt-10 pb-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-gray-800">Leyendo el ticket...</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Gemini está analizando los productos. Si el servidor está ocupado,
                reintentamos automáticamente (hasta 5 veces).
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="pt-10 pb-6 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-gray-800">No pudimos leer el ticket</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMsg}</p>
              <button
                onClick={() => {
                  if (lastImage) runParse(lastImage.image, lastImage.mimeType);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {step === 'review' && ticket && (
            <div className="pt-3 space-y-4">
              {ticket.total > 0 && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Total del ticket</span>
                  <span className="font-extrabold text-gray-900 font-mono">{formatCurrency(ticket.total)}</span>
                </div>
              )}

              {ticket.modo === 'B' ? (
                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-indigo-800">
                      El ticket no tiene desglose por producto (solo rubros o total general).
                    </p>
                    <p className="text-xs text-indigo-700 mt-1.5">
                      Se van a marcar como comprados{' '}
                      <b>{modoBIds.length}</b>{' '}
                      {modoBIds.length === 1 ? 'producto asignado' : 'productos asignados'} a{' '}
                      {storeName}. No se actualiza ningún precio.
                    </p>
                  </div>
                  {modoBIds.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No hay productos de {storeName} en la lista activa para tachar. Podés
                      igual cerrar e ir a la lista.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {autoMatches.length > 0 && (
                    <div>
                      <SectionTitle icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} color="text-emerald-700" title="Se van a tachar" />
                      <div className="space-y-1.5 mt-2">
                        {autoMatches.map(({ i, m }) => {
                          const isExcluded = Boolean(excluded[i]);
                          return (
                            <div
                              key={`auto-${i}`}
                              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs transition-colors ${
                                isExcluded ? 'bg-gray-50 opacity-60' : 'bg-emerald-50/70'
                              }`}
                            >
                              <span className={`font-semibold text-gray-800 ${isExcluded ? 'line-through' : ''}`}>
                                {m.candidateName} <span className="text-gray-500">x{m.article.cantidad}</span>
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                {m.article.precio_unitario > 0 && (
                                  <span className="font-mono font-bold text-emerald-800">{formatCurrency(m.article.precio_unitario)}</span>
                                )}
                                <button
                                  onClick={() => toggleExclude(i)}
                                  className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-600 transition-colors"
                                  title={isExcluded ? 'Volver a incluir' : 'No agregar este producto'}
                                >
                                  {isExcluded ? (
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {confirmMatches.length > 0 && (
                    <div>
                      <SectionTitle icon={<HelpCircle className="w-4 h-4 text-amber-500" />} color="text-amber-700" title="Confirmar match" />
                      <div className="space-y-2 mt-2">
                        {confirmMatches.map(({ i, m }) => (
                          <div key={`confirm-${i}`} className="bg-amber-50/70 rounded-2xl px-3 py-3 text-xs space-y-2 border border-amber-100">
                            <p>
                              <span className="text-gray-500">En el ticket:</span>{' '}
                              <b className="text-gray-900">{m.article.nombre_normalizado || m.article.nombre_original}</b>
                              {m.article.cantidad > 1 && <span className="text-gray-500"> x{m.article.cantidad}</span>}
                            </p>
                            <p>
                              <span className="text-gray-500">En tu lista:</span>{' '}
                              <b className="text-gray-900">{m.candidateName}</b>
                              {m.listQty ? <span className="text-gray-500"> x{m.listQty}</span> : null}
                            </p>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => markConfirmSame(i)}
                                className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Sí, es el mismo
                              </button>
                              <button
                                onClick={() => markConfirmDifferent(i)}
                                className="flex-1 py-2 px-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-semibold"
                              >
                                No, son distintos
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {priceMatches.length > 0 && (
                    <div>
                      <SectionTitle icon={<Coins className="w-4 h-4 text-sky-600" />} color="text-sky-700" title="Precios a actualizar" />
                      <div className="space-y-1.5 mt-2">
                        {priceMatches.map(({ i, m }) => (
                          <div key={`price-${i}`} className="flex items-center justify-between bg-sky-50/70 rounded-xl px-3 py-2 text-xs">
                            <span className="font-semibold text-gray-800">{m.candidateName}</span>
                            <span className="font-mono font-bold text-sky-800">
                              {m.article.precio_unitario > 0 ? formatCurrency(m.article.precio_unitario) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {newMatches.length > 0 && (
                    <div>
                      <SectionTitle icon={<Sparkles className="w-4 h-4 text-violet-600" />} color="text-violet-700" title="Productos nuevos" />
                      <div className="space-y-2 mt-2">
                        {newMatches.map(({ i, m }) => (
                          <NewProductRow
                            key={`new-${i}`}
                            match={m}
                            index={i}
                            included={Boolean(includedNews[i])}
                            onToggle={(val) =>
                              setIncludedNews((prev) => ({ ...prev, [i]: val }))
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {matches.length === 0 && (
                    <p className="text-sm text-gray-600 text-center py-6">
                      No encontramos ningún producto del ticket que coincida con tu lista
                      o catálogo. Igual podés tachar manualmente desde tu lista.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="pt-10 pb-6 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-gray-900">Cambios aplicados</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Productos tachados y precios cargados para {storeName}.
              </p>
            </div>
          )}
        </div>

        {step === 'review' && (
          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100 shrink-0">
            <button
              onClick={close}
              className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
            >
              Confirmar cambios
            </button>
          </div>
        )}

        {step === 'done' && (
          <button
            onClick={close}
            className="mt-4 w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs shrink-0"
          >
            Listo
          </button>
        )}
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; color: string; title: string }> = ({
  icon,
  color,
  title,
}) => (
  <h4 className={`flex items-center gap-1.5 text-xs font-bold ${color}`}>
    {icon}
    {title}
  </h4>
);

const NewProductRow: React.FC<{
  match: TicketMatch;
  index: number;
  included: boolean;
  onToggle: (val: boolean) => void;
}> = ({ match, included, onToggle }) => {
  const [category, setCategory] = useState('otro');

  return (
    <div className="bg-violet-50/60 space-y-2 rounded-2xl px-3 py-3 text-xs border border-violet-100">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={included}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 shrink-0"
          />
          <div className="min-w-0">
            <p className={`font-semibold text-gray-900 truncate ${included ? '' : 'line-through opacity-50'}`}>
              {match.candidateName}
            </p>
            {match.article.precio_unitario > 0 && (
              <p className="font-mono font-bold text-violet-800">{formatCurrency(match.article.precio_unitario)}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 whitespace-nowrap">Categoría:</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={!included}
          className="flex-1 px-2 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {Array.from(new Set(PRODUCT_CATALOG.map((c) => c.category))).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="otro">otro</option>
        </select>
      </div>
    </div>
  );
};