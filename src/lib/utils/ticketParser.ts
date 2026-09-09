// Parseo de tickets de compra con Gemini (server-side: nunca usar esta
// función desde el cliente, la API key es secreta).

export const GEMINI_MODEL = 'gemini-3.6-flash';

export const GEMINI_PROMPT = `Sos un asistente especializado en leer tickets de supermercados y comercios argentinos.


Analizá la imagen del ticket y determiná el MODO:


MODO A — si el ticket lista productos individuales con precios unitarios.
MODO B — si el ticket solo muestra rubros generales o totales sin desglose.


Para MODO A devolvé:
{
  "modo": "A",
  "fecha": "YYYY-MM-DD o null si no se ve",
  "total": 0.0,
  "articulos": [
    {
      "nombre_original": "texto exacto del ticket",
      "nombre_normalizado": "nombre legible y expandido en español",
      "cantidad": 1,
      "precio_unitario": 0.0,
      "categoria": "almacén|lácteos|limpieza|fiambre|verdulería|carnicería|otro"
    }
  ]
}


Reglas para MODO A:
- precio_unitario es el precio BRUTO sin descuentos
- Las líneas de descuento (ej: "20% CLUBDIA -277.80") NO son artículos, 
  ignoralas completamente
- Si un artículo tiene cantidad > 1, el precio_unitario es el precio 
  por unidad (no el total de la línea)
- Ignorar completamente: subtotal, total, IVA, código de cajera, 
  leyendas de ahorro, datos fiscales, número de factura
- nombre_normalizado: primera letra mayúscula, resto minúscula, 
  expandir abreviaturas comunes argentinas:
  HOJ → Hojas, SAC → Sachet, P HIG → Papel Higiénico, 
  GALLETIT → Galletitas, GELAT → Gelatina, CHOC → Chocolate,
  VAIN → Vainilla, CLASI → Clásico, DESC → Descremada,
  C/EXTR → Con Extra, GRANO → Granos


Para MODO B devolvé:
{
  "modo": "B",
  "fecha": "YYYY-MM-DD o null si no se ve",
  "total": 0.0,
  "categoria_general": "carnicería|verdulería|almacén|otro"
}


Respondé SOLO con el JSON. Sin texto antes ni después. 
Sin backticks. Sin comentarios.`;

export interface TicketArticle {
  nombre_original: string;
  nombre_normalizado: string;
  cantidad: number;
  precio_unitario: number;
  categoria: string;
}

export interface ParsedTicketModoA {
  modo: 'A';
  fecha: string | null;
  total: number;
  articulos: TicketArticle[];
}

export interface ParsedTicketModoB {
  modo: 'B';
  fecha: string | null;
  total: number;
  categoria_general: string;
}

export type ParsedTicket = ParsedTicketModoA | ParsedTicketModoB;

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 15000;
const RETRYABLE_STATUS = new Set([429, 503]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Extrae el JSON de la respuesta de Gemini tolerando fences de markdown.
interface GeminiTextPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
    };
  }>;
}

interface RawArticle {
  nombre_original?: unknown;
  nombre_normalizado?: unknown;
  cantidad?: unknown;
  precio_unitario?: unknown;
  categoria?: unknown;
}

const extractJson = (data: unknown): ParsedTicket | null => {
  try {
    const content = (data as GeminiResponse)?.candidates?.[0]?.content;
    const text = content?.parts?.map((p) => p.text).filter(Boolean).join('');
    if (!text) return null;
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as unknown;
    const record = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;

    if (record.modo === 'A' && Array.isArray(record.articulos)) {
      return {
        modo: 'A',
        fecha: typeof record.fecha === 'string' ? record.fecha : null,
        total: typeof record.total === 'number' ? record.total : 0,
        articulos: (record.articulos as RawArticle[]).map((a) => ({
          nombre_original: String(a.nombre_original ?? '').trim(),
          nombre_normalizado: String(a.nombre_normalizado ?? '').trim(),
          cantidad: Number(a.cantidad) || 1,
          precio_unitario: Number(a.precio_unitario) || 0,
          categoria: String(a.categoria ?? 'otro'),
        })),
      } as ParsedTicketModoA;
    }
    if (record.modo === 'B') {
      return {
        modo: 'B',
        fecha: typeof record.fecha === 'string' ? record.fecha : null,
        total: typeof record.total === 'number' ? record.total : 0,
        categoria_general: String(record.categoria_general ?? 'otro'),
      } as ParsedTicketModoB;
    }
    return null;
  } catch {
    return null;
  }
};

export async function parseTicketWithGemini(
  imageBase64: string,
  mimeType: string
): Promise<ParsedTicket> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta la clave de Gemini (GEMINI_API_KEY)');
  if (!GEMINI_PROMPT.trim()) {
    throw new Error('El prompt de Gemini todavía no está configurado');
  }

  const url = `${API_BASE}/${GEMINI_MODEL}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: GEMINI_PROMPT },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: { responseMimeType: 'application/json' },
  };

  let lastError = 'El servidor está ocupado, intentá de nuevo en un momento';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let shouldRetry = false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = extractJson(data);
        if (parsed) return parsed;
        lastError = 'No pudimos leer el ticket, intentá con una foto más clara';
        shouldRetry = true;
      } else if (RETRYABLE_STATUS.has(res.status)) {
        lastError = `Gemini está ocupado (${res.status})`;
        shouldRetry = true;
      } else {
        lastError = `Error de Gemini (${res.status})`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      shouldRetry = true;
    }

    if (!shouldRetry) throw new Error(lastError);
    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new Error(lastError);
}