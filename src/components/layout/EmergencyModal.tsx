import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Flame, Ambulance, MapPin, X, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store';
import toast from 'react-hot-toast';

const emergencyContacts = [
  { name: 'Police', number: '100', icon: '🚔', color: 'from-blue-600 to-blue-700', description: 'Law & Order Emergency' },
  { name: 'Fire Brigade', number: '101', icon: '🚒', color: 'from-orange-600 to-red-700', description: 'Fire & Rescue' },
  { name: 'Ambulance', number: '108', icon: '🚑', color: 'from-green-600 to-emerald-700', description: 'Medical Emergency' },
  { name: 'Disaster Mgmt', number: '1077', icon: '⚠️', color: 'from-yellow-600 to-orange-700', description: 'Natural Disasters' },
  { name: 'Women Helpline', number: '1091', icon: '🛡️', color: 'from-pink-600 to-rose-700', description: 'Women Safety' },
  { name: 'Child Helpline', number: '1098', icon: '👶', color: 'from-purple-600 to-violet-700', description: 'Child Safety' },
];

export default function EmergencyModal() {
  const { emergencyModalOpen, setEmergencyModalOpen } = useUIStore();

  const handleCall = (number: string, name: string) => {
    window.location.href = `tel:${number}`;
    toast.success(`Calling ${name} (${number})...`, { icon: '📞' });
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
          if (navigator.share) {
            navigator.share({ title: '🚨 Emergency Location', text: 'My current location', url: mapsUrl });
          } else {
            navigator.clipboard.writeText(mapsUrl);
            toast.success('Location copied to clipboard!');
          }
        },
        () => toast.error('Unable to get location')
      );
    }
  };

  return (
    <AnimatePresence>
      {emergencyModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEmergencyModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl border border-red-500/30 w-full max-w-lg shadow-neon-pink overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-red-900/50 to-orange-900/30 border-b border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center animate-pulse">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-red-400 text-lg">EMERGENCY</h2>
                  <p className="text-xs text-gray-400">Quick access emergency services</p>
                </div>
              </div>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Emergency Contacts */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {emergencyContacts.map((contact) => (
                <button
                  key={contact.number}
                  onClick={() => handleCall(contact.number, contact.name)}
                  className={`group relative overflow-hidden p-4 rounded-xl bg-gradient-to-br ${contact.color} hover:scale-105 transition-all duration-200 text-left`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="relative z-10">
                    <div className="text-2xl mb-1">{contact.icon}</div>
                    <p className="font-bold text-white text-sm">{contact.name}</p>
                    <p className="text-xs text-white/80">{contact.description}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <Phone size={10} className="text-white" />
                      <span className="font-display font-bold text-white text-lg">{contact.number}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Share Location */}
            <div className="px-4 pb-4">
              <button
                onClick={handleShareLocation}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-all text-sm font-medium"
              >
                <MapPin size={16} />
                Share My Current Location
              </button>
            </div>

            <div className="px-4 pb-4 text-center">
              <p className="text-xs text-gray-500">
                🔒 In case of life-threatening emergency, call immediately. Stay calm and provide your location.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
