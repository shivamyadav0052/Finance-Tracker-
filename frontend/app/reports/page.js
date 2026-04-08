'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatCurrency, CATEGORY_ICONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, Calendar, TrendingUp, Tag, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/monthly');
      setReports(data.reports);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/reports/generate');
      toast.success('Report generated!');
      fetchReports();
    } catch { toast.error('Failed to generate'); }
    finally { setGenerating(false); }
  };

  // Chart data from reports
  const chartData = [...reports].reverse().map(r => ({
    month: r.month,
    total: r.total_spent
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">SQL-powered monthly summaries (last 3 months)</p>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Refresh Report'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">No reports yet. Click "Refresh Report" to generate one.</p>
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            {chartData.length > 1 && (
              <div className="card">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending Overview</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={v => formatCurrency(v)} />
                    <Bar dataKey="total" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Report Cards */}
            <div className="space-y-4">
              {reports.map((r, i) => {
                const rd = r.report_data || {};
                const catBreakdown = Object.entries(rd.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);
                return (
                  <div key={r.id} className="card animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <h2 className="font-bold text-gray-900 dark:text-white">{r.month}</h2>
                        {i === 0 && <span className="badge bg-green-50 dark:bg-green-900/20 text-green-600 text-xs">Current</span>}
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(r.total_spent)}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs text-gray-400 font-medium">Top Category</p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {CATEGORY_ICONS[r.top_category]} {r.top_category || '—'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs text-gray-400 font-medium">Categories Used</p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{catBreakdown.length}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          <p className="text-xs text-gray-400 font-medium">Over Budget</p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {r.overbudget_categories?.length
                            ? r.overbudget_categories.join(', ')
                            : '✅ None'}
                        </p>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    {catBreakdown.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Category Breakdown</p>
                        <div className="space-y-1.5">
                          {catBreakdown.map(([cat, amt]) => {
                            const pct = r.total_spent > 0 ? (amt / r.total_spent * 100) : 0;
                            return (
                              <div key={cat} className="flex items-center gap-3">
                                <span className="text-sm w-5">{CATEGORY_ICONS[cat]}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-300 w-24 truncate">{cat}</span>
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 w-16 text-right">{formatCurrency(amt)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
