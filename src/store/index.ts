import { create } from 'zustand';
import type { Issue, User, Notification, AnalyticsSummary, LeaderboardEntry } from '@/types';

// ─── Issue Store ───────────────────────────────────────────────────────────────
interface IssueStore {
  issues: Issue[];
  selectedIssue: Issue | null;
  loading: boolean;
  setIssues: (issues: Issue[]) => void;
  setSelectedIssue: (issue: Issue | null) => void;
  setLoading: (loading: boolean) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (id: string, data: Partial<Issue>) => void;
}

export const useIssueStore = create<IssueStore>((set) => ({
  issues: [],
  selectedIssue: null,
  loading: false,
  setIssues: (issues) => set({ issues }),
  setSelectedIssue: (selectedIssue) => set({ selectedIssue }),
  setLoading: (loading) => set({ loading }),
  addIssue: (issue) => set((state) => ({ issues: [issue, ...state.issues] })),
  updateIssue: (id, data) =>
    set((state) => ({
      issues: state.issues.map((i) => (i.id === id ? { ...i, ...data } : i)),
    })),
}));

// ─── Notification Store ────────────────────────────────────────────────────────
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(state.unreadCount - 1, 0),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),
}));

// ─── Analytics Store ───────────────────────────────────────────────────────────
interface AnalyticsStore {
  analytics: AnalyticsSummary | null;
  leaderboard: LeaderboardEntry[];
  setAnalytics: (analytics: AnalyticsSummary) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  analytics: null,
  leaderboard: [],
  setAnalytics: (analytics) => set({ analytics }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
}));

// ─── UI Store ──────────────────────────────────────────────────────────────────
interface UIStore {
  sidebarOpen: boolean;
  emergencyModalOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setEmergencyModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  emergencyModalOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setEmergencyModalOpen: (emergencyModalOpen) => set({ emergencyModalOpen }),
}));
