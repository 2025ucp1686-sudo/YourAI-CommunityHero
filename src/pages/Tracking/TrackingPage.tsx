import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, Clock, AlertTriangle, Wrench, Star,
  ArrowLeft, MapPin, Brain, ThumbsUp, MessageSquare, Send, Loader
} from 'lucide-react';
import { getIssueById, addComment } from '@/services/issueService';
import { useAuth } from '@/contexts/AuthContext';
import type { Issue, IssueStatus } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const statusSteps: { status: IssueStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'reported', label: 'Reported', icon: AlertTriangle, color: 'text-yellow-400 border-yellow-400' },
  { status: 'verified', label: 'Verified', icon: CheckCircle, color: 'text-blue-400 border-blue-400' },
  { status: 'assigned', label: 'Assigned', icon: Star, color: 'text-purple-400 border-purple-400' },
  { status: 'in_progress', label: 'In Progress', icon: Wrench, color: 'text-orange-400 border-orange-400' },
  { status: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-green-400 border-green-400' },
];

const statusOrder: IssueStatus[] = ['reported', 'verified', 'assigned', 'in_progress', 'resolved'];

export default function TrackingPage() {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load issue from Firestore using the real document ID
  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    console.log('[TrackingPage] Loading issue from Firestore, id:', id);
    setLoading(true);
    setNotFound(false);

    getIssueById(id)
      .then((data) => {
        if (data) {
          console.log('[TrackingPage] Issue loaded:', data.title);
          setIssue(data);
        } else {
          console.warn('[TrackingPage] Issue not found for id:', id);
          setNotFound(true);
        }
      })
      .catch((err) => {
        console.error('[TrackingPage] Error loading issue:', err?.message);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const currentStatusIdx = issue ? statusOrder.indexOf(issue.status) : 0;

  const handleComment = async () => {
    if (!commentText.trim() || !currentUser || !issue) return;
    setSubmitting(true);
    try {
      await addComment(issue.id, {
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'Anonymous',
        content: commentText,
      });
      setIssue((prev) =>
        prev ? {
          ...prev,
          comments: [...(prev.comments || []), {
            id: Date.now().toString(),
            userId: currentUser.uid,
            userName: userProfile?.displayName || 'Anonymous',
            content: commentText,
            createdAt: new Date(),
          }],
        } : prev
      );
      setCommentText('');
      toast.success('Comment added!');
    } catch (err: any) {
      console.error('[TrackingPage] Comment error:', err?.message);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader size={36} className="mx-auto mb-3 text-neon-blue animate-spin" />
        <p className="text-gray-400 text-sm">Loading issue details...</p>
      </div>
    </div>
  );

  // ── Not found state ────────────────────────────────────────────────────────
  if (notFound || !issue) return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <div className="text-center glass-card rounded-2xl p-10 max-w-md">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
        <h2 className="font-bold text-xl text-white mb-2">Issue Not Found</h2>
        <p className="text-gray-400 text-sm mb-6">
          The issue with ID <code className="text-neon-blue">{id}</code> could not be found in Firestore.
        </p>
        <Link to="/community" className="btn-primary px-6 py-2 rounded-xl text-white font-semibold">
          View All Issues
        </Link>
      </div>
    </div>
  );

  // Safe date helper — handles Firestore Timestamps, ISO strings, and Date objects
  const safeDate = (val: any): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === 'string') return new Date(val);
    if (val?.toDate) return val.toDate(); // Firestore Timestamp
    if (val?.seconds) return new Date(val.seconds * 1000); // Firestore Timestamp (plain object)
    return new Date();
  };

  return (
    <div className="page-container">
      <div className="section-container max-w-3xl">
        {/* Back */}
        <Link to="/community" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Community
        </Link>

        {/* Issue Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-bold text-xl text-white mb-2">{issue.title}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="badge-blue capitalize">{issue.category.replace('_', ' ')}</span>
                <span className={`badge capitalize ${
                  issue.severity === 'critical' || issue.severity === 'high'
                    ? 'badge-red'
                    : issue.severity === 'medium'
                    ? 'badge-yellow'
                    : 'badge-green'
                }`}>
                  {issue.severity}
                </span>
                <span className="badge-purple capitalize">{issue.status.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-display font-bold text-neon-green">{issue.verificationCount}</div>
              <div className="text-xs text-gray-500">verifications</div>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-4">{issue.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><MapPin size={12} /> {issue.location?.address || 'Location unknown'}</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatDistanceToNow(safeDate(issue.createdAt), { addSuffix: true })}
            </span>
            <span>by <strong className="text-white">{issue.reporterName}</strong></span>
          </div>

          {/* Media */}
          {issue.mediaUrls && issue.mediaUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {issue.mediaUrls.map((url, i) => (
                issue.mediaTypes?.[i] === 'video' ? (
                  <video key={i} src={url} controls className="rounded-xl w-full max-h-40 object-cover" />
                ) : (
                  <img key={i} src={url} alt={`media-${i}`} className="rounded-xl w-full max-h-40 object-cover" />
                )
              ))}
            </div>
          )}

          {/* AI Analysis */}
          {issue.geminiAnalysis && issue.geminiAnalysis.confidence > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-neon-purple/5 border border-neon-purple/20">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} className="text-neon-purple" />
                <span className="text-sm font-semibold text-neon-purple">Gemini AI Analysis</span>
                <span className="ml-auto badge-purple">{Math.round(issue.geminiAnalysis.confidence * 100)}% confidence</span>
              </div>
              <p className="text-sm text-gray-300 italic mb-3">"{issue.geminiAnalysis.summary}"</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Recommended Authority:</span> <span className="text-white">{issue.geminiAnalysis.authority}</span></div>
                <div><span className="text-gray-500">Est. Resolution:</span> <span className="text-white">{issue.geminiAnalysis.estimatedResolutionDays} days</span></div>
              </div>
              {issue.geminiAnalysis.tags && issue.geminiAnalysis.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {issue.geminiAnalysis.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Status Timeline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-sm mb-6 flex items-center gap-2">
            <Clock size={14} className="text-neon-blue" /> Status Timeline
          </h2>

          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-white/10" />
            <div
              className="absolute left-4 top-4 w-px bg-neon-gradient transition-all duration-1000"
              style={{ height: `${(currentStatusIdx / (statusSteps.length - 1)) * 100}%` }}
            />

            <div className="space-y-6">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                const historyEntry = issue.statusHistory?.find((h) => h.status === step.status);

                return (
                  <motion.div
                    key={step.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 relative z-10"
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-dark-800 ${
                      isCompleted ? step.color : 'border-gray-700 text-gray-600'
                    } ${isCurrent ? 'shadow-neon-blue ring-2 ring-neon-blue/30' : ''}`}>
                      <step.icon size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm ${isCompleted ? 'text-white' : 'text-gray-600'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-2 badge-blue text-xs">Current</span>}
                        </span>
                        {historyEntry && (
                          <span className="text-xs text-gray-600">
                            {format(safeDate(historyEntry.timestamp), 'MMM d, h:mm a')}
                          </span>
                        )}
                      </div>
                      {historyEntry?.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{historyEntry.note}</p>
                      )}
                      {!isCompleted && (
                        <p className="text-xs text-gray-600 mt-0.5">Pending...</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Verification Score */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <ThumbsUp size={14} className="text-neon-green" /> Community Verification Score
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-display font-black text-neon-green">
              {Math.min(Math.round(((issue.upvoteCount || 0) / Math.max(issue.verificationCount || 1, 1)) * 100), 100)}%
            </div>
            <div className="flex-1">
              <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.round(((issue.upvoteCount || 0) / Math.max(issue.verificationCount || 1, 1)) * 100), 100)}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="h-full bg-gradient-to-r from-neon-green to-neon-blue rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{issue.verificationCount || 0} verifications</span>
                <span>{issue.upvoteCount || 0} upvotes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <MessageSquare size={14} className="text-neon-blue" /> Comments ({(issue.comments || []).length})
          </h2>

          <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
            {(!issue.comments || issue.comments.length === 0) && (
              <p className="text-gray-600 text-sm text-center py-4">No comments yet. Be the first!</p>
            )}
            {(issue.comments || []).map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(c.userName || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 glass-card rounded-xl p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{c.userName}</span>
                    <span className="text-xs text-gray-600">{formatDistanceToNow(safeDate(c.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-gray-300">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {currentUser ? (
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                placeholder="Add a comment..."
                className="input-field flex-1 text-sm"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                className="btn-primary px-4 py-2 rounded-xl text-white"
              >
                {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-gray-500">
              <Link to="/login" className="text-neon-blue hover:underline">Login</Link> to add a comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
