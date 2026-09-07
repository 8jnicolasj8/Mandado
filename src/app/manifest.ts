import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mandado — Lista Familiar',
    short_name: 'Mandado',
    description: 'App de compras familiar con tiendas locales, precios históricos y WhatsApp',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9FAFB',
    theme_color: '#16A34A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
