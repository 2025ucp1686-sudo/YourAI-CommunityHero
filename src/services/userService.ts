import {
  collection, doc, setDoc, getDoc, updateDoc, getDocs,
  query, orderBy, limit, serverTimestamp, where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, UserBadge } from '@/types';

// Badge thresholds
const BADGE_THRESHOLDS = {
  hero: { issuesReported: 10 },
  community_champion: { issuesReported: 25 },
  guardian: { issuesVerified: 50 },
  verifier: { issuesVerified: 10 },
  problem_solver: { issuesResolved: 5 },
};

// Points per action
export const POINTS = {
  REPORT_ISSUE: 50,
  VERIFY_ISSUE: 10,
  CONFIRM_RESOLVED: 20,
};

// ─── Get user profile ─────────────────────────────────────────────────────────
export async function getUserProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

// ─── Update user points and check for new badges ──────────────────────────────
export async function addPoints(userId: string, points: number, action: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const userData = snap.data() as User;
  const newPoints = (userData.points || 0) + points;

  // Check for new badges
  const currentBadges = new Set(userData.badges || ['citizen']);
  const updates: Partial<User> = {
    points: newPoints,
    lastActive: new Date(),
  };

  if (action === 'report') {
    updates.issuesReported = (userData.issuesReported || 0) + 1;
    if ((updates.issuesReported || 0) >= BADGE_THRESHOLDS.hero.issuesReported) currentBadges.add('hero');
    if ((updates.issuesReported || 0) >= BADGE_THRESHOLDS.community_champion.issuesReported) currentBadges.add('community_champion');
  }
  if (action === 'verify') {
    updates.issuesVerified = (userData.issuesVerified || 0) + 1;
    if ((updates.issuesVerified || 0) >= BADGE_THRESHOLDS.verifier.issuesVerified) currentBadges.add('verifier');
    if ((updates.issuesVerified || 0) >= BADGE_THRESHOLDS.guardian.issuesVerified) currentBadges.add('guardian');
  }

  updates.badges = Array.from(currentBadges) as UserBadge[];

  await updateDoc(userRef, updates as Record<string, any>);
}

// ─── Upload profile photo (using Cloudinary) ──────────────────────────────────
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dtipnlwoc';
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'community_reports';
  const uploadUrl = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL || `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('public_id', `profile_${userId}`);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Profile photo upload failed: ${res.statusText} - ${errText}`);
  }

  const data = await res.json();
  return data.secure_url;
}

// ─── Get leaderboard ──────────────────────────────────────────────────────────
export async function getLeaderboard(limitCount = 20) {
  const q = query(
    collection(db, 'users'),
    orderBy('points', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, idx) => ({
    rank: idx + 1,
    userId: d.id,
    ...d.data(),
  }));
}

// ─── Mock user for demo ───────────────────────────────────────────────────────
export function getMockUser(): User {
  return {
    id: 'demo-user',
    email: 'demo@yourai.com',
    displayName: 'Demo Hero',
    phoneNumber: '+91 99999 00000',
    city: 'Bangalore',
    role: 'citizen',
    points: 450,
    badges: ['citizen', 'first_reporter'],
    issuesReported: 7,
    issuesVerified: 23,
    issuesResolved: 3,
    communityRank: 142,
    createdAt: new Date(Date.now() - 86400000 * 30),
    lastActive: new Date(),
  };
}
