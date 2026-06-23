import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, MapPin, AlertTriangle, Lightbulb, RefreshCw, Calendar } from 'lucide-react';
import { generatePredictiveInsights } from '@/services/geminiService';
import type { PredictiveInsight } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const mockInsight: PredictiveInsight = {
  id: 'insight-1',
  title: 'June Community Intelligence Report',
  description: 'Analysis of 12,847 reported civic issues reveals significant infrastructure stress in urban corridors. Monsoon preparedness is critically low across 3 major wards with drainage and road damage issues surging by 38% compared to last season.',
  affectedAreas: ['Koramangala', 'Indiranagar', 'BTM Layout', 'Electronic City'],
  emergingIssues: ['Storm drain blockages (pre-monsoon)', 'Road deterioration from heat cycles', 'Streetlight outages in new residential zones'],
  monthlyForecast: 'Expect 45% increase in water leakage and drainage reports through July-September. Road damage reports projected to peak at 1,800+ monthly by August due to monsoon impact on already-stressed road surfaces.',
  preventiveActions: [
    'Launch pre-monsoon drain cleaning drives in 15 identified hotspot wards',
    'Emergency road patching program for 340 identified critical potholes',
    'Streetlight audit and replacement for 120 outage-prone zones',
    'Community awareness campaign on garbage segregation near storm drains',
    'Deploy rapid response teams to top 5 issue-dense neighborhoods',
  ],
  generatedAt: new Date(),
  confidence: 0.87,
};

export default function InsightsPage() {
  const [insight, setInsight] = useState<PredictiveInsight>(mockInsight);
  const [loading, setLoading] = useState(false);

  const regenerate = async () => {
    setLoading(true);
    try {
      const newInsight = await generatePredictiveInsights({
        totalIssues: 12847,
        categoryBreakdown: {
          pothole: 3840, water_leakage: 2100, garbage: 2560,
          streetlight: 1420, drainage: 1380, road_damage: 890,
          infrastructure: 420, other: 237,
        },
        topAreas: [
          { area: 'Koramangala', count: 1240 },
          { area: 'Indiranagar', count: 980 },
          { area: 'BTM Layout', count: 840 },
        ],
        monthlyTrends: [
          { month: 'Apr', reported: 1280, resolved: 1040 },
          { month: 'May', reported: 1420, resolved: 1180 },
          { month: 'Jun', reported: 1640, resolved: 1390 },
        ],
      });
      setInsight(newInsight);
      toast.success('🤖 New AI insights generated!');
    } catch {
      toast.error('Failed to generate insights. Using cached data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="section-container max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain size={24} className="text-neon-purple" />
              <h1 className="font-display font-bold text-3xl text-gradient">AI Predictive Insights</h1>
            </div>
            <p className="text-gray-400">Gemini-powered civic intelligence for proactive governance</p>
          </div>
          <button
            onClick={regenerate}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Generating...' : 'Regenerate with AI'}
          </button>
        </motion.div>

        {/* Main Insight Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl overflow-hidden mb-6 border border-neon-purple/20"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-neon-purple/10 to-neon-blue/5 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-neon-purple" />
                  <span className="text-xs text-neon-purple font-semibold uppercase tracking-wider">Gemini Intelligence Report</span>
                </div>
                <h2 className="font-bold text-xl text-white mb-1">{insight.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {format(insight.generatedAt, 'MMM d, yyyy h:mm a')}</span>
                  <span className="badge-purple">{Math.round(insight.confidence * 100)}% confidence</span>
                </div>
              </div>
              <div className="text-4xl">🧠</div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-300 leading-relaxed mb-6 text-sm">{insight.description}</p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Affected Areas */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-neon-blue" />
                  <span className="font-semibold text-sm text-white">Most Affected Areas</span>
                </div>
                <div className="space-y-2">
                  {insight.affectedAreas.map((area, i) => (
                    <motion.div
                      key={area}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 glass-card rounded-lg p-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center text-xs font-bold text-neon-blue">
                        {i + 1}
                      </div>
                      <span className="text-sm text-white">{area}</span>
                      <div className="ml-auto h-1.5 w-16 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neon-blue/60 rounded-full"
                          style={{ width: `${100 - i * 15}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Emerging Issues */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  <span className="font-semibold text-sm text-white">Emerging Issues</span>
                </div>
                <div className="space-y-2">
                  {insight.emergingIssues.map((issue, i) => (
                    <motion.div
                      key={issue}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 glass-card rounded-lg p-3"
                    >
                      <span className="text-yellow-400 mt-0.5">⚠️</span>
                      <span className="text-sm text-gray-300">{issue}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Monthly Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-6 border border-neon-blue/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-neon-blue" />
            <h2 className="font-semibold text-white">Monthly Forecast</h2>
          </div>
          <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/15">
            <p className="text-gray-300 text-sm leading-relaxed">{insight.monthlyForecast}</p>
          </div>
        </motion.div>

        {/* Preventive Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 border border-neon-green/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-neon-green" />
            <h2 className="font-semibold text-white">Suggested Preventive Actions</h2>
            <span className="ml-auto badge-green">AI Recommended</span>
          </div>
          <div className="space-y-3">
            {insight.preventiveActions.map((action, i) => (
              <motion.div
                key={action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl glass-card border border-white/5 hover:border-neon-green/20 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-neon-green/20 border border-neon-green/30 flex items-center justify-center text-xs font-bold text-neon-green flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-300">{action}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
