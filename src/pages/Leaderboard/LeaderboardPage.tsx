import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Zap, TrendingUp, Crown, Medal, Filter } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', userName: 'Rahul Sharma', city: 'Bangalore', points: 4820, issuesReported: 48, issuesVerified: 230, badges: ['guardian', 'community_champion'] },
  { rank: 2, userId: 'u2', userName: 'Priya Nair', city: 'Mumbai', points: 4210, issuesReported: 42, issuesVerified: 195, badges: ['hero', 'community_champion'] },
  { rank: 3, userId: 'u3', userName: 'Arjun Mehta', city: 'Delhi', points: 3950, issuesReported: 39, issuesVerified: 182, badges: ['hero', 'verifier'] },
  { rank: 4, userId: 'u4', userName: 'Meera Pillai', city: 'Chennai', points: 3640, issuesReported: 36, issuesVerified: 168, badges: ['hero'] },
  { rank: 5, userId: 'u5', userName: 'Vikram Singh', city: 'Hyderabad', points: 3280, issuesReported: 32, issuesVerified: 145, badges: ['hero'] },
  { rank: 6, userId: 'u6', userName: 'Anita Desai', city: 'Pune', points: 2940, issuesReported: 29, issuesVerified: 128, badges: ['citizen'] },
  { rank: 7, userId: 'u7', userName: 'Suresh Kumar', city: 'Kolkata', points: 2680, issuesReported: 26, issuesVerified: 114, badges: ['citizen'] },
  { rank: 8, userId: 'u8', userName: 'Lakshmi Iyer', city: 'Bangalore', points: 2420, issuesReported: 24, issuesVerified: 98, badges: ['citizen'] },
  { rank: 9, userId: 'u9', userName: 'Rohit Gupta', city: 'Ahmedabad', points: 2180, issuesReported: 21, issuesVerified: 87, badges: ['citizen'] },
  { rank: 10, userId: 'u10', userName: 'Kavya Reddy', city: 'Hyderabad', points: 1940, issuesReported: 19, issuesVerified: 74, badges: ['citizen'] },
];

const badgeEmoji: Record<string, string> = {
  citizen: '🏅', hero: '🦸', community_champion: '🏆', guardian: '🛡️',
  first_reporter: '⭐', verifier: '✅', problem_solver: '💡',
};

const rankColor = (rank: number) => {
  if (rank === 1) return 'from-yellow-400 to-amber-500';
  if (rank === 2) return 'from-gray-300 to-gray-400';
  if (rank === 3) return 'from-amber-600 to-amber-700';
  return 'from-dark-400 to-dark-500';
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown size={16} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={16} className="text-gray-300" />;
  if (rank === 3) return <Medal size={16} className="text-amber-600" />;
  return <span className="text-xs font-bold text-gray-500">#{rank}</span>;
};

