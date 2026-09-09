import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context/AppContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Mandado — Lista de Compras Familiar',
  description: 'App de compras familiar con tiendas locales, precios históricos y envío por WhatsApp.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full bg-gray-100">
      <body className="h-full flex flex-col font-sans bg-gray-100 text-gray-900 antialiased selection:bg-emerald-200">
        <AppProvider>
          <div className="w-full max-w-md mx-auto min-h-screen bg-[#F9FAFB] shadow-xl flex flex-col relative">
            <Header />
            <main className="flex-1 pb-32 overflow-y-auto">{children}</main>
            <Footer />
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
