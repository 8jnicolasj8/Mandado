import Link from 'next/link';
import { MessageCircle, ArrowLeft, Landmark, Receipt, RefreshCcw } from 'lucide-react';

export default function PagosPage() {
  return (
    <div className="space-y-4 pb-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Inicio
      </Link>

      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
        <h1 className="text-xl font-black tracking-tight text-gray-900">Formas de Pago</h1>
        <p className="text-[10px] text-gray-400 font-medium">Última actualización: septiembre 2026</p>

        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">1. Coordinación por WhatsApp</h2>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Los planes se activan de forma manual: al pulsar el botón de compra se abre WhatsApp con un mensaje pre-armado. Confirmamos por escrito el plan contratado y te indicamos el medio de pago disponible.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Landmark className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">2. Transferencia bancaria</h2>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Recibís los datos de la cuenta (CBU / CVU) y el monto exacto del plan elegido. La suscripción se activa cuando se acredita el pago del período.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Receipt className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">3. Los pagos se gestionan fuera de la app</h2>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Mandado no procesa pagos por sí misma: no solicitamos tarjetas ni datos bancarios dentro de la aplicación. Cualquier pedido de datos de pago dentro de la app debe ser ignorado.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">4. Renovación y baja</h2>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Los planes se renuevan de forma mensual y se interrumpen al finalizar el período si no se renueva el pago. Podés cancelar en cualquier momento escribiéndonos por WhatsApp; se respeta lo ya abonado del período en curso.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <h2 className="text-sm font-bold text-amber-900">Precios vigentes</h2>
          <ul className="text-xs text-amber-800 mt-1.5 space-y-1">
            <li>• Plan MANDADO: <b>$2.000 ARS / mes</b></li>
            <li>• Plan PLUS: <b>$3.500 ARS / mes</b></li>
            <li>• Add-on Importación de precios: <b>$2.000 ARS (pago único)</b></li>
          </ul>
        </div>

        <Link
          href="/planes"
          className="block w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          Ver planes
        </Link>

        <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-3">
          Documento orientativo: no constituye asesoramiento financiero ni legal.
        </p>
      </div>
    </div>
  );
}