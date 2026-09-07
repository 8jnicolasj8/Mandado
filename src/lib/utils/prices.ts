export interface PriceStatus {
  isOutdated: boolean;
  daysAgo: number;
  formattedDate: string;
  relativeTime: string;
}

export const getPriceStatus = (recordedAt?: string | null): PriceStatus | null => {
  if (!recordedAt) return null;

  const recordedTime = new Date(recordedAt).getTime();
  if (isNaN(recordedTime)) return null;

  const now = Date.now();
  const diffMs = now - recordedTime;
  const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const isOutdated = daysAgo > 7;

  let relativeTime = '';
  if (daysAgo === 0) {
    relativeTime = 'hoy';
  } else if (daysAgo === 1) {
    relativeTime = 'ayer';
  } else {
    relativeTime = `hace ${daysAgo} días`;
  }

  const dateObj = new Date(recordedAt);
  const formattedDate = dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  return {
    isOutdated,
    daysAgo,
    formattedDate,
    relativeTime,
  };
};

export const formatCurrency = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$--';
  }
  return `$${amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};
