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
import { db } from '@/lib/firebase';
import type { Issue, IssueCategory, IssueSeverity, IssueStatus, GeoLocation, GeminiAnalysis } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const ISSUES_COLLECTION = 'issues';

// ─── Compress image using HTML5 canvas to keep size under 200KB ───────────────
export async function compressImage(file: File): Promise<Blob | File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// ─── Upload media files to Cloudinary (with 10s timeout per file) ───────────────
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dtipnlwoc';
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'community_reports';
  const uploadUrl = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL || `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  let fileToUpload: Blob | File = file;
  try {
    if (file.type.startsWith('image/')) {
      console.log('[issueService] Compressing image before Cloudinary upload:', file.name);
      fileToUpload = await compressImage(file);
      console.log('[issueService] Compression successful, new size:', fileToUpload.size);
    }
  } catch (e) {
    console.warn('[issueService] Image compression failed, uploading original:', e);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload, file.name);
  formData.append('upload_preset', preset);

  const uploadTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Cloudinary upload timeout after 10s')), 10000)
  );

  const uploadPromise = fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} - ${errText}`);
    }
    const data = await res.json();
    if (!data.secure_url) {
      throw new Error('Cloudinary upload response missing secure_url');
    }
    return data.secure_url as string;
  });

  return Promise.race([uploadPromise, uploadTimeout]);
}

export async function uploadIssueMedia(files: File[], _userId: string): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    try {
      console.log('[issueService] Uploading file to Cloudinary:', file.name);
      const url = await uploadToCloudinary(file);
      urls.push(url);
      console.log('[issueService] Cloudinary upload success:', file.name, '->', url);
    } catch (err: any) {
      // Log but never throw — let submission continue without this file
      console.warn('[issueService] Cloudinary upload failed (non-blocking):', file.name, err?.message || err);
    }
  }

  return urls; // may be empty if all uploads failed — that's fine
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
    const imageUrl = data.mediaUrls.length > 0 ? data.mediaUrls[0] : null;

    // NOTE: serverTimestamp() CANNOT be used inside arrays in Firestore.
    // Use ISO string for statusHistory timestamps.
    const issueRef = await addDoc(collection(db, ISSUES_COLLECTION), {
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      imageUrl: imageUrl, // Cloudinary image URL (or null)
      location: data.location,
      lat: data.location.lat,
      lng: data.location.lng,
      status: 'reported' as IssueStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: data.reportedBy,
      reward: 50, // 50 points earned
      verificationCount: 0,
      reporterName: data.reporterName,
      reporterUid: data.reportedBy,
      
      // Keep other existing fields for frontend backwards-compatibility
      mediaUrls: data.mediaUrls,
      mediaTypes: data.mediaTypes,
      reporterAvatar: data.reporterAvatar || null,
      geminiAnalysis: data.geminiAnalysis || null,
      upvoteCount: 0,
      statusHistory: [{
        status: 'reported',
        timestamp: new Date().toISOString(), // ← ISO string, NOT serverTimestamp() (not allowed in arrays)
        note: 'Issue reported by citizen',
      }],
      comments: [],
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
