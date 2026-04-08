export const CATEGORIES = [
  'Food', 'Rent', 'Shopping', 'Transport', 'Health',
  'Entertainment', 'Education', 'Travel', 'Utilities', 'Other'
];

export const PAYMENT_METHODS = [
  'UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet'
];

export const CATEGORY_ICONS = {
  Food: '🍔', Rent: '🏠', Shopping: '🛍️', Transport: '🚗',
  Health: '💊', Entertainment: '🎬', Education: '📚',
  Travel: '✈️', Utilities: '💡', Other: '📦'
};

export const CATEGORY_COLORS = {
  Food: '#22c55e', Rent: '#3b82f6', Shopping: '#f59e0b',
  Transport: '#8b5cf6', Health: '#ef4444', Entertainment: '#ec4899',
  Education: '#06b6d4', Travel: '#f97316', Utilities: '#64748b', Other: '#6b7280'
};

export const CHART_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444',
  '#ec4899', '#06b6d4', '#f97316', '#64748b', '#10b981'
];

export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const currentMonth = () => new Date().toISOString().slice(0, 7);
