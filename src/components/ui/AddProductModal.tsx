'use client';

import React, { useState, useMemo } from 'react';
import { X, Plus, PlusCircle, Search, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { StoreSavingsModal } from './StoreSavingsModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStoreId?: string | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  initialStoreId,
}) => {
  const { products, stores, addItemToList, addProduct, getLatestPriceForStore } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newProductName, setNewProductName] = useState('');
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || '');
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [unit, setUnit] = useState<string>('unidad');

  // Savings modal state
  const [savingsModalData, setSavingsModalData] = useState<{
    isOpen: boolean;
    productName: string;
    chosenStoreId: string;
    chosenPrice: number | null;
    canonicalStoreId: string;
    canonicalPrice: number | null;
  } | null>(null);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  if (!isOpen) return null;

  const handleSelectExistingProduct = (productId: string) => {
    setSelectedProductId(productId);
    setIsCreatingNewProduct(false);

    const product = products.find((p) => p.id === productId);
    if (product?.canonical_store_id && !initialStoreId) {
      setSelectedStoreId(product.canonical_store_id);
    }

    // Auto-detect unit for common products
    const nameLower = product?.name.toLowerCase() || '';
    if (
      nameLower.includes('asado') ||
      nameLower.includes('carne') ||
      nameLower.includes('pollo') ||
      nameLower.includes('milanesa') ||
      nameLower.includes('picada')
    ) {
      setUnit('kg');
      setQuantityInput('1');
    } else if (
      nameLower.includes('banana') ||
      nameLower.includes('manzana') ||
      nameLower.includes('pera') ||
      nameLower.includes('tomate') ||
      nameLower.includes('naranja') ||
      nameLower.includes('limon')
    ) {
      // Veggies/fruits can be bought by unit or kg
      setUnit('unidad');
      setQuantityInput('5');
    } else if (nameLower.includes('acelga') || nameLower.includes('espinaca') || nameLower.includes('rucula')) {
      setUnit('atado');
      setQuantityInput('1');
    }
  };

  const handleStartCreateNew = () => {
    setIsCreatingNewProduct(true);
    setSelectedProductId('');
    setNewProductName(searchQuery.trim());
  };

  const parsedQuantity = parseFloat(quantityInput.replace(',', '.')) || 1;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetProductId = selectedProductId;

    if (isCreatingNewProduct) {
      if (!newProductName.trim()) return;
      const created = addProduct({
        name: newProductName.trim(),
        initialStoreId: selectedStoreId || null,
      });
      targetProductId = created.id;
    }

    if (!targetProductId) return;

    const product = products.find((p) => p.id === targetProductId);
    const canonicalStoreId = product?.canonical_store_id;

    if (
      canonicalStoreId &&
      selectedStoreId &&
      selectedStoreId !== canonicalStoreId
    ) {
      const canonicalPriceObj = getLatestPriceForStore(targetProductId, canonicalStoreId);
      const chosenPriceObj = getLatestPriceForStore(targetProductId, selectedStoreId);

      if (
        canonicalPriceObj &&
        (!chosenPriceObj || canonicalPriceObj.price < chosenPriceObj.price)
      ) {
        setSavingsModalData({
          isOpen: true,
          productName: product?.name || newProductName,
          chosenStoreId: selectedStoreId,
          chosenPrice: chosenPriceObj?.price || null,
          canonicalStoreId: canonicalStoreId,
          canonicalPrice: canonicalPriceObj.price,
        });
        return;
      }
    }

    // Proceed normally
    addItemToList({
      productId: targetProductId,
      storeId: selectedStoreId || null,
      isStoreOverride: false,
      quantity: parsedQuantity,
      unit,
    });

    handleClose();
  };

  const handleSwitchToCanonical = () => {
    if (!savingsModalData) return;

    addItemToList({
      productId: selectedProductId,
      storeId: savingsModalData.canonicalStoreId,
      isStoreOverride: false,
      quantity: parsedQuantity,
      unit,
    });

    setSavingsModalData(null);
    handleClose();
  };

  const handleKeepOverride = () => {
    if (!savingsModalData) return;

    addItemToList({
      productId: selectedProductId,
      storeId: savingsModalData.chosenStoreId,
      isStoreOverride: true,
      quantity: parsedQuantity,
      unit,
    });

    setSavingsModalData(null);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedProductId('');
    setNewProductName('');
    setIsCreatingNewProduct(false);
    setSelectedStoreId(initialStoreId || '');
    setQuantityInput('1');
    setUnit('unidad');
    setSavingsModalData(null);
    onClose();
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const chosenStore = stores.find((s) => s.id === savingsModalData?.chosenStoreId) || null;
  const canonicalStore = stores.find((s) => s.id === savingsModalData?.canonicalStoreId) || null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200 relative max-h-[90vh] flex flex-col">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Agregar al Mandado</h3>
              <p className="text-xs text-gray-500">Selecciona o crea un producto para la lista</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto pr-1">
            {/* Search or create toggle */}
            {!isCreatingNewProduct ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Buscar producto
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ej. Dulce de leche, Manzanas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Product picker list */}
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50/50">
                  {filteredProducts.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    const canonical = stores.find((s) => s.id === prod.canonical_store_id);

                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectExistingProduct(prod.id)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-4 border-emerald-600'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{prod.name}</span>
                        {canonical && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                            <Sparkles className="w-2.5 h-2.5" />
                            {canonical.name}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No encontramos &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleStartCreateNew}
                  className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Crear nuevo producto &quot;{searchQuery.trim() || 'nuevo'}&quot;
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Nombre del nuevo producto
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewProduct(false)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Volver a buscar
                  </button>
                </div>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ej. Yerba mate 1kg"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  required
                />
              </div>
            )}

            {/* Store selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tienda asignada
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">Cualquier tienda / Sin preferencia</option>
                {stores.map((s) => {
                  const isCanonical = selectedProduct?.canonical_store_id === s.id;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category}) {isCanonical ? '⭐ Más barata' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity and Unit */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cantidad <span className="text-gray-400 font-normal">(ej. 0.5 o 1.5 o 5)</span>
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(quantityInput.replace(',', '.')) || 1;
                        const step = unit === 'kg' ? 0.5 : 1;
                        const min = unit === 'kg' ? 0.25 : 1;
                        const next = Math.max(min, Number((current - step).toFixed(2)));
                        setQuantityInput(String(next));
                      }}
                      className="px-2.5 py-2 text-gray-600 hover:bg-gray-200 active:bg-gray-300 font-bold text-sm"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="1 o 0.5"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      className="w-full text-center py-2 text-sm bg-transparent focus:outline-hidden font-bold text-gray-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(quantityInput.replace(',', '.')) || 1;
                        const step = unit === 'kg' ? 0.5 : 1;
                        const next = Number((current + step).toFixed(2));
                        setQuantityInput(String(next));
                      }}
                      className="px-2.5 py-2 text-gray-600 hover:bg-gray-200 active:bg-gray-300 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unidad de medida
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                  >
                    <option value="kg">⚖️ Kilos (kg) — ej. 0.5 o 1.5</option>
                    <option value="unidad">🔢 Unidades (u) — ej. 5 bananas</option>
                    <option value="g">Gramos (g) — ej. 500g</option>
                    <option value="atado">🌿 Atado — ej. acelga</option>
                    <option value="litro">🥛 Litros (L)</option>
                    <option value="paquete">📦 Paquete</option>
                    <option value="lata">🥫 Lata</option>
                  </select>
                </div>
              </div>

              {/* Quick shortcuts based on unit */}
              <div className="pt-0.5">
                <span className="text-[10px] font-semibold text-gray-400 block mb-1">
                  Atajos rápidos:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {unit === 'kg' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setQuantityInput('0.5')}
                        className={`px-2 py-0.5 rounded-lg border transition-all ${
                          quantityInput === '0.5'
                            ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        0.5 kg (½ kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuantityInput('1')}
                        className={`px-2 py-0.5 rounded-lg border transition-all ${
                          quantityInput === '1'
                            ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        1 kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuantityInput('1.5')}
                        className={`px-2 py-0.5 rounded-lg border transition-all ${
                          quantityInput === '1.5'
                            ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        1.5 kg (1 ½ kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuantityInput('2')}
                        className={`px-2 py-0.5 rounded-lg border transition-all ${
                          quantityInput === '2'
                            ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        2 kg
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUnit('unidad');
                          setQuantityInput('5');
                        }}
                        className="px-2 py-0.5 rounded-lg border border-dashed border-emerald-400 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 font-medium"
                      >
                        ¿Por unidades? (ej. 5 bananas)
                      </button>
                    </>
                  ) : unit === 'g' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setQuantityInput('250')}
                        className="px-2 py-0.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      >
                        250 g (¼ kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuantityInput('500')}
                        className="px-2 py-0.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold"
                      >
                        500 g (½ kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuantityInput('750')}
                        className="px-2 py-0.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      >
                        750 g
                      </button>
                    </>
                  ) : (
                    <>
                      {['1', '2', '3', '4', '5', '6', '12'].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQuantityInput(n)}
                          className={`px-2 py-0.5 rounded-lg border transition-all ${
                            quantityInput === n
                              ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {n} {n === '5' ? '(ej: 5 bananas)' : n === '6' ? '(½ docena)' : n === '12' ? '(docena)' : 'u'}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setUnit('kg');
                          setQuantityInput('1');
                        }}
                        className="px-2 py-0.5 rounded-lg border border-dashed border-emerald-400 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 font-medium"
                      >
                        ¿Por kilo? (kg)
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedProductId && (!isCreatingNewProduct || !newProductName.trim())}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
              >
                Agregar a la lista
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Auto-correction prompt if cheaper store exists */}
      <StoreSavingsModal
        isOpen={Boolean(savingsModalData?.isOpen)}
        productName={savingsModalData?.productName || ''}
        chosenStore={chosenStore}
        chosenPrice={savingsModalData?.chosenPrice || null}
        canonicalStore={canonicalStore}
        canonicalPrice={savingsModalData?.canonicalPrice || null}
        onSwitchToCanonical={handleSwitchToCanonical}
        onKeepOverride={handleKeepOverride}
        onClose={() => setSavingsModalData(null)}
      />
    </>
  );
};
