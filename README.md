# 🛒 Mandado — Lista de Compras Familiar Inteligente

**Mandado** es una aplicación web *mobile-first* diseñada para optimizar las compras del hogar familiar. Permite registrar tiendas locales de barrio (verdulero, carnicero, súper chino, etc.), almacenar precios históricos y calcular automáticamente **qué comercio ofrece el precio más bajo por producto**. Además, permite exportar la lista de compras agrupada por tienda con formato listo para **WhatsApp** con un solo toque.

---

## 🌟 Características Principales

1. **Cuentas Familiares & Multi-usuario**:
   - Cada miembro de la familia tiene cuenta propia (con nombre y avatar de color personalizado).
   - Unirse mediante un **Código de Invitación Familiar** único o crear una familia nueva.
   - **Lista compartida familiar** activa sincronizada en tiempo real, más **listas personales** por usuario.

2. **Tiendas Locales con Mapa Interactivo (Leaflet + OpenStreetMap)**:
   - Registro de comercios habituales: Verdulería 🥦, Carnicería 🥩, Supermercado 🏪 u Otro 🏬.
   - Vista en lista o mapa interactivo 100% gratuito (sin costos de Google Maps API).
   - Detección rápida de coordenadas GPS desde el navegador.

3. **Lógica de Tienda Canónica (Ahorro Automático)**:
   - Mandado analiza el histórico de precios registrado por los miembros de la familia.
   - Asigna automáticamente a cada producto la **tienda canónica** (la que registró el precio más bajo).
   - **Aviso de auto-corrección inteligente**: Si agregas un producto en una tienda más cara, la app te alerta:
     > *"¿Sabías que este producto está más barato en [Tienda Canónica]? ($X vs $Y)"*
     Permite cambiar a la más barata con 1 click o mantener la tienda elegida intencionalmente (`is_store_override = true`).

4. **Historial de Precios & Precios Desactualizados**:
   - Muestra la fecha del último precio registrado.
   - Si tiene más de 7 días, muestra una insignia de advertencia: `Precio desactualizado`.
   - Botón directo para registrar o actualizar el precio al momento de comprar.

5. **Exportación a WhatsApp (Sin APIs externas)**:
   - Genera un enlace nativo `wa.me/?text=...` con la lista agrupada por comercio, emojis, cantidades y estimado total:
     ```text
     🛒 *Lista Mandado - 07/09/2026*

     🏪 *El Día*
     • DDL x2
     • Shampoo x1

     🥩 *Carnicería Don Juan*
     • Tira de asado 1kg

     🥦 *Verdulería El Gauchito*
     • Manzana 1kg
     • Banana x1

     Estimado total: $14.600
     ```

6. **Modo Demo Offline / Local**:
   - Funciona de inmediato sin configurar Supabase (con datos de prueba interactivos precargados y persistencia en `localStorage`).
   - Al configurar variables de Supabase, conmuta a base de datos PostgreSQL en la nube o NAS con RLS y suscripciones Realtime.

---

## 🛠️ Stack Tecnológico

- **Frontend**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [TailwindCSS](https://tailwindcss.com/) (Mobile-First, paleta mercado: `#16A34A`, `#F59E0B`, `#F3F4F6`, `#111827`)
- **Mapas**: [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) (SSR-safe)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Triggers + Realtime subscriptions)
- **Despliegue**:
  - *Dev / Casa*: NAS local (Synology, QNAP, TrueNAS, Unraid o Raspberry Pi) vía Docker.
  - *Producción*: Vercel + Supabase Cloud Free Tier.

---

## 📁 Estructura del Proyecto

