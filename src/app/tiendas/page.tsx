'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Store as StoreIcon, MapPin, Layers, Map as MapIcon, X, LocateFixed } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { StoreCard } from '@/components/ui/StoreCard';
import { StoreMap } from '@/components/maps/StoreMap';
import { StoreCategory, Store } from '@/lib/types/database';
import { CATEGORY_LABELS } from '@/lib/utils/whatsapp';

export default function TiendasPage() {
  const { stores, priceHistory, addStore } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Form state for adding store
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StoreCategory>('supermercado');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Calculate product count per store
  const productCountByStore = useMemo(() => {
    const counts: Record<string, Set<string>> = {};
    priceHistory.forEach((ph) => {
      if (!counts[ph.store_id]) counts[ph.store_id] = new Set();
      counts[ph.store_id].add(ph.product_id);
    });
    const result: Record<string, number> = {};
    for (const storeId in counts) {
      result[storeId] = counts[storeId].size;
    }
    return result;
  }, [priceHistory]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    if (selectedCategory === 'all') return stores;
    return stores.filter((s) => s.category === selectedCategory);
  }, [stores, selectedCategory]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización');
      return;
    }
    setIsLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (error) => {
        setGeoError('No pudimos acceder a tu ubicación');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addStore({
      name: name.trim(),
      category,
      address: address.trim() || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    });

    // Reset & close
    setName('');
    setCategory('supermercado');
    setAddress('');
    setLat('');
    setLng('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header title & Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-emerald-600" />
            Tiendas locales
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stores.length} comercios registrados por tu familia
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva tienda
        </button>
      </div>

      {/* View Switcher: List vs Map */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'list'
            ? 'bg-white text-gray-900 shadow-xs'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Lista ({filteredStores.length})
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'map'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          Mapa ({stores.filter((s) => s.lat && s.lng).length})
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          Todas
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${selectedCategory === key
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Map View */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          <StoreMap
            stores={filteredStores}
            selectedStoreId={selectedStore?.id}
            onStoreSelect={(store) => setSelectedStore(store)}
            className="h-[340px] w-full"
          />

          {selectedStore && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">
                Tienda seleccionada en el mapa
              </p>
              <StoreCard
                store={selectedStore}
                productCount={productCountByStore[selectedStore.id] || 0}
              />
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="space-y-2.5">
          {filteredStores.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
              <StoreIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-700">No hay tiendas en esta categoría</p>
              <p className="text-xs text-gray-400 mt-1">
                Registra tus comercios habituales para comparar precios automáticamente.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Agregar primera tienda
              </button>
            </div>
          ) : (
            filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                productCount={productCountByStore[store.id] || 0}
              />
            ))
          )}
        </div>
      )}

      {/* Modal: Add Store */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  🏪
                </div>
                <h2 className="text-base font-bold text-gray-900">Agregar nueva tienda</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre del comercio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Verdulería Los Hermanos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StoreCategory)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="supermercado">🛒 Supermercado</option>
                  <option value="verduleria">🥦 Verdulería</option>
                  <option value="carniceria">🥩 Carnicería</option>
                  <option value="otro">🏪 Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  placeholder="Ej: Av. San Martín 1420"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Ubicación en mapa <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    {isLocating ? 'Detectando...' : 'Usar mi GPS'}
                  </button>
                </div>

                {geoError && (
                  <p className="text-[11px] text-amber-600 mb-1">{geoError}</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400">Latitud</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="-34.6037"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400">Longitud</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="-58.3816"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                >
                  Guardar tienda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
