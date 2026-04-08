'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Brain, RefreshCw, Lightbulb, AlertTriangle, TrendingUp, CheckCircle, Info } from 'lucide-react';

const typeConfig = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', iconColor: 'text-amber-500' },
  tip:     { icon: Lightbulb,   bg: 'bg-blue-50 dark:bg-blue-900/10',   border: 'border-blue-200 dark:border-blue-800',   text: 'text-blue-700 dark:text-blue-400',   iconColor: 'text-blue-500' },
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', iconColor: 'text-green-500' },
  info:    { icon: Info,        bg: 'bg-gray-50 dark:bg-gray-800/50',   border: 'border-gray-200 dark:border-gray-700',   text: 'text-gray-700 dark:text-gray-300',   iconColor: 'text-gray-400' },
};

function SuggestionCard({ suggestion, index }) {
  const cfg = typeConfig[suggestion.type] || typeConfig.info;
  const Icon = cfg.icon;
  return (
    <div className={`border rounded-2xl p-4 ${cfg.bg} ${cfg.border} animate-slide-up`}
      style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
        <div>
          {suggestion.icon && <span className="mr-1">{suggestion.icon}</span>}
          <span className={`text-sm leading-relaxed ${cfg.text}`}>{suggestion.message}</span>
        </div>
      </div>
    </div>
  );
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/suggestions');
      setSuggestions(data.suggestions || []);
      setMeta({ count: data.analyzed_count, source: data.source, time: data.generated_at });
      setLoaded(true);
    } catch (err) {
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuggestions(); }, []);

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Suggestions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Powered by Python + Pandas — analyzing last 30 days</p>
          </div>
          <button onClick={fetchSuggestions} disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Hero banner */}
        <div className="card bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 border-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Smart Spending Analysis</p>
              <p className="text-green-100 text-sm mt-0.5">
                {meta ? `Analyzed ${meta.count} transactions · via ${meta.source}` : 'Click Refresh to analyze your spending'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Analyzing your expenses with Pandas...</p>
          </div>
        )}

        {/* Suggestions */}
        {!loading && loaded && (
          <>
            {suggestions.length === 0 ? (
              <div className="card text-center py-10">
                <Brain className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No suggestions yet. Add more expenses to get insights.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} index={i} />
                ))}
              </div>
            )}

            {/* Tips footer */}
            <div className="card !bg-gray-50 dark:!bg-gray-800/30 border-dashed">
              <p className="text-xs text-gray-400 text-center">
                💡 Suggestions are based on your last 30 days of spending. Add more expenses for better insights.
              </p>
            </div>
          </>
        )}

        {!loading && !loaded && (
          <div className="card text-center py-12">
            <Brain className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Ready to analyze</p>
            <p className="text-gray-400 text-sm mt-1">Click Refresh to get personalized suggestions</p>
            <button onClick={fetchSuggestions} className="btn-primary mt-4 mx-auto">
              Analyze My Spending
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
