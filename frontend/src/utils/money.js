export const DEFAULT_CURRENCY = (import.meta.env.VITE_STRIPE_CURRENCY || 'USD').toUpperCase();

export function formatMoney(amount, currency = DEFAULT_CURRENCY) {
  const safeCurrency = /^[A-Z]{3}$/.test(String(currency || '').toUpperCase())
    ? String(currency).toUpperCase()
    : DEFAULT_CURRENCY;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${Number(amount || 0).toFixed(2)} ${safeCurrency}`;
  }
}