```
Mandado/
├── .env.example                # Plantilla de variables de entorno
├── Dockerfile                  # Contenedor optimizado standalone para NAS
├── docker-compose.yml          # Despliegue en 1 comando para NAS local
├── next.config.ts              # Configuración Next.js (output: standalone)
├── package.json
├── supabase/
│   └── schema.sql              # Esquema SQL completo con RLS, triggers y realtime
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/          # Inicio de sesión + acceso demo
    │   │   └── register/       # Registro + crear/unirse a familia
    │   ├── listas/
    │   │   ├── page.tsx        # Resumen de todas las listas (familiar + personales)
    │   │   └── [id]/page.tsx   # Vista individual de una lista
    │   ├── tiendas/
    │   │   ├── page.tsx        # Directorio de tiendas (Lista + Mapa Leaflet)
    │   │   └── [id]/page.tsx   # Precios históricos registrados en la tienda
    │   ├── productos/
    │   │   └── page.tsx        # Catálogo familiar, comparador de precios y buscador
    │   ├── perfil/
    │   │   └── page.tsx        # Código de invitación, miembros y ajustes
    │   ├── layout.tsx          # Shell mobile con marco responsivo
    │   ├── page.tsx            # Home: Lista familiar compartida activa
    │   └── globals.css         # Tokens de diseño y utilidades
    ├── components/
    │   ├── layout/             # Header sticky y BottomNav mobile
    │   ├── maps/               # StoreMap con Leaflet y marcadores dinámicos
    │   └── ui/                 # ListItem, StoreCard, PriceBadge, WhatsAppButton, Modales
    └── lib/
        ├── context/            # AppContext con lógica offline y canónica
        ├── demo-data.ts        # Datos iniciales realistas para pruebas
        ├── supabase/           # Clientes browser, server y middleware
        ├── types/              # Tipos TypeScript alineados al esquema SQL
        └── utils/              # Formateador WhatsApp y evaluador de precios
```

---

## 🚀 Puesta en Marcha Rápida (Local)

### 1. Clonar e Instalar Dependencias

```bash
git clone <tu-repositorio>
cd Mandado
npm install
```

### 2. Iniciar en Modo Desarrollo (Modo Demo Activo)

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La aplicación arrancará automáticamente en **Modo Demo Familiar**, permitiéndote probar la lista compartida, el selector de tiendas con mapa, el aviso de ahorro canónico y el envío a WhatsApp de inmediato.

---

## 🗄️ Configuración de Supabase (Cloud o Self-Hosted)

Para habilitar sincronización en tiempo real entre múltiples celulares:

1. Crea un proyecto gratuito en [Supabase](https://supabase.com/).
2. Ve al **SQL Editor** en el panel de Supabase.
3. Copia y ejecuta todo el contenido de [`supabase/schema.sql`](supabase/schema.sql). Esto creará:
   - Tablas: `families`, `profiles`, `stores`, `products`, `price_history`, `lists`, `list_items`.
   - Políticas de seguridad por fila (RLS) para aislar datos entre familias.
   - Función y trigger `recalculate_canonical_store()` para actualización automática de la tienda más barata.
   - Trigger `handle_new_family()` para crear la lista familiar compartida inicial.
   - Publicación en `supabase_realtime` para sincronización viva de `list_items`.
4. En tu proyecto, crea un archivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Completa tus credenciales de Supabase en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

---

## 🐳 Despliegue en NAS Local (Docker / Portainer)

Ideal para tener tu servidor en casa (Synology Container Manager, TrueNAS SCALE, Unraid o Debian NAS):

1. Configura tus variables en `.env.local`.
2. Inicia el contenedor:
   ```bash
   docker-compose up -d --build
   ```
3. La aplicación estará disponible en la red local en: `http://<IP-DE-TU-NAS>:3000`.

---

## ☁️ Despliegue en Producción (Vercel + Supabase)

1. Sube tu código a GitHub o GitLab.
2. Importa el repositorio en [Vercel](https://vercel.com/).
3. Configura las variables de entorno en Vercel Settings > Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Presiona **Deploy**. ¡Listo para que toda la familia lo agregue a la pantalla de inicio del celular como PWA/Web App!
