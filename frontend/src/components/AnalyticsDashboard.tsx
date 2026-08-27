import React from 'react';
import { AnalyticsData } from '../types';
import { BarChart2, Flame, Award, Calendar, CheckCircle2, BookOpen } from 'lucide-react';

interface AnalyticsDashboardProps {
  data: AnalyticsData | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  if (!data) return null;

  const maxDueCount = Math.max(1, ...data.forecast_next_7_days.map((d) => d.due_count));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-coral-500" /> Retention & Mastery Dashboard
        </h2>
        <p className="text-slate-400 text-xs">Track active recall accuracy, review forecasts, and card maturity curves.</p>
      </div>

      {/* Overview Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Retention % */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">30-Day Retention</p>
            <h3 className="text-3xl font-heading font-extrabold text-emerald-400 mt-1">
              {data.retention_rate_pct}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Target: &gt; 85%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Streak */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Daily Battle Streak</p>
            <h3 className="text-3xl font-heading font-extrabold text-amber-400 mt-1">
              {data.streak_count} Days
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Active daily streak</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Mastered */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Cards Mastered</p>
            <h3 className="text-3xl font-heading font-extrabold text-coral-400 mt-1">
              {data.total_cards_mastered}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Interval &gt; 21 days</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-coral-500/20 text-coral-400 flex items-center justify-center border border-coral-500/30">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Learning */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">In Learning / New</p>
            <h3 className="text-3xl font-heading font-extrabold text-white mt-1">
              {data.total_cards_learning + data.total_cards_new}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">{data.total_cards_new} new cards</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 7-Day Review Forecast Bar Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> 7-Day Review Workload Forecast
          </h3>
          <span className="text-xs text-slate-400 font-mono">SM-2 Algorithm Queue</span>
        </div>

        <div className="grid grid-cols-7 gap-3 pt-6 items-end h-56">
          {data.forecast_next_7_days.map((item, idx) => {
            const heightPercent = Math.max(10, (item.due_count / maxDueCount) * 100);
            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-xs font-mono font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.due_count}
                </span>

                <div
                  className="w-full bg-slate-950 rounded-2xl p-1 border border-slate-800 flex items-end overflow-hidden"
                  style={{ height: '80%' }}
                >
                  <div
                    className="w-full bg-gradient-to-t from-coral-600 to-amber-400 rounded-xl transition-all duration-500 shadow-lg shadow-coral-500/20 group-hover:brightness-125"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <div className="text-center">
                  <span className="block text-xs font-bold text-white">{item.day}</span>
                  <span className="block text-[10px] text-slate-500 font-mono">{item.date.slice(5)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
