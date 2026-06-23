import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  Zap, Shield, Map, BarChart2, Brain, Trophy, AlertTriangle,
  Users, CheckCircle, ArrowRight, Star, TrendingUp, Activity
} from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const step = target / 80;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 20);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: React.ElementType; title: string; desc: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card-hover rounded-2xl p-6 flex flex-col gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Mock Leaderboard ─────────────────────────────────────────────────────────
const mockLeaders = [
  { rank: 1, name: 'Rahul Sharma', city: 'Bangalore', points: 4820, badge: '🛡️' },
  { rank: 2, name: 'Priya Nair', city: 'Mumbai', points: 4210, badge: '🏆' },
  { rank: 3, name: 'Arjun Mehta', city: 'Delhi', points: 3950, badge: '⭐' },
  { rank: 4, name: 'Meera Pillai', city: 'Chennai', points: 3640, badge: '🌟' },
  { rank: 5, name: 'Vikram Singh', city: 'Hyderabad', points: 3280, badge: '💫' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Grid overlay */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none z-0" />

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-5xl mx-auto pt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 badge-blue mb-6 text-sm"
          >
            <Zap size={12} />
            Powered by Google Gemini AI
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-black text-5xl md:text-7xl lg:text-8xl mb-6 leading-none"
          >
            <span className="text-gradient">YOUR</span>
            <span className="text-white">AI</span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-5xl font-light text-gray-300 font-sans">
              Community{' '}
              <span className="text-gradient-pink font-bold font-display">Hero</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI-powered civic engagement platform. Report, verify, track, and resolve
            community issues with the intelligence of{' '}
            <span className="text-neon-blue font-semibold">Gemini Vision AI</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/signup" className="btn-primary text-white font-bold px-8 py-4 text-lg flex items-center justify-center gap-2 rounded-xl">
              <AlertTriangle size={20} />
              Report an Issue
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary text-white font-semibold px-8 py-4 text-lg rounded-xl">
              Sign In
            </Link>
            <Link to="/map" className="btn-secondary text-white font-semibold px-8 py-4 text-lg rounded-xl flex items-center gap-2">
              <Map size={18} />
              View Live Map
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: 'Issues Reported', value: 12847, suffix: '+', color: 'text-neon-blue' },
              { label: 'Resolved', value: 9234, suffix: '+', color: 'text-neon-green' },
              { label: 'Active Citizens', value: 3821, suffix: '+', color: 'text-neon-purple' },
              { label: 'Cities Covered', value: 48, suffix: '', color: 'text-neon-pink' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <div className={`font-display font-black text-2xl md:text-3xl ${stat.color}`}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl md:text-5xl section-title mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete civic tech platform built for modern communities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'Gemini Vision AI', desc: 'Upload any image and AI auto-detects issue type, severity, and recommends the right authority.', color: 'bg-gradient-to-br from-violet-600 to-purple-700', delay: 0 },
              { icon: Map, title: 'Live Geo Mapping', desc: 'Interactive real-time map with issue markers, heatmaps, category filters, and density visualization.', color: 'bg-gradient-to-br from-cyan-600 to-blue-700', delay: 0.1 },
              { icon: Shield, title: 'Community Verification', desc: 'Nearby citizens verify reports with upvotes and comments, generating a confidence score.', color: 'bg-gradient-to-br from-green-600 to-emerald-700', delay: 0.2 },
              { icon: Activity, title: 'Real-Time Tracking', desc: 'Live status updates from Reported → Verified → Assigned → In Progress → Resolved.', color: 'bg-gradient-to-br from-orange-600 to-red-700', delay: 0.3 },
              { icon: Trophy, title: 'Gamification', desc: 'Earn points and badges as you report and verify issues. Climb the leaderboard!', color: 'bg-gradient-to-br from-yellow-600 to-amber-700', delay: 0.4 },
              { icon: TrendingUp, title: 'Predictive Insights', desc: 'AI analyzes trends to predict emerging issues and suggests preventive community actions.', color: 'bg-gradient-to-br from-pink-600 to-rose-700', delay: 0.5 },
            ].map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4 bg-glow-blue">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display font-bold text-4xl text-center section-title mb-16"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Report', desc: 'Snap a photo, add location, let AI auto-categorize', icon: AlertTriangle },
              { step: '02', title: 'Verify', desc: 'Nearby citizens confirm the issue exists', icon: Users },
              { step: '03', title: 'Track', desc: 'Watch real-time status updates from authorities', icon: Activity },
              { step: '04', title: 'Resolved', desc: 'Issue fixed, earn points and badges!', icon: CheckCircle },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center relative"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-neon-blue/50 to-transparent" />
                )}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 flex items-center justify-center mb-4 relative">
                  <item.icon size={24} className="text-neon-blue" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neon-gradient flex items-center justify-center text-xs font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LEADERBOARD PREVIEW ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display font-bold text-4xl section-title mb-4">Top Community Heroes</h2>
            <p className="text-gray-400">Citizens making a real difference in their communities</p>
          </motion.div>

          <div className="glass-card rounded-2xl overflow-hidden neon-border-purple">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <Trophy size={18} className="text-neon-purple" />
              <span className="font-semibold text-sm">Global Leaderboard</span>
              <span className="ml-auto badge-purple">Live</span>
            </div>
            {mockLeaders.map((leader, i) => (
              <motion.div
                key={leader.rank}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/3 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                  leader.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                  leader.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/40' :
                  'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                }`}>
                  {leader.rank}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold">
                  {leader.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-white">{leader.name}</p>
                  <p className="text-xs text-gray-500">{leader.city}</p>
                </div>
                <div className="text-lg">{leader.badge}</div>
                <div className="text-right">
                  <p className="font-display font-bold text-neon-blue text-sm">{leader.points.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </motion.div>
            ))}
            <div className="p-4 text-center">
              <Link to="/leaderboard" className="text-sm text-neon-blue hover:underline">
                View Full Leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 border border-neon-blue/20"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(168,85,247,0.05) 100%)' }}
          >
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
              Ready to be a{' '}
              <span className="text-gradient">Community Hero?</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Join thousands of citizens making their neighborhoods better, one report at a time.
            </p>
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-white font-bold px-10 py-4 text-lg rounded-xl">
              Join Now – It's Free
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 text-center text-gray-600 text-sm">
        <p>© 2024 YourAI Community Hero • Built with ❤️ for the community • Powered by Google Gemini</p>
      </footer>
    </div>
  );
}
