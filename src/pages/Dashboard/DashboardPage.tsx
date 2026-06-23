import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Trophy, Star, TrendingUp,
  MapPin, Clock, Zap, Award, Activity, Plus, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMockIssues } from '@/services/issueService';
import type { Issue } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const categoryColors: Record<string, string> = {
  pothole: 'badge-yellow',
  water_leakage: 'badge-blue',
  garbage: 'badge-red',
  streetlight: 'badge-yellow',
  drainage: 'badge-blue',
  road_damage: 'badge-red',
  infrastructure: 'badge-purple',
  other: 'badge-purple',
};

const statusColors: Record<string, string> = {
  reported: 'text-yellow-400 bg-yellow-400/10',
  verified: 'text-blue-400 bg-blue-400/10',
  assigned: 'text-purple-400 bg-purple-400/10',
  in_progress: 'text-orange-400 bg-orange-400/10',
  resolved: 'text-green-400 bg-green-400/10',
};

const badgeEmoji: Record<string, string> = {
  citizen: '🏅',
  hero: '🦸',
  community_champion: '🏆',
  guardian: '🛡️',
  first_reporter: '⭐',
  verifier: '✅',
  problem_solver: '💡',
};

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);

  useEffect(() => {
    setRecentIssues(getMockIssues().slice(0, 4));
  }, []);

  const stats = [
    { label: 'Points Earned', value: userProfile?.points ?? 450, icon: Zap, color: 'text-neon-blue', bg: 'from-cyan-500/10 to-blue-600/10', border: 'border-cyan-500/20' },
    { label: 'Issues Reported', value: userProfile?.issuesReported ?? 7, icon: AlertTriangle, color: 'text-yellow-400', bg: 'from-yellow-500/10 to-orange-600/10', border: 'border-yellow-500/20' },
    { label: 'Verified', value: userProfile?.issuesVerified ?? 23, icon: CheckCircle, color: 'text-green-400', bg: 'from-green-500/10 to-emerald-600/10', border: 'border-green-500/20' },
    { label: 'Community Rank', value: `#${userProfile?.communityRank ?? 142}`, icon: Trophy, color: 'text-neon-purple', bg: 'from-purple-500/10 to-violet-600/10', border: 'border-purple-500/20' },
  ];

  return (
    <div className="page-container">
      <div className="section-container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-white mb-1">
              Welcome back,{' '}
              <span className="text-gradient">{userProfile?.displayName?.split(' ')[0] || 'Hero'}!</span>
            </h1>
            <p className="text-gray-400 flex items-center gap-1.5">
              <MapPin size={14} /> {userProfile?.city || 'Your City'} • Community Hero Dashboard
            </p>
          </div>
          <Link to="/report" className="btn-primary text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} /> Report Issue
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`stat-card bg-gradient-to-br ${stat.bg} border ${stat.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={20} className={stat.color} />
                <TrendingUp size={14} className="text-gray-600" />
              </div>
              <div className={`font-display font-bold text-2xl md:text-3xl ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Issues */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-neon-blue" />
                  <span className="font-semibold text-sm">Recent Community Issues</span>
                </div>
                <Link to="/community" className="text-xs text-neon-blue hover:underline">View All</Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    to={`/tracking/${issue.id}`}
                    className="flex items-start gap-3 p-4 hover:bg-white/3 transition-colors"
                  >
                    <div className={`mt-0.5 p-2 rounded-lg ${statusColors[issue.status]} flex-shrink-0`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={categoryColors[issue.category]}>{issue.category.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{issue.location.address}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[issue.status]}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(issue.createdAt, { addSuffix: true })}
                        </span>
                        <span className="text-xs text-gray-600">
                          ✓ {issue.verificationCount} verified
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Badges & Profile */}
          <div className="space-y-5">
            {/* Profile Card */}
            <div className="glass-card rounded-2xl p-5 border border-neon-purple/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg font-bold">
                  {userProfile?.displayName?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-bold text-white">{userProfile?.displayName || 'Community Hero'}</p>
                  <p className="text-xs text-gray-500">{userProfile?.city || 'India'}</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Level Progress</span>
                  <span>{userProfile?.points ?? 450} / 1000 pts</span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((userProfile?.points ?? 450) / 1000) * 100, 100)}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-neon-gradient rounded-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="glass-card rounded-lg p-2">
                  <p className="font-bold text-neon-blue">{userProfile?.issuesReported ?? 7}</p>
                  <p className="text-xs text-gray-500">Reported</p>
                </div>
                <div className="glass-card rounded-lg p-2">
                  <p className="font-bold text-green-400">{userProfile?.issuesVerified ?? 23}</p>
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award size={16} className="text-neon-yellow" />
                <span className="font-semibold text-sm">Badges Earned</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(userProfile?.badges || ['citizen', 'first_reporter']).map((badge) => (
                  <div key={badge} className="flex flex-col items-center gap-1 p-2 rounded-xl glass-card border border-white/5 hover:border-neon-purple/30 transition-colors cursor-default">
                    <span className="text-2xl">{badgeEmoji[badge] || '🏅'}</span>
                    <span className="text-xs text-gray-400 text-center leading-tight">
                      {badge.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {/* Locked badges */}
                {['hero', 'community_champion', 'guardian'].map((badge) => (
                  <div key={badge} className="flex flex-col items-center gap-1 p-2 rounded-xl glass-card border border-white/5 opacity-40">
                    <span className="text-2xl grayscale">🔒</span>
                    <span className="text-xs text-gray-600 text-center leading-tight">
                      {badge.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-5">
              <span className="font-semibold text-sm mb-3 block">Quick Actions</span>
              <div className="space-y-2">
                {[
                  { label: 'Report Issue', to: '/report', icon: AlertTriangle, color: 'text-yellow-400' },
                  { label: 'View Live Map', to: '/map', icon: MapPin, color: 'text-neon-blue' },
                  { label: 'Community Feed', to: '/community', icon: Shield, color: 'text-neon-purple' },
                  { label: 'AI Insights', to: '/insights', icon: Zap, color: 'text-neon-green' },
                ].map(({ label, to, icon: Icon, color }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm text-gray-400 hover:text-white">
                    <Icon size={14} className={color} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
