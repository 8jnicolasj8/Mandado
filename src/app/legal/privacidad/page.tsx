import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
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
        <h1 className="text-xl font-black tracking-tight text-gray-900">Política de Privacidad</h1>
        <p className="text-[10px] text-gray-400 font-medium">
          Última actualización: septiembre 2026
        </p>

        <p className="text-xs text-gray-600 leading-relaxed">
          En Mandado cuidamos tu información. Esta política explica qué datos usamos, para qué y cómo los protegemos.
        </p>

        <Section title="1. Información que recopilamos">
          <ul className="list-disc pl-4 space-y-1">
            <li>Datos de cuenta: nombre de usuario, contraseña (almacenada en forma segura por el proveedor de autenticación), teléfono/WhatsApp.</li>
            <li>Datos de familia: código de invitación, apellido, miembros.</li>
            <li>Contenido de la app: listas, productos, comercios y precios que cargás o detectás.</li>
            <li>Imágenes de tickets: se envían a un servicio de IA para leer el texto y se descartan; no las guardamos.</li>
          </ul>
        </Section>

        <Section title="2. Cómo usamos tus datos">
          Los usamos para: mostrarte y sincronizar tus listas y precios entre dispositivos, permitir el acceso de tu familia, detectar productos con IA a partir de tus tickets y —si compartís tu pueblo y optás por compartir precios— brindar comparativas de precios de la comunidad.
        </Section>

        <Section title="3. Compartir con terceros">
          No vendemos datos personales. La lectura de tickets se procesa mediante un servicio de IA externo (Google Gemini) enviando exclusivamente el texto/imagen del ticket para su interpretación. Tus precios compartidos solo se exponen de forma agregada por comercio y pueblo, sin identificar quién los cargó.
        </Section>

        <Section title="4. Opciones de privacidad">
          Podés decidir si tu familia comparte precios con la comunidad. Si elegís compartir, se publican el pueblo y los precios registrados (nunca tu nombre ni el de tu familia). El add-on de importación permite usar precios de otras familias sin exponer nada a cambio.
        </Section>

        <Section title="5. Retención y baja">
          Conservamos tus datos mientras la cuenta esté activa. Si solicitás la baja, eliminamos o anonimizamos la información de tu cuenta y familia. Independizamos los precios compartidos antes de eliminar: se vuelven anónimos.
        </Section>

        <Section title="6. Seguridad">
          La autenticación y el almacenamiento están en infraestructura en la nube (Supabase/Google Cloud) con cifrado en tránsito y en reposo. El acceso a tu familia se protege mediante el código de invitación.
        </Section>

        <Section title="7. Tus derechos">
          Tenés derecho a acceder, rectificar, cancelar y oponerte al tratamiento de tus datos. Escribinos por WhatsApp desde la sección de planes o al correo indicado en el footer de la app.
        </Section>

        <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-3">
          Documento orientativo: esta política resume nuestro tratamiento de datos; ante requerimientos formales consultá con asesoría legal.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      <div className="text-xs text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}