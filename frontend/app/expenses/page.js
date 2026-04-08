'use client';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ExpenseModal from '@/components/ui/ExpenseModal';
import api from '@/lib/api';
import { formatCurrency, formatDate, CATEGORIES, PAYMENT_METHODS, CATEGORY_ICONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Filter, Download } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | expense obj
  const [filters, setFilters] = useState({ category: '', paymentMethod: '', startDate: '', endDate: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      // Remove empty
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/expenses', { params });
      setExpenses(data.expenses);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSave = async (form) => {
    try {
      if (modal?._id) {
        await api.put(`/expenses/${modal._id}`, form);
        toast.success('Updated!');
      } else {
        await api.post('/expenses', form);
        toast.success('Added!');
      }
      setModal(null);
      fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted');
      fetchExpenses();
    } catch { toast.error('Failed to delete'); }
  };

  const exportCSV = () => {
    if (!expenses.length) return;
    const cols = ['Date', 'Category', 'Amount', 'Payment', 'Notes'];
    const rows = expenses.map(e => [formatDate(e.date), e.category, e.amount, e.paymentMethod, e.notes || '']);
    const csv = [cols, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'expenses.csv';
    a.click();
  };

  const setFilter = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };
  const clearFilters = () => { setFilters({ category: '', paymentMethod: '', startDate: '', endDate: '', search: '' }); setPage(1); };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expenses</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total records</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="card !p-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input placeholder="Search expenses..." value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
                className="input pl-9 py-2" />
            </div>
            <button onClick={() => setShowFilters(p => !p)} className="btn-secondary flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" />
              Filters {Object.values(filters).some(Boolean) && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            </button>
            {Object.values(filters).some(Boolean) && (
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-600 px-2">Clear</button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input text-sm">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={filters.paymentMethod} onChange={e => setFilter('paymentMethod', e.target.value)} className="input text-sm">
                <option value="">All Payment</option>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
              <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} className="input text-sm" placeholder="From" />
              <input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} className="input text-sm" placeholder="To" />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card !p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No expenses found</p>
              <button onClick={() => setModal('add')} className="btn-primary mt-3 text-sm">Add your first expense</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-left">Payment</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {expenses.map(e => (
                    <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                          {CATEGORY_ICONS[e.category]} {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 max-w-32 truncate">{e.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{e.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setModal(e)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                            <Pencil className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button onClick={() => handleDelete(e._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 disabled:opacity-40">← Prev</button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ExpenseModal
          expense={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </AppLayout>
  );
}
