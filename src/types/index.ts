// =====================
// Issue Types
// =====================
export type IssueCategory =
  | 'pothole'
  | 'water_leakage'
  | 'garbage'
  | 'streetlight'
  | 'drainage'
  | 'road_damage'
  | 'infrastructure'
  | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus =
  | 'reported'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  ward?: string;
}

export interface GeminiAnalysis {
  category: IssueCategory;
  severity: IssueSeverity;
  summary: string;
  isDuplicate: boolean;
  duplicateIssueId?: string;
  authority: string;
  confidence: number;
  tags: string[];
  estimatedResolutionDays: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: GeoLocation;
  mediaUrls: string[];
  mediaTypes: ('image' | 'video')[];
  reportedBy: string; // user id
  reporterName: string;
  reporterAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  verificationCount: number;
  upvoteCount: number;
  geminiAnalysis?: GeminiAnalysis;
  assignedAuthority?: string;
  resolvedAt?: Date;
  statusHistory: StatusHistoryEntry[];
  comments: Comment[];
}

export interface StatusHistoryEntry {
  status: IssueStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

// =====================
// User Types
// =====================
export type UserBadge =
  | 'citizen'
  | 'hero'
  | 'community_champion'
  | 'guardian'
  | 'first_reporter'
  | 'verifier'
  | 'problem_solver';

export type UserRole = 'citizen' | 'authority' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  city: string;
  ward?: string;
  photoURL?: string;
  role: UserRole;
  points: number;
  badges: UserBadge[];
  issuesReported: number;
  issuesVerified: number;
  issuesResolved: number;
  communityRank?: number;
  location?: GeoLocation;
  createdAt: Date;
  lastActive: Date;
}

// =====================
// Verification Types
// =====================
export interface Verification {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  verified: boolean;
  upvoted: boolean;
  location?: GeoLocation;
  distance?: number; // km from issue
  createdAt: Date;
}

// =====================
// Notification Types
// =====================
export type NotificationType =
  | 'verification_request'
  | 'status_change'
  | 'resolution'
  | 'badge_earned'
  | 'points_earned'
  | 'comment';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  issueId?: string;
  read: boolean;
  createdAt: Date;
}

// =====================
// Analytics Types
// =====================
export interface AnalyticsSummary {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  avgResolutionDays: number;
  categoryBreakdown: Record<IssueCategory, number>;
  monthlyTrends: MonthlyTrend[];
  topAreas: AreaStat[];
  severityBreakdown: Record<IssueSeverity, number>;
}

export interface MonthlyTrend {
  month: string;
  reported: number;
  resolved: number;
}

export interface AreaStat {
  area: string;
  count: number;
  resolved: number;
}

// =====================
// Leaderboard Types
// =====================
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  city: string;
  points: number;
  issuesReported: number;
  issuesVerified: number;
  badges: UserBadge[];
}

// =====================
// Predictive Insights
// =====================
export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  affectedAreas: string[];
  emergingIssues: string[];
  monthlyForecast: string;
  preventiveActions: string[];
  generatedAt: Date;
  confidence: number;
}

// =====================
// Emergency
// =====================
export interface EmergencyContact {
  name: string;
  number: string;
  icon: string;
  color: string;
}

// =====================
// Map Types
// =====================
export interface MapFilters {
  categories: IssueCategory[];
  severities: IssueSeverity[];
  statuses: IssueStatus[];
  showHeatmap: boolean;
  radius?: number;
}