export default function LeaderboardPage() {
  const [cityFilter, setCityFilter] = useState('all');
  const cities = ['all', ...Array.from(new Set(mockLeaderboard.map((l) => l.city)))];
  const filtered = cityFilter === 'all' ? mockLeaderboard : mockLeaderboard.filter((l) => l.city === cityFilter);
  const top3 = mockLeaderboard.slice(0, 3);

  return (
    <div className="page-container">
      <div className="section-container max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-10">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="font-display font-bold text-3xl text-gradient mb-2">Community Leaderboard</h1>
          <p className="text-gray-400">Top civic heroes making a real difference</p>
        </motion.div>

        {/* Podium Top 3 */}
        <div className="flex items-end justify-center gap-4 mb-10">
          {/* 2nd */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 text-center">
            <div className="glass-card rounded-2xl p-4 border border-gray-400/20 mb-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-lg font-bold text-dark-900 mb-2">
                {top3[1]?.userName.charAt(0)}
              </div>
              <p className="font-semibold text-sm text-white truncate">{top3[1]?.userName}</p>
              <p className="text-xs text-gray-500">{top3[1]?.city}</p>
              <p className="font-display font-bold text-lg text-gray-300 mt-1">{top3[1]?.points.toLocaleString()}</p>
              <div className="flex justify-center gap-1 mt-1">
                {top3[1]?.badges.map((b) => <span key={b} title={b}>{badgeEmoji[b]}</span>)}
              </div>
            </div>
            <div className="bg-gradient-to-t from-gray-400/30 to-gray-400/10 rounded-t-xl h-16 flex items-center justify-center">
              <Medal size={24} className="text-gray-400" />
            </div>
          </motion.div>

          {/* 1st */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 text-center">
            <div className="glass-card rounded-2xl p-4 border border-yellow-400/30 mb-2 shadow-neon-blue relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-xl font-bold text-dark-900 mb-2 mt-2">
                {top3[0]?.userName.charAt(0)}
              </div>
              <p className="font-bold text-white truncate">{top3[0]?.userName}</p>
              <p className="text-xs text-gray-500">{top3[0]?.city}</p>
              <p className="font-display font-black text-2xl text-yellow-400 mt-1">{top3[0]?.points.toLocaleString()}</p>
              <div className="flex justify-center gap-1 mt-1">
                {top3[0]?.badges.map((b) => <span key={b} title={b}>{badgeEmoji[b]}</span>)}
              </div>
            </div>
            <div className="bg-gradient-to-t from-yellow-400/30 to-yellow-400/10 rounded-t-xl h-24 flex items-center justify-center">
              <Crown size={28} className="text-yellow-400" />
            </div>
          </motion.div>

          {/* 3rd */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 text-center">
            <div className="glass-card rounded-2xl p-4 border border-amber-600/20 mb-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-lg font-bold text-white mb-2">
                {top3[2]?.userName.charAt(0)}
              </div>
              <p className="font-semibold text-sm text-white truncate">{top3[2]?.userName}</p>
              <p className="text-xs text-gray-500">{top3[2]?.city}</p>
              <p className="font-display font-bold text-lg text-amber-600 mt-1">{top3[2]?.points.toLocaleString()}</p>
              <div className="flex justify-center gap-1 mt-1">
                {top3[2]?.badges.map((b) => <span key={b} title={b}>{badgeEmoji[b]}</span>)}
              </div>
            </div>
            <div className="bg-gradient-to-t from-amber-700/30 to-amber-700/10 rounded-t-xl h-10 flex items-center justify-center">
              <Medal size={20} className="text-amber-600" />
            </div>
          </motion.div>
        </div>

        {/* Points Info */}
        <div className="glass-card rounded-2xl p-5 mb-6 border border-neon-blue/10">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap size={14} className="text-neon-blue" /> How to Earn Points</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { action: 'Report Issue', pts: '+50', emoji: '📋' },
              { action: 'Verify Issue', pts: '+10', emoji: '✅' },
              { action: 'Confirm Resolved', pts: '+20', emoji: '🎉' },
            ].map((item) => (
              <div key={item.action} className="glass-card rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{item.emoji}</div>
                <p className="font-display font-bold text-neon-blue">{item.pts}</p>
                <p className="text-xs text-gray-500">{item.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter by city */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                cityFilter === city ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'glass-card border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {city === 'all' ? 'All Cities' : city}
            </button>
          ))}
        </div>

        {/* Full Leaderboard */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 grid grid-cols-12 text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Citizen</span>
            <span className="col-span-2 text-center">Reported</span>
            <span className="col-span-2 text-center">Verified</span>
            <span className="col-span-2 text-right">Points</span>
          </div>
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 border-b border-white/5 hover:bg-white/3 transition-colors grid grid-cols-12 items-center"
            >
              <div className="col-span-1 flex items-center justify-center">
                {rankIcon(entry.rank)}
              </div>
              <div className="col-span-5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankColor(entry.rank)} flex items-center justify-center text-xs font-bold text-dark-900`}>
                  {entry.userName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{entry.userName}</p>
                  <p className="text-xs text-gray-500">{entry.city}</p>
                </div>
              </div>
              <div className="col-span-2 text-center text-sm text-gray-300">{entry.issuesReported}</div>
              <div className="col-span-2 text-center text-sm text-gray-300">{entry.issuesVerified}</div>
              <div className="col-span-2 text-right">
                <span className="font-display font-bold text-neon-blue">{entry.points.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
