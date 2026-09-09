// Lógica de matching de un ticket parseado contra la lista activa, la tabla
// de productos (Supabase) y el catálogo hardcodeado. Es 100% pura (sin React):
// el modal consume los planes y aplica los cambios con el contexto.

import { PRODUCT_CATALOG, normalizeProductName } from '../data/productCatalog';
import { ParsedTicket, ParsedTicketModoA, ParsedTicketModoB, TicketArticle } from './ticketParser';
import { ListItemEnriched, Product } from '../types/database';

export const AUTO_THRESHOLD = 0.85; // > 0.85 → match automático
export const CONFIRM_THRESHOLD = 0.5; // 0.5–0.85 → requiere confirmación

export type MatchKind = 'auto' | 'confirm' | 'price' | 'new';

export interface TicketMatch {
  article: TicketArticle;
  kind: MatchKind;
  confidence: number;
  candidateName: string; // nombre que debe quedar (regla de nombre)
  candidateId: string | null; // id en DB (existente o catalog-N a crear)
  needsCreate: boolean; // requiere ensureDbProduct antes de guardar precio
  listItemId?: string;
  listQty?: number;
  remainingQty: number; // cantidad que queda pendiente en la lista
  checkFull: boolean; // true → tachar el ítem entero
}

export interface MatcherContext {
  listItems: ListItemEnriched[]; // lista activa
  products: Product[]; // productos ya en Supabase (family)
  storeId: string; // tienda actual (para modo B)
}

export interface TicketPlan {
  modo: 'A' | 'B';
  fecha: string | null;
  total: number;
  matches: TicketMatch[]; // solo en modo A
  toCheckModoB: ListItemEnriched[]; // solo en modo B
}

const normalize = (s: string) => normalizeProductName(s);

export function fuzzyScore(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;

  const tokensA = na.split(' ').filter(Boolean);
  const tokensB = nb.split(' ').filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const common = [...setA].filter((t) => setB.has(t)).length;
  const unionSize = new Set([...setA, ...setB]).size;

  const jaccard = unionSize > 0 ? common / unionSize : 0;
  const containment =
    tokensA.length > 0
      ? tokensA.filter((t) => t.length > 3 && setB.has(t)).length / Math.max(tokensA.length, tokensB.length)
      : 0;

  let score = Math.max(jaccard, containment, common / tokensB.length);

  if (nb.includes(na) || na.includes(nb)) score = Math.max(score, 0.9);
  if (na === nb) score = 1;

  return Math.min(1, score);
}

// Merges artículos duplicados del ticket: suma cantidades, precio del último.
export const mergeTicketArticles = (articles: TicketArticle[]): TicketArticle[] => {
  const byName = new Map<string, TicketArticle>();
  for (const a of articles) {
    const key = normalize(a.nombre_original || a.nombre_normalizado) || normalize(a.nombre_normalizado);
    if (!key) continue;
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, a);
    } else {
      byName.set(key, {
        ...a,
        cantidad: (prev.cantidad || 0) + (a.cantidad || 0),
        precio_unitario: a.precio_unitario || prev.precio_unitario,
      });
    }
  }
  return [...byName.values()];
};

// PASO 1 — match contra la lista activa.
export function matchArticleToList(article: TicketArticle, ctx: MatcherContext): {
  item: ListItemEnriched;
  score: number;
} | null {
  let best: { item: ListItemEnriched; score: number } | null = null;
  for (const item of ctx.listItems) {
    if (item.checked) continue;
    const score = fuzzyScore(article.nombre_normalizado, item.product?.name || '');
    if (!best || score > best.score) best = { item, score };
  }
  return best && best.score >= CONFIRM_THRESHOLD ? best : null;
}

// PASO 2 — match contra catálogo (tabla products + catálogo hardcodeado),
// excluyendo productos que ya están en la lista activa.
export function matchArticleToInventory(article: TicketArticle, ctx: MatcherContext): {
  name: string;
  id: string;
  needsCreate: boolean;
  score: number;
} | null {
  const inList = new Set(ctx.listItems.map((i) => normalize(i.product?.name || '')));
  let best: { name: string; id: string; needsCreate: boolean; score: number } | null = null;

  for (const p of ctx.products) {
    if (inList.has(normalize(p.name))) continue;
    const score = fuzzyScore(article.nombre_normalizado, p.name);
    if (!best || score > best.score) best = { name: p.name, id: p.id, needsCreate: false, score };
  }

  for (const cat of PRODUCT_CATALOG) {
    if (inList.has(normalize(cat.name))) continue;
    const score = fuzzyScore(article.nombre_normalizado, cat.name);
    if (!best || score > best.score) {
      best = { name: cat.name, id: cat.id, needsCreate: true, score };
    }
  }

  return best && best.score >= CONFIRM_THRESHOLD ? best : null;
}

export function buildPlan(ticket: ParsedTicket, ctx: MatcherContext): TicketPlan {
  if (ticket.modo === 'B') {
    return buildModoB(ticket, ctx);
  }
  return buildModoA(ticket, ctx);
}

function buildModoA(ticket: ParsedTicketModoA, ctx: MatcherContext): TicketPlan {
  const matches: TicketMatch[] = [];
  for (const article of mergeTicketArticles(ticket.articulos)) {
    const listMatch = matchArticleToList(article, ctx);

    if (listMatch && listMatch.score > AUTO_THRESHOLD) {
      const item = listMatch.item;
      const qty = item.quantity || 1;
      const checkFull = article.cantidad >= qty;
      matches.push({
        article,
        kind: 'auto',
        confidence: listMatch.score,
        candidateName: item.product?.name || article.nombre_normalizado,
        candidateId: item.product_id,
        needsCreate: false,
        listItemId: item.id,
        listQty: qty,
        remainingQty: checkFull ? 0 : Math.max(0, qty - article.cantidad),
        checkFull,
      });
      continue;
    }

    if (listMatch) {
      const item = listMatch.item;
      const qty = item.quantity || 1;
      matches.push({
        article,
        kind: 'confirm',
        confidence: listMatch.score,
        candidateName: item.product?.name || article.nombre_normalizado,
        candidateId: item.product_id,
        needsCreate: false,
        listItemId: item.id,
        listQty: qty,
        remainingQty: 0,
        checkFull: true,
      });
      continue;
    }

    const inventory = matchArticleToInventory(article, ctx);
    if (inventory) {
      matches.push({
        article,
        kind: 'price',
        confidence: inventory.score,
        candidateName: inventory.name,
        candidateId: inventory.id,
        needsCreate: inventory.needsCreate,
        remainingQty: 0,
        checkFull: false,
      });
    } else {
      matches.push({
        article,
        kind: 'new',
        confidence: 0,
        candidateName: article.nombre_normalizado || article.nombre_original,
        candidateId: null,
        needsCreate: true,
        remainingQty: 0,
        checkFull: false,
      });
    }
  }

  return {
    modo: 'A',
    fecha: ticket.fecha,
    total: ticket.total,
    matches,
    toCheckModoB: [],
  };
}

function buildModoB(ticket: ParsedTicketModoB, ctx: MatcherContext): TicketPlan {
  return {
    modo: 'B',
    fecha: ticket.fecha,
    total: ticket.total,
    matches: [],
    toCheckModoB: ctx.listItems.filter((i) => !i.checked && i.store_id === ctx.storeId),
  };
}

// Re-match de un artículo "confirm" cuando el usuario dice que NO es lo mismo:
// cae a PASO 2 (catálogo / producto nuevo).
export function rematchAsInventory(article: TicketArticle, ctx: MatcherContext): TicketMatch {
  const inventory = matchArticleToInventory(article, ctx);
  if (inventory) {
    return {
      article,
      kind: 'price',
      confidence: inventory.score,
      candidateName: inventory.name,
      candidateId: inventory.id,
      needsCreate: inventory.needsCreate,
      remainingQty: 0,
      checkFull: false,
    };
  }
  return {
    article,
    kind: 'new',
    confidence: 0,
    candidateName: article.nombre_normalizado || article.nombre_original,
    candidateId: null,
    needsCreate: true,
    remainingQty: 0,
    checkFull: false,
  };
}