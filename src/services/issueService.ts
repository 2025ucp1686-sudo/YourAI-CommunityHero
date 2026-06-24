import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Issue, IssueCategory, IssueSeverity, IssueStatus, GeoLocation, GeminiAnalysis } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const ISSUES_COLLECTION = 'issues';

// ─── Upload media files ───────────────────────────────────────────────────────
export async function uploadIssueMedia(files: File[], userId: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const fileRef = ref(storage, `issues/${userId}/${uuidv4()}-${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    urls.push(url);
  }
  return urls;
}

// ─── Create new issue ─────────────────────────────────────────────────────────
export async function createIssue(data: {
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  location: GeoLocation;
  mediaUrls: string[];
  mediaTypes: ('image' | 'video')[];
  reportedBy: string;
  reporterName: string;
  reporterAvatar?: string;
  geminiAnalysis?: GeminiAnalysis;
}): Promise<string> {
  console.log('[issueService] Writing report to Firestore, collection:', ISSUES_COLLECTION);
  console.log('[issueService] Report data:', { title: data.title, category: data.category, severity: data.severity, reportedBy: data.reportedBy });

  try {
    // NOTE: serverTimestamp() CANNOT be used inside arrays in Firestore.
    // Use ISO string for statusHistory timestamps.
    const issueRef = await addDoc(collection(db, ISSUES_COLLECTION), {
      ...data,
      // Strip undefined values that Firestore rejects
      reporterAvatar: data.reporterAvatar || null,
      geminiAnalysis: data.geminiAnalysis || null,
      status: 'reported' as IssueStatus,
      verificationCount: 0,
      upvoteCount: 0,
      statusHistory: [{
        status: 'reported',
        timestamp: new Date().toISOString(), // ← ISO string, NOT serverTimestamp() (not allowed in arrays)
        note: 'Issue reported by citizen',
      }],
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[issueService] Firestore write success! Document ID:', issueRef.id);
    return issueRef.id;
  } catch (err: any) {
    console.error('[issueService] Firestore write FAILED:', err?.code, err?.message, err);
    throw err;
  }
}

// ─── Get issue by ID ──────────────────────────────────────────────────────────
export async function getIssueById(id: string): Promise<Issue | null> {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Issue;
}

// ─── Get all issues with optional filters ─────────────────────────────────────
export async function getIssues(filters?: {
  category?: IssueCategory;
  severity?: IssueSeverity;
  status?: IssueStatus;
  city?: string;
  userId?: string;
  limitCount?: number;
}): Promise<Issue[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (filters?.category) constraints.push(where('category', '==', filters.category));
  if (filters?.severity) constraints.push(where('severity', '==', filters.severity));
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.userId) constraints.push(where('reportedBy', '==', filters.userId));
  if (filters?.limitCount) constraints.push(limit(filters.limitCount));

  const q = query(collection(db, ISSUES_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Issue));
}

// ─── Subscribe to issues (real-time) ─────────────────────────────────────────
export function subscribeToIssues(
  callback: (issues: Issue[]) => void,
  filters?: { status?: IssueStatus; limitCount?: number }
) {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.limitCount) constraints.push(limit(filters.limitCount));

  const q = query(collection(db, ISSUES_COLLECTION), ...constraints);
  return onSnapshot(q, (snap) => {
    const issues = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Issue));
    callback(issues);
  });
}

// ─── Update issue status ──────────────────────────────────────────────────────
export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  note?: string,
  updatedBy?: string
): Promise<void> {
  const docRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const current = snap.data();
  const statusHistory = [
    ...(current.statusHistory || []),
    { status, timestamp: new Date().toISOString(), note, updatedBy },
  ];

  await updateDoc(docRef, {
    status,
    statusHistory,
    updatedAt: serverTimestamp(),
    ...(status === 'resolved' ? { resolvedAt: serverTimestamp() } : {}),
  });
}

// ─── Add verification ─────────────────────────────────────────────────────────
export async function addVerification(
  issueId: string,
  userId: string,
  upvote: boolean
): Promise<void> {
  const docRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const current = snap.data();
  await updateDoc(docRef, {
    verificationCount: (current.verificationCount || 0) + 1,
    upvoteCount: upvote ? (current.upvoteCount || 0) + 1 : current.upvoteCount,
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'verifications'), {
    issueId,
    userId,
    upvoted: upvote,
    verified: true,
    createdAt: serverTimestamp(),
  });
}

// ─── Add comment ──────────────────────────────────────────────────────────────
export async function addComment(
  issueId: string,
  comment: { userId: string; userName: string; userAvatar?: string; content: string }
): Promise<void> {
  const docRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const current = snap.data();
  const newComment = {
    id: uuidv4(),
    ...comment,
    createdAt: new Date().toISOString(),
  };

  await updateDoc(docRef, {
    comments: [...(current.comments || []), newComment],
    updatedAt: serverTimestamp(),
  });
}

// ─── Get mock/demo issues (for demo when Firebase not configured) ─────────────
export function getMockIssues(): Issue[] {
  return [
    {
      id: 'mock-1',
      title: 'Large Pothole on MG Road',
      description: 'Dangerous pothole causing vehicle damage near Junction 4',
      category: 'pothole',
      severity: 'high',
      status: 'verified',
      location: { lat: 12.9716, lng: 77.5946, address: 'MG Road, Bangalore', city: 'Bangalore', ward: 'Ward 76' },
      mediaUrls: [],
      mediaTypes: [],
      reportedBy: 'user-1',
      reporterName: 'Rahul Sharma',
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 3600000),
      verificationCount: 12,
      upvoteCount: 10,
      statusHistory: [
        { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: 'verified', timestamp: new Date(Date.now() - 86400000) },
      ],
      comments: [],
      geminiAnalysis: {
        category: 'pothole',
        severity: 'high',
        summary: 'Large pothole detected posing significant risk to vehicles and pedestrians.',
        isDuplicate: false,
        authority: 'Public Works Department (PWD)',
        confidence: 0.95,
        tags: ['road', 'pothole', 'safety'],
        estimatedResolutionDays: 7,
      },
    },
    {
      id: 'mock-2',
      title: 'Garbage Pile Near School',
      description: 'Overflowing garbage bin creating health hazard near Govt School',
      category: 'garbage',
      severity: 'critical',
      status: 'in_progress',
      location: { lat: 12.9722, lng: 77.6099, address: 'Koramangala, Bangalore', city: 'Bangalore', ward: 'Ward 68' },
      mediaUrls: [],
      mediaTypes: [],
      reportedBy: 'user-2',
      reporterName: 'Priya Nair',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(),
      verificationCount: 18,
      upvoteCount: 16,
      statusHistory: [
        { status: 'reported', timestamp: new Date(Date.now() - 86400000) },
        { status: 'verified', timestamp: new Date(Date.now() - 43200000) },
        { status: 'in_progress', timestamp: new Date() },
      ],
      comments: [],
      geminiAnalysis: {
        category: 'garbage',
        severity: 'critical',
        summary: 'Overflowing garbage detected near educational institution creating health and sanitation hazard.',
        isDuplicate: false,
        authority: 'Municipal Solid Waste Management',
        confidence: 0.98,
        tags: ['garbage', 'health', 'school', 'urgent'],
        estimatedResolutionDays: 1,
      },
    },
    {
      id: 'mock-3',
      title: 'Broken Streetlight',
      description: 'Streetlight not working for 3 days creating safety concerns at night',
      category: 'streetlight',
      severity: 'medium',
      status: 'reported',
      location: { lat: 12.9784, lng: 77.6408, address: 'Indiranagar, Bangalore', city: 'Bangalore', ward: 'Ward 82' },
      mediaUrls: [],
      mediaTypes: [],
      reportedBy: 'user-3',
      reporterName: 'Arjun Mehta',
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 172800000),
      verificationCount: 5,
      upvoteCount: 5,
      statusHistory: [
        { status: 'reported', timestamp: new Date(Date.now() - 172800000) },
      ],
      comments: [],
    },
    {
      id: 'mock-4',
      title: 'Water Main Leakage',
      description: 'Major water pipe burst causing flooding on residential street',
      category: 'water_leakage',
      severity: 'critical',
      status: 'resolved',
      location: { lat: 12.9352, lng: 77.6245, address: 'BTM Layout, Bangalore', city: 'Bangalore', ward: 'Ward 55' },
      mediaUrls: [],
      mediaTypes: [],
      reportedBy: 'user-1',
      reporterName: 'Rahul Sharma',
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000),
      verificationCount: 25,
      upvoteCount: 22,
      statusHistory: [
        { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 5) },
        { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 4) },
        { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 3) },
        { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: 'resolved', timestamp: new Date(Date.now() - 86400000) },
      ],
      comments: [],
    },
  ];
}
