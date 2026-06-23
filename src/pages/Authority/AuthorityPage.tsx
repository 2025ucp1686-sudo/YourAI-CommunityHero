import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Filter, Search, Eye, CheckCircle, Clock,
  BarChart2, Download, AlertTriangle, TrendingUp, Users
} from 'lucide-react';
import { getMockIssues, updateIssueStatus } from '@/services/issueService';
import type { Issue, IssueStatus, IssueCategory } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const statusOptions: IssueStatus[] = ['reported', 'verified', 'assigned', 'in_progress', 'resolved'];
const statusColor: Record<string, string> = {
  reported: 'badge-yellow',
  verified: 'badge-blue',
  assigned: 'badge-purple',
  in_progress: 'badge-red',
  resolved: 'badge-green',
};

export default function AuthorityDashboard() {
  const [issues, setIssues] = useState(getMockIssues());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [catFilter, setCatFilter] = useState<IssueCategory | 'all'>('all');
  const [sevFilter, setSevFilter] = useState<'all' | 'high' | 'critical'>('all');

  const filtered = issues.filter((i) => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.location.address?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (catFilter !== 'all' && i.category !== catFilter) return false;
    if (sevFilter !== 'all' && i.severity !== sevFilter) return false;
    return true;
  });

  const handleStatusChange = async (issue: Issue, newStatus: IssueStatus) => {
    try {
      await updateIssueStatus(issue.id, newStatus, `Status updated by authority`, 'authority');
    } catch { /* demo mode */ }
    setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, status: newStatus } : i));
    toast.success(`Status updated to ${newStatus}!`);
  };

  const stats = {
    total: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    pending: issues.filter((i) => i.status === 'reported' || i.status === 'verified').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  return (
    <div className="page-container">
      <div className="section-container">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={22} className="text-neon-blue" />
              <h1 className="font-display font-bold text-3xl text-gradient">Authority Dashboard</h1>
            </div>
            <p className="text-gray-400 text-sm">Manage and resolve community reported issues</p>
          </div>
          <button className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
            <Download size={14} /> Export Report
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Issues', value: stats.total, icon: BarChart2, color: 'text-neon-blue' },
            { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Needs Attention', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <div className={`font-display font-bold text-2xl ${stat.color}`}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Priority Issues Banner */}
        {stats.critical > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 mb-6 border border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-red-400">
                ⚡ {stats.critical} critical issue{stats.critical > 1 ? 's' : ''} require immediate attention
              </span>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or location..." className="input-field pl-9 text-sm" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input-field text-sm w-auto">
              <option value="all">All Status</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as any)} className="input-field text-sm w-auto">
              <option value="all">All Categories</option>
              {['pothole', 'water_leakage', 'garbage', 'streetlight', 'drainage', 'road_damage'].map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
            <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value as any)} className="input-field text-sm w-auto">
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Issue Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span className="col-span-3">Issue</span>
            <span className="col-span-2">Location</span>
            <span className="col-span-1">Category</span>
            <span className="col-span-1">Severity</span>
            <span className="col-span-1">Verified</span>
            <span className="col-span-1">Age</span>
            <span className="col-span-3">Update Status</span>
          </div>

          {filtered.map((issue, idx) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 border-b border-white/5 hover:bg-white/3 transition-colors ${issue.severity === 'critical' ? 'border-l-2 border-l-red-500' : ''}`}
            >
              {/* Mobile */}
              <div className="md:hidden space-y-2">
                <div className="flex justify-between items-start">
                  <Link to={`/tracking/${issue.id}`} className="font-semibold text-sm text-white hover:text-neon-blue">{issue.title}</Link>
                  <span className={statusColor[issue.status]}>{issue.status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-500">{issue.location.address}</p>
                <div className="flex gap-2">
                  <span className={`badge capitalize ${issue.severity === 'critical' ? 'badge-red' : issue.severity === 'high' ? 'badge-red' : 'badge-yellow'}`}>{issue.severity}</span>
                  <span className="text-xs text-gray-500">✓ {issue.verificationCount}</span>
                </div>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(issue, e.target.value as IssueStatus)}
                  className="input-field text-xs py-1"
                >
                  {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <Link to={`/tracking/${issue.id}`} className="font-medium text-sm text-white hover:text-neon-blue transition-colors line-clamp-1">
                    {issue.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">by {issue.reporterName}</p>
                </div>
                <div className="col-span-2 text-xs text-gray-400 line-clamp-2">{issue.location.address}</div>
                <div className="col-span-1">
                  <span className="badge-blue text-xs capitalize">{issue.category.replace('_', ' ')}</span>
                </div>
                <div className="col-span-1">
                  <span className={`badge capitalize text-xs ${issue.severity === 'critical' || issue.severity === 'high' ? 'badge-red' : issue.severity === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                    {issue.severity}
                  </span>
                </div>
                <div className="col-span-1 text-center text-sm text-neon-green font-semibold">{issue.verificationCount}</div>
                <div className="col-span-1 text-xs text-gray-500">{formatDistanceToNow(issue.createdAt, { addSuffix: false })}</div>
                <div className="col-span-3">
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(issue, e.target.value as IssueStatus)}
                    className="input-field text-xs py-1.5 w-full"
                  >
                    {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Shield size={40} className="mx-auto mb-3 opacity-30" />
              <p>No issues found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
