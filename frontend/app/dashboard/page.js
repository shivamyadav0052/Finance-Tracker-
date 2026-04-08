'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatCurrency, CATEGORY_COLORS, CHART_COLORS, CATEGORY_ICONS } from '@/lib/constants';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, CreditCard, ShoppingBag, Wallet, AlertCircle } from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color = 'green', trend }) {
  return (
    <div className="card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/20`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const pieData = data?.categoryBreakdown?.map(c => ({
    name: c._id, value: c.total, color: CATEGORY_COLORS[c._id] || '#6b7280'
  })) || [];

  const lineData = data?.dailySpending?.map(d => ({
    date: d._id?.slice(5), total: Math.round(d.total)
  })) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.month}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Spent" value={formatCurrency(data?.totalSpent)} sub="This month" icon={Wallet} color="green" />
          <StatCard label="Top Category" value={data?.topCategory?._id || '—'} sub={formatCurrency(data?.topCategory?.total)} icon={ShoppingBag} color="orange" />
          <StatCard label="Transactions" value={data?.recentExpenses?.length || 0} sub="Recent entries" icon={CreditCard} color="blue" />
          <StatCard label="Daily Avg" value={formatCurrency((data?.totalSpent || 0) / 30)} sub="Per day" icon={TrendingUp} color="purple" />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Category</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => `${CATEGORY_ICONS[v] || ''} ${v}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 text-center py-12">No data yet</p>}
          </div>

          {/* Line Chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending Trend (30 days)</h2>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 text-center py-12">No data yet</p>}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top payment methods */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Payment Methods</h2>
            <div className="space-y-3">
              {(data?.paymentMethods || []).map((pm, i) => {
                const pct = data?.totalSpent ? (pm.total / data.totalSpent * 100) : 0;
                return (
                  <div key={pm._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{pm._id}</span>
                      <span className="text-gray-500">{formatCurrency(pm.total)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
              {!data?.paymentMethods?.length && <p className="text-sm text-gray-400">No data yet</p>}
            </div>
          </div>

          {/* Recent expenses */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Expenses</h2>
            <div className="space-y-2.5">
              {(data?.recentExpenses || []).map(e => (
                <div key={e._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{CATEGORY_ICONS[e.category] || '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{e.category}</p>
                      <p className="text-xs text-gray-400">{e.notes || e.paymentMethod}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(e.amount)}</p>
                </div>
              ))}
              {!data?.recentExpenses?.length && <p className="text-sm text-gray-400">No recent expenses</p>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
