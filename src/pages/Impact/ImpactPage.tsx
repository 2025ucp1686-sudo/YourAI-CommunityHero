import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, CheckCircle, Clock, BarChart2, Award, MapPin } from 'lucide-react';
import type { AnalyticsSummary } from '@/types';

const COLORS = ['#00d4ff', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#f97316', '#6366f1', '#94a3b8'];

const mockAnalytics: AnalyticsSummary = {
  totalIssues: 12847,
  resolvedIssues: 9234,
  pendingIssues: 2100,
  inProgressIssues: 1513,
  avgResolutionDays: 6.4,
  categoryBreakdown: {
    pothole: 3840, water_leakage: 2100, garbage: 2560,
    streetlight: 1420, drainage: 1380, road_damage: 890,
    infrastructure: 420, other: 237,
  },
  monthlyTrends: [
    { month: 'Jan', reported: 820, resolved: 680 },
    { month: 'Feb', reported: 940, resolved: 820 },
    { month: 'Mar', reported: 1100, resolved: 920 },
    { month: 'Apr', reported: 1280, resolved: 1040 },
    { month: 'May', reported: 1420, resolved: 1180 },
    { month: 'Jun', reported: 1640, resolved: 1390 },
  ],
  topAreas: [
    { area: 'Koramangala', count: 1240, resolved: 980 },
    { area: 'Indiranagar', count: 980, resolved: 820 },
    { area: 'BTM Layout', count: 840, resolved: 640 },
    { area: 'Whitefield', count: 720, resolved: 580 },
    { area: 'Jayanagar', count: 640, resolved: 520 },
  ],
  severityBreakdown: { low: 4200, medium: 5100, high: 2600, critical: 947 },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-xl p-3 border border-white/10 text-xs">
        <p className="font-semibold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ImpactPage() {
  const [analytics] = useState<AnalyticsSummary>(mockAnalytics);

  const categoryData = Object.entries(analytics.categoryBreakdown).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  const severityData = Object.entries(analytics.severityBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  const resolutionRate = Math.round((analytics.resolvedIssues / analytics.totalIssues) * 100);

  return (
    <div className="page-container">
      <div className="section-container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="font-display font-bold text-3xl text-gradient mb-2">Impact Dashboard</h1>
          <p className="text-gray-400">Platform-wide civic impact metrics and analytics</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Reports', value: analytics.totalIssues.toLocaleString(), icon: BarChart2, color: 'text-neon-blue', bg: 'from-cyan-500/10 to-blue-600/10', border: 'border-cyan-500/20', sub: '+12% this month' },
            { label: 'Resolved', value: analytics.resolvedIssues.toLocaleString(), icon: CheckCircle, color: 'text-green-400', bg: 'from-green-500/10 to-emerald-600/10', border: 'border-green-500/20', sub: `${resolutionRate}% resolution rate` },
            { label: 'In Progress', value: analytics.inProgressIssues.toLocaleString(), icon: TrendingUp, color: 'text-orange-400', bg: 'from-orange-500/10 to-red-600/10', border: 'border-orange-500/20', sub: 'Being handled' },
            { label: 'Avg Resolution', value: `${analytics.avgResolutionDays}d`, icon: Clock, color: 'text-neon-purple', bg: 'from-purple-500/10 to-violet-600/10', border: 'border-purple-500/20', sub: '-1.2d vs last month' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`stat-card bg-gradient-to-br ${kpi.bg} border ${kpi.border}`}>
              <div className="flex items-center justify-between mb-3">
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div className={`font-display font-bold text-2xl md:text-3xl ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
              <div className="text-xs text-gray-600 mt-1">{kpi.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Resolution Rate Visual */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-sm mb-4 text-white">Overall Resolution Rate</h2>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-display font-black text-gradient">{resolutionRate}%</div>
            <div className="flex-1">
              <div className="h-4 bg-dark-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${resolutionRate}%` }}
                  transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-neon-gradient rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0%</span>
                <span className="text-green-400 font-semibold">{analytics.resolvedIssues.toLocaleString()} resolved</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trend */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-sm mb-4">Monthly Trends</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.monthlyTrends}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="reported" stroke="#00d4ff" fill="url(#colorReported)" name="Reported" dot={false} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolved)" name="Resolved" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-sm mb-4">Category Breakdown</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ fontSize: 11, color: '#9ca3af' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Problem Areas */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <MapPin size={14} className="text-neon-blue" /> Top Problem Areas
            </h2>
            <div className="space-y-3">
              {analytics.topAreas.map((area, i) => (
                <div key={area.area}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium">{area.area}</span>
                    <span className="text-gray-500">{area.count} reports</span>
                  </div>
                  <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(area.resolved / area.count) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                      className="h-full bg-neon-gradient rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{area.resolved} resolved ({Math.round((area.resolved / area.count) * 100)}%)</p>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-sm mb-4">Severity Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData} layout="vertical">
                <XAxis type="number" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Issues" radius={[0, 6, 6, 0]}>
                  {severityData.map((_, idx) => (
                    <Cell key={idx} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][idx]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
