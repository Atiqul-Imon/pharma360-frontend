const CURRENCY_SYMBOL = '৳';

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) {
    return `${CURRENCY_SYMBOL} 0.00`;
  }
  return `${CURRENCY_SYMBOL} ${numberFormatter.format(value)}`;
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) {
    return '--';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return dateFormatter.format(date);
};

export const parseNumberInput = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const sanitized = value
    .toString()
    .trim()
    .replace(/[^\d.-]/g, '')
    .replace(/(?!^)-/g, '');

  if (!sanitized) {
    return 0;
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default {
  formatCurrency,
  formatDate,
  parseNumberInput,
};

