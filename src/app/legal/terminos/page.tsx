import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
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
        <h1 className="text-xl font-black tracking-tight text-gray-900">Términos y Condiciones</h1>
        <p className="text-[10px] text-gray-400 font-medium">
          Última actualización: septiembre 2026
        </p>

        <p className="text-xs text-gray-600 leading-relaxed">
          Bienvenido a Mandado. Al registrarte y usar la aplicación aceptás estos términos, que rigen el uso de la app para organizar las compras familiares compartidas.
        </p>

        <Section title="1. Uso de la aplicación">
          Mandado es una herramienta para llevar tu lista de compras, registrar precios de comercios locales y compartir esa información con tu familia. El uso es personal y familiar: podés crear o unirte a una familia mediante el código de invitación.
        </Section>

        <Section title="2. Precios e información">
          Los precios registrados son aportados por los usuarios o detectados automáticamente a partir de tickets. Mandado no garantiza que estos precios sean exactos, estén vigentes ni reflejen el valor real de los productos en cada comercio. La app es informativa y no constituye una oferta de venta.
        </Section>

        <Section title="3. Escaneo de tickets (BETA)">
          El escaneo de tickets utiliza inteligencia artificial para leer el comprobante y sugerir productos y precios. La lectura puede ser imperfecta: siempre podés corregir, excluir o descartar lo detectado. No cargamos ni almacenamos copias de tus tickets.
        </Section>

        <Section title="4. Comunidad y datos compartidos">
          Si tu familia comparte precios, tu pueblo (ciudad) y los precios que registres podrán verse por otras familias de la misma localidad que tengan Mandado Plus o el add-on de importación. Nunca se muestran datos que identifiquen a tu familia ni a sus integrantes. Podés dejar de compartir en cualquier momento.
        </Section>

        <Section title="5. Cuenta, seguridad y baja">
          Sos responsable de mantener tus credenciales y de indicar un código de familia válido. Podés cerrar tu cuenta cuando quieras desde la app; el cierre elimina el acceso a los datos asociados conforme a la política de privacidad.
        </Section>

        <Section title="6. Limitación de responsabilidad">
          Mandado se provee &quot;tal cual&quot;. En la medida máxima permitida por la ley, no somos responsables por daños derivados del uso de la app, decisiones de compra, diferencias de precios o interrupciones del servicio.
        </Section>

        <Section title="7. Modificaciones">
          Podemos actualizar estos términos. Los cambios se publican en esta página y, cuando sean relevantes, se te notificarán dentro de la app. El uso continuado implica la aceptación de la versión vigente.
        </Section>

        <Section title="8. Contacto">
          Ante dudas sobre estos términos escribinos por WhatsApp desde la sección de planes, o mediante el correo indicado en el footer de la app.
        </Section>

        <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-3">
          Documento orientativo: consultá con asesoría legal si necesitás certeza sobre derechos y obligaciones.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}