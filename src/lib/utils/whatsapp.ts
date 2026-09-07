import { ListItemEnriched, StoreCategory } from '../types/database';

export const CATEGORY_LABELS: Record<string, string> = {
  supermercado: 'Supermercado',
  verduleria: 'Verdulería',
  carniceria: 'Carnicería',
  otro: 'Otro',
};

export const getCategoryEmoji = (category?: StoreCategory | string | null): string => {
  switch (category) {
    case 'verduleria':
    case 'verdulería':
      return '🥦';
    case 'carniceria':
    case 'carnicería':
      return '🥩';
    case 'supermercado':
      return '🏪';
    case 'otro':
    default:
      return '🏬';
  }
};

export const formatPriceNumber = (price: number): string => {
  return price.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const formatPrice = (price: number): string => {
  return `$${formatPriceNumber(price)}`;
};

export interface WhatsAppExportOptions {
  listName?: string;
  items: ListItemEnriched[];
  includeChecked?: boolean;
  selectedStoreIds?: string[];
}

export const formatQuantityDisplay = (qty: number, unit?: string | null): string => {
  const cleanUnit = (unit || 'unidad').trim().toLowerCase();
  const numStr = Number(qty).toLocaleString('es-AR', { maximumFractionDigits: 2 });

  if (cleanUnit === 'kg' || cleanUnit === 'kilos' || cleanUnit === 'kilo') {
    if (qty === 0.5) return '0.5 kg (½ kg)';
    if (qty === 0.25) return '0.25 kg (¼ kg)';
    return `${numStr} kg`;
  }
  if (cleanUnit === 'g' || cleanUnit === 'gramos' || cleanUnit === 'gr') {
    return `${numStr} g`;
  }
  if (cleanUnit === 'litro' || cleanUnit === 'litros' || cleanUnit === 'l') {
    return `${numStr} L`;
  }
  if (cleanUnit === 'atado' || cleanUnit === 'atados') {
    return `${numStr} atado${qty > 1 ? 's' : ''}`;
  }
  if (cleanUnit === 'paquete' || cleanUnit === 'paquetes' || cleanUnit === 'paq') {
    return `${numStr} paq.`;
  }
  if (cleanUnit === 'lata' || cleanUnit === 'latas') {
    return `${numStr} lata${qty > 1 ? 's' : ''}`;
  }
  // Default: unidades
  return `x${numStr}`;
};

export const formatListName = (rawName?: string | null): string => {
  const clean = (rawName || '').trim();
  if (!clean) return 'Lista: Mandado';
  if (/^lista\s*:/i.test(clean)) {
    const after = clean.replace(/^lista\s*:\s*/i, '').trim();
    const capitalized = after ? after.charAt(0).toUpperCase() + after.slice(1) : 'Mandado';
    return `Lista: ${capitalized}`;
  }
  if (/^lista\s+/i.test(clean)) {
    const after = clean.replace(/^lista\s+/i, '').trim();
    const capitalized = after ? after.charAt(0).toUpperCase() + after.slice(1) : 'Mandado';
    return `Lista: ${capitalized}`;
  }
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `Lista: ${capitalized}`;
};

export const generateWhatsAppShoppingListText = (options: WhatsAppExportOptions): string => {
  const { listName = 'Mandado', items, includeChecked = false, selectedStoreIds } = options;

  // Filter out checked items if requested
  let itemsToExport = includeChecked ? items : items.filter((i) => !i.checked);

  // Filter by selected stores if specified
  if (selectedStoreIds && selectedStoreIds.length > 0) {
    itemsToExport = itemsToExport.filter((i) => {
      const storeId = i.store?.id || 'sin-tienda';
      return selectedStoreIds.includes(storeId);
    });
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTitle = formatListName(listName);
  let message = `🛒 *${formattedTitle} - ${dateStr}*\n\n`;

  // Group items by store
  const storeMap = new Map<string, { storeName: string; category: StoreCategory; items: ListItemEnriched[] }>();

  itemsToExport.forEach((item) => {
    const storeId = item.store?.id || 'sin-tienda';
    const storeName = item.store?.name || 'Otras Tiendas';
    const category = item.store?.category || 'otro';

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        storeName,
        category,
        items: [],
      });
    }

    storeMap.get(storeId)!.items.push(item);
  });

  let grandTotal = 0;

  storeMap.forEach(({ storeName, category, items }) => {
    const emoji = getCategoryEmoji(category);
    message += `${emoji} *${storeName}*\n`;

    items.forEach((item) => {
      const productName = item.product?.name || 'Producto';
      const qty = item.quantity;
      const unit = item.unit ? item.unit.trim().toLowerCase() : '';

      let itemLine = '';
      if (unit === 'kg' || unit === 'kilos' || unit === 'kilo') {
        const qtyFormatted = qty === 0.5 ? '0.5kg (½ kg)' : `${qty}kg`;
        itemLine = `• ${productName} ${qtyFormatted}`;
      } else if (unit === 'g' || unit === 'gramos' || unit === 'gr') {
        itemLine = `• ${productName} ${qty}g`;
      } else if (unit === 'litro' || unit === 'litros' || unit === 'l') {
        itemLine = `• ${productName} ${qty}L`;
      } else if (unit === 'atado' || unit === 'atados') {
        itemLine = `• ${productName} x${qty} atado${qty > 1 ? 's' : ''}`;
      } else if (unit && unit !== 'unidad' && unit !== 'unidades' && unit !== 'u') {
        itemLine = `• ${productName} x${qty} ${unit}`;
      } else {
        // Frutas, verduras o mercadería por unidades (ej: 5 bananas)
        itemLine = qty > 1 ? `• ${productName} x${qty}` : `• ${productName}`;
      }

      message += `${itemLine}\n`;

      // Accumulate price
      if (item.latest_price) {
        grandTotal += Number(item.latest_price) * Number(qty);
      }
    });

    message += '\n';
  });

  if (grandTotal > 0) {
    message += `Estimado total: $${formatPriceNumber(grandTotal)}`;
  }

  return message.trim();
};

export const normalizePhoneForWhatsApp = (rawPhone: string): string => {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (!cleaned) return '';

  // Handle Argentina numbers
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  // If 10 digits without country code (e.g. 2355512260 or 1155554444)
  if (cleaned.length === 10) {
    cleaned = '549' + cleaned;
  } else if (cleaned.startsWith('54') && !cleaned.startsWith('549') && cleaned.length === 12) {
    // 54 + 10 digits -> insert 9 for mobile whatsapp
    cleaned = '549' + cleaned.slice(2);
  }
  return cleaned;
};

export const createWhatsAppUrl = (messageText: string, phone?: string | null): string => {
  const encodedText = encodeURIComponent(messageText);
  if (phone) {
    const cleanPhone = normalizePhoneForWhatsApp(phone);
    if (cleanPhone) {
      // NOTE: Using api.whatsapp.com directly prevents the wa.me 302 redirect bug
      // that replaces 4-byte UTF-8 emoji characters with %EF%BF%BD ()
      return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedText}`;
    }
  }
  return `https://api.whatsapp.com/send/?text=${encodedText}`;
};
