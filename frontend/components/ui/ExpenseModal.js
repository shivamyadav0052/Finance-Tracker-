'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';

export default function ExpenseModal({ expense, onSave, onClose }) {
  const [form, setForm] = useState({
    amount: '', category: 'Food', date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'UPI', notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        amount: expense.amount,
        category: expense.category,
        date: expense.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        paymentMethod: expense.paymentMethod,
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount)) return;
    setSaving(true);
    await onSave({ ...form, amount: Number(form.amount) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#11111b] rounded-2xl shadow-xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" required value={form.amount} placeholder="0" min="1"
              onChange={e => set('amount', e.target.value)} className="input text-lg font-semibold" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {/* Payment Method */}
            <div>
              <label className="label">Payment</label>
              <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} className="input">
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input" />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <input type="text" value={form.notes} placeholder="Add a note..."
              onChange={e => set('notes', e.target.value)} className="input" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Saving...' : (expense ? 'Update' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
