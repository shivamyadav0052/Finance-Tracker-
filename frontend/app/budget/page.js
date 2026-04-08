'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { CATEGORIES, CATEGORY_ICONS, formatCurrency, currentMonth } from '@/lib/constants';
import toast from 'react-hot-toast';
import { Plus, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

function AlertBadge({ alert }) {
  if (alert === 'exceeded') return (
    <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
      <XCircle className="w-3 h-3" /> Over Budget
    </span>
  );
  if (alert === 'warning') return (
    <span className="badge bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
      <AlertTriangle className="w-3 h-3" /> 80%+ Used
    </span>
  );
  return (
    <span className="badge bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
      <CheckCircle className="w-3 h-3" /> On Track
    </span>
  );
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'Food', limit: '' });
  const [saving, setSaving] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/budgets', { params: { month } });
      setBudgets(data.budgets);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, [month]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.limit || isNaN(form.limit)) { toast.error('Enter a valid limit'); return; }
    setSaving(true);
    try {
      await api.post('/budgets', { ...form, limit: Number(form.limit), month });
      toast.success('Budget saved!');
      setForm(p => ({ ...p, limit: '' }));
      fetchBudgets();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget removed');
      fetchBudgets();
    } catch { toast.error('Failed'); }
  };

  const existingCategories = budgets.map(b => b.category);
  const availableCategories = CATEGORIES.filter(c => !existingCategories.includes(c));

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Budget Limits</h1>
            <p className="text-sm text-gray-500 mt-0.5">Set and monitor monthly spending limits</p>
          </div>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input w-auto text-sm" />
        </div>

        {/* Add budget form */}
        {availableCategories.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Add Budget</h2>
            <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="input flex-1 min-w-32 text-sm">
                {availableCategories.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="relative flex-1 min-w-32">
                <span className="absolute left-3 top-2.5 text-sm text-gray-400">₹</span>
                <input type="number" placeholder="Monthly limit" value={form.limit} min="1"
                  onChange={e => setForm(p => ({ ...p, limit: e.target.value }))}
                  className="input pl-7 text-sm" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Set
              </button>
            </form>
          </div>
        )}

        {/* Budget list */}
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : budgets.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400 text-sm">No budgets set for {month}</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Use the form above to add category limits</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map(b => {
              const pct = Math.min(Number(b.percentage), 100);
              const barColor = b.alert === 'exceeded' ? '#ef4444' : b.alert === 'warning' ? '#f59e0b' : '#22c55e';
              return (
                <div key={b._id} className="card animate-fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{CATEGORY_ICONS[b.category]}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{b.category}</p>
                        <AlertBadge alert={b.alert} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(b.spent)}</p>
                        <p className="text-xs text-gray-400">of {formatCurrency(b.limit)}</p>
                      </div>
                      <button onClick={() => handleDelete(b._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{b.percentage}% used · {formatCurrency(b.limit - b.spent)} remaining</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
