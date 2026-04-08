'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatCurrency, CATEGORY_ICONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import { Shield, Users, Receipt, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, usRes] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/users')
        ]);
        setOverview(ovRes.data);
        setUsers(usRes.data.users);
      } catch (err) {
        if (err.response?.status === 403) toast.error('Admin access required');
        else toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-gray-500">Platform-wide analytics</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: overview?.totalUsers, icon: Users, color: 'blue' },
            { label: 'Total Expenses', value: overview?.totalExpenses, icon: Receipt, color: 'purple' },
            { label: 'Total Spent', value: formatCurrency(overview?.totalSpent), icon: DollarSign, color: 'green' },
            { label: 'Avg per User', value: overview?.totalUsers ? formatCurrency(overview.totalSpent / overview.totalUsers) : '—', icon: TrendingUp, color: 'orange' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value ?? 0}</p>
              <Icon className={`w-4 h-4 text-${color}-400 mt-2`} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800">
          {['overview', 'users'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px capitalize
                ${tab === t ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Categories (All Users)</h2>
            <div className="space-y-3">
              {(overview?.topCategories || []).map((c, i) => {
                const pct = overview.totalSpent > 0 ? (c.total / overview.totalSpent * 100) : 0;
                return (
                  <div key={c._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{CATEGORY_ICONS[c._id]} {c._id}</span>
                      <span className="text-gray-500">{formatCurrency(c.total)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!overview?.topCategories?.length && <p className="text-sm text-gray-400">No data yet</p>}
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="card !p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-right">Expenses</th>
                  <th className="px-4 py-3 text-right">Total Spent</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'admin' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">{u.expenseCount}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(u.totalSpent)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
