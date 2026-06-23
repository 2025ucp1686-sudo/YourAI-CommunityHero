import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Menu, X, Bell, User, LogOut, Map, BarChart2,
  AlertTriangle, Home, Users, Zap, Trophy, Settings,
  Activity, Brain, Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUIStore, useNotificationStore } from '@/store';
import EmergencyModal from './EmergencyModal';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/report', label: 'Report Issue', icon: AlertTriangle },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/tracking', label: 'Tracking', icon: Activity },
  { path: '/insights', label: 'AI Insights', icon: Brain },
  { path: '/impact', label: 'Impact', icon: BarChart2 },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/authority', label: 'Authority', icon: Shield },
];

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const { sidebarOpen, toggleSidebar, setEmergencyModalOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-neon-gradient flex items-center justify-center shadow-neon-blue">
                  <Zap size={16} className="text-white" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-neon-gradient blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
              </div>
              <span className="font-display font-bold text-lg text-gradient hidden sm:block">
                YourAI
              </span>
              <span className="hidden sm:block text-xs text-gray-500 mt-1">Community Hero</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.slice(0, 5).map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Emergency Button */}
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="emergency-glow flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              <Phone size={12} />
              <span className="hidden sm:block">SOS</span>
            </button>

            {currentUser ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Bell size={18} className="text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-neon-blue text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-neon-blue/30" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold">
                        {userProfile?.displayName?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium text-white leading-none">{userProfile?.displayName || 'User'}</p>
                      <p className="text-xs text-neon-blue leading-none mt-0.5">{userProfile?.points || 0} pts</p>
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl border border-white/10 shadow-card overflow-hidden"
                      >
                        <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-sm transition-colors" onClick={() => setProfileOpen(false)}>
                          <User size={14} className="text-neon-blue" /> Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/10 text-sm text-red-400 transition-colors"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-400 hover:text-white px-3 py-1.5 transition-colors">Sign In</Link>
                <Link to="/signup" className="btn-primary text-sm px-4 py-2">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && currentUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 glass-card border-r border-white/10 z-50 flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-neon-gradient flex items-center justify-center">
                    <Zap size={16} className="text-white" />
                  </div>
                  <span className="font-display font-bold text-gradient">YourAI</span>
                </div>
                <button onClick={toggleSidebar} className="p-1 rounded-lg hover:bg-white/5">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {navLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={toggleSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === path
                        ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <EmergencyModal />
    </>
  );
}
