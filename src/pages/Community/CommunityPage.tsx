import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ThumbsUp, MessageSquare, Users, MapPin, Clock, Filter,
  AlertTriangle, CheckCircle, ChevronDown, Search
} from 'lucide-react';
import { getMockIssues, addVerification } from '@/services/issueService';
import { useAuth } from '@/contexts/AuthContext';
import type { Issue, IssueCategory, IssueSeverity } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const categoryEmoji: Record<string, string> = {
  pothole: '🕳️', water_leakage: '💧', garbage: '🗑️',
  streetlight: '💡', drainage: '🌊', road_damage: '🚧',
  infrastructure: '🏗️', other: '📋',
};

const severityColor: Record<string, string> = {
  low: 'badge-green', medium: 'badge-yellow', high: 'badge-red', critical: 'badge-red',
};

const statusColor: Record<string, string> = {
  reported: 'text-yellow-400',
  verified: 'text-blue-400',
  assigned: 'text-purple-400',
  in_progress: 'text-orange-400',
  resolved: 'text-green-400',
};

export default function CommunityPage() {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filtered, setFiltered] = useState<Issue[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<IssueCategory | 'all'>('all');
  const [filterSev, setFilterSev] = useState<IssueSeverity | 'all'>('all');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const data = getMockIssues();
    setIssues(data);
    setFiltered(data);
  }, []);

  useEffect(() => {
    let result = issues;
    if (search) result = result.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'all') result = result.filter((i) => i.category === filterCat);
    if (filterSev !== 'all') result = result.filter((i) => i.severity === filterSev);
    setFiltered(result);
  }, [search, filterCat, filterSev, issues]);

  const handleVerify = async (issue: Issue) => {
    if (!currentUser) { toast.error('Please login to verify'); return; }
    if (votedIds.has(issue.id)) { toast.error('Already verified!'); return; }
    try {
      await addVerification(issue.id, currentUser.uid, true);
      setVotedIds((prev) => new Set([...prev, issue.id]));
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, verificationCount: i.verificationCount + 1, upvoteCount: i.upvoteCount + 1 } : i));
      toast.success('✅ Verified! +10 points earned!');
    } catch {
      // Demo mode - just update local state
      setVotedIds((prev) => new Set([...prev, issue.id]));
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, verificationCount: i.verificationCount + 1, upvoteCount: i.upvoteCount + 1 } : i));
      toast.success('✅ Verified! +10 points earned!');
    }
  };

  return (
    <div className="page-container">
      <div className="section-container">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="font-display font-bold text-3xl text-gradient mb-2">Community Issues</h1>
          <p className="text-gray-400">Verify and upvote issues reported by citizens near you</p>
        </motion.div>

        {/* Search & Filter */}
        <div className="glass-card rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as any)}
            className="input-field text-sm w-auto"
          >
            <option value="all">All Categories</option>
            {['pothole', 'water_leakage', 'garbage', 'streetlight', 'drainage', 'road_damage', 'infrastructure', 'other'].map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={filterSev}
            onChange={(e) => setFilterSev(e.target.value as any)}
            className="input-field text-sm w-auto"
          >
            <option value="all">All Severity</option>
            {['low', 'medium', 'high', 'critical'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Issues', value: issues.length, color: 'text-neon-blue' },
            { label: 'Pending Verification', value: issues.filter((i) => i.status === 'reported').length, color: 'text-yellow-400' },
            { label: 'Resolved', value: issues.filter((i) => i.status === 'resolved').length, color: 'text-green-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
              <p className={`font-display font-bold text-xl ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Issue List */}
        <div className="space-y-4">
          {filtered.map((issue, idx) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card-hover rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                {/* Emoji */}
                <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center text-2xl flex-shrink-0">
                  {categoryEmoji[issue.category]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link to={`/tracking/${issue.id}`} className="font-semibold text-white hover:text-neon-blue transition-colors">
                      {issue.title}
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={severityColor[issue.severity]}>{issue.severity}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">{issue.description}</p>

                  {/* AI Analysis Summary */}
                  {issue.geminiAnalysis && (
                    <div className="bg-neon-purple/5 border border-neon-purple/15 rounded-lg px-3 py-1.5 mb-3 text-xs text-gray-400">
                      🤖 AI: {issue.geminiAnalysis.summary}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {issue.location.address}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {formatDistanceToNow(issue.createdAt, { addSuffix: true })}</span>
                    <span>•</span>
                    <span>by {issue.reporterName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Verify Button */}
                    <button
                      onClick={() => handleVerify(issue)}
                      disabled={votedIds.has(issue.id) || issue.status === 'resolved'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        votedIds.has(issue.id)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                          : 'glass-card border border-white/10 hover:border-neon-green/40 hover:text-neon-green'
                      }`}
                    >
                      <CheckCircle size={12} />
                      {votedIds.has(issue.id) ? 'Verified!' : 'Verify'}
                      <span className="ml-0.5">({issue.verificationCount})</span>
                    </button>

                    <button
                      onClick={() => handleVerify(issue)}
                      disabled={votedIds.has(issue.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass-card border border-white/10 hover:border-neon-blue/40 hover:text-neon-blue transition-all"
                    >
                      <ThumbsUp size={12} />
                      Upvote ({issue.upvoteCount})
                    </button>

                    <Link to={`/tracking/${issue.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass-card border border-white/10 hover:border-neon-purple/40 hover:text-neon-purple transition-all">
                      <MessageSquare size={12} />
                      Comments ({issue.comments.length})
                    </Link>

                    <span className={`ml-auto text-xs font-semibold capitalize ${statusColor[issue.status]}`}>
                      ● {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
              <p>No issues found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
