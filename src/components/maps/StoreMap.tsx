'use client';

import React, { useEffect, useRef } from 'react';
import { Store } from '@/lib/types/database';
import { getCategoryEmoji } from '@/lib/utils/whatsapp';

interface StoreMapProps {
  stores: Store[];
  selectedStoreId?: string | null;
  onStoreSelect?: (store: Store) => void;
  className?: string;
}

export const StoreMap: React.FC<StoreMapProps> = ({
  stores,
  selectedStoreId,
  onStoreSelect,
  className = 'h-72 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const storesWithLocation = stores.filter(
    (s) => s.lat !== null && s.lng !== null && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng))
  );

  useEffect(() => {
    let isMounted = true;

    // Dynamically import Leaflet to prevent SSR window is not defined errors
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default marker icon issues in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) {
        // Center around first store or General Pinto
        const defaultCenter: [number, number] = storesWithLocation.length > 0
          ? [Number(storesWithLocation[0].lat), Number(storesWithLocation[0].lng)]
          : [-34.7648413, -61.8927143];

        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView(defaultCenter, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
      }

      const map = mapRef.current;

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (storesWithLocation.length === 0) return;

      const group: any[] = [];

      storesWithLocation.forEach((store) => {
        const emoji = getCategoryEmoji(store.category);
        const isSelected = selectedStoreId === store.id;

        // Custom HTML emoji marker icon
        const customIcon = L.divIcon({
          className: 'custom-store-marker',
          html: `
            <div style="
              background-color: ${isSelected ? '#16A34A' : '#ffffff'};
              color: ${isSelected ? '#ffffff' : '#111827'};
              border: 2px solid ${isSelected ? '#15803d' : '#E5E7EB'};
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
              width: 36px;
              height: 36px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              ${emoji}
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([Number(store.lat), Number(store.lng)], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="padding: 4px; font-family: sans-serif; min-width: 140px;">
            <div style="font-size: 13px; font-weight: bold; color: #111827;">${store.name}</div>
            <div style="font-size: 11px; text-transform: capitalize; color: #16A34A; margin-top: 2px;">${store.category}</div>
            ${store.address ? `<div style="font-size: 11px; color: #6B7280; margin-top: 4px;">📍 ${store.address}</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onStoreSelect) {
            onStoreSelect(store);
          }
        });

        markersRef.current.push(marker);
        group.push([Number(store.lat), Number(store.lng)]);
      });

      // Fit bounds if more than 1 store
      if (group.length > 1) {
        map.fitBounds(group as any, { padding: [40, 40] });
      } else if (group.length === 1) {
        map.setView(group[0] as any, 15);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [storesWithLocation, selectedStoreId, onStoreSelect]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 shadow-xs ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[260px]" />
      {storesWithLocation.length === 0 && (
        <div className="absolute inset-0 bg-gray-100/90 flex flex-col items-center justify-center p-4 text-center z-20">
          <p className="text-xs font-semibold text-gray-600">
            No hay tiendas con coordenadas registradas
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Agrega latitud y longitud a tus tiendas para verlas aquí
          </p>
        </div>
      )}
    </div>
  );
};
