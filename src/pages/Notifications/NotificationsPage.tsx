import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, MapPin, Clock, X, Check } from 'lucide-react';
import { useNotificationStore } from '@/store';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

// Generate demo notifications
const demoNotifications: Notification[] = [
  {
    id: 'n1', userId: 'u1', type: 'verification_request',
    title: 'Verification Needed Nearby',
    message: 'A pothole has been reported 0.8km from you on MG Road. Can you verify?',
    issueId: 'mock-1', read: false, createdAt: new Date(Date.now() - 300000),
  },
  {
    id: 'n2', userId: 'u1', type: 'status_change',
    title: 'Issue Status Updated',
    message: 'Your reported issue "Water Leakage on BTM" is now In Progress.',
    issueId: 'mock-4', read: false, createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'n3', userId: 'u1', type: 'badge_earned',
    title: '🏅 Badge Earned!',
    message: 'Congratulations! You earned the "Verifier" badge for verifying 10+ issues.',
    read: false, createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'n4', userId: 'u1', type: 'resolution',
    title: 'Issue Resolved! 🎉',
    message: 'The garbage issue you reported near Government School has been resolved!',
    issueId: 'mock-2', read: true, createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'n5', userId: 'u1', type: 'points_earned',
    title: '⚡ Points Earned',
    message: 'You earned 50 points for reporting a new issue. Keep it up, Hero!',
    read: true, createdAt: new Date(Date.now() - 172800000),
  },
];

const notifIcon: Record<string, { icon: React.ElementType; color: string }> = {
  verification_request: { icon: MapPin, color: 'text-neon-blue' },
  status_change: { icon: Clock, color: 'text-neon-purple' },
  resolution: { icon: CheckCircle, color: 'text-green-400' },
  badge_earned: { icon: Bell, color: 'text-yellow-400' },
  points_earned: { icon: Bell, color: 'text-neon-blue' },
  comment: { icon: Bell, color: 'text-gray-400' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="page-container">
      <div className="section-container max-w-2xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-gradient mb-1">Notifications</h1>
            <p className="text-gray-400 text-sm">
              {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <Check size={14} /> Mark All Read
            </button>
          )}
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notif, i) => {
              const { icon: Icon, color } = notifIcon[notif.type] || notifIcon.comment;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => markRead(notif.id)}
                  className={`glass-card rounded-2xl p-4 cursor-pointer transition-all border ${
                    !notif.read ? 'border-neon-blue/20 bg-neon-blue/3' : 'border-white/5'
                  } hover:border-white/20`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl glass-card flex items-center justify-center flex-shrink-0 ${!notif.read ? 'border border-neon-blue/30' : ''}`}>
                      <Icon size={18} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-sm ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                          {notif.title}
                          {!notif.read && <span className="ml-2 w-2 h-2 bg-neon-blue rounded-full inline-block align-middle" />}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                          className="p-1 rounded-lg hover:bg-white/5 text-gray-600 hover:text-white transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Bell size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
