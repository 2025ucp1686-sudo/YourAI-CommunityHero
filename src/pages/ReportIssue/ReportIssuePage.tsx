import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, MapPin, AlertTriangle, Loader, CheckCircle,
  X, Brain, Sparkles, Info, ChevronDown
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeIssueMedia, generateIssueSummary } from '@/services/geminiService';
import { createIssue, uploadIssueMedia } from '@/services/issueService';
import toast from 'react-hot-toast';
import type { IssueCategory, IssueSeverity, GeminiAnalysis, GeoLocation } from '@/types';

const categories: { value: IssueCategory; label: string; emoji: string }[] = [
  { value: 'pothole', label: 'Pothole', emoji: '🕳️' },
  { value: 'water_leakage', label: 'Water Leakage', emoji: '💧' },
  { value: 'garbage', label: 'Garbage', emoji: '🗑️' },
  { value: 'streetlight', label: 'Streetlight', emoji: '💡' },
  { value: 'drainage', label: 'Drainage', emoji: '🌊' },
  { value: 'road_damage', label: 'Road Damage', emoji: '🚧' },
  { value: 'infrastructure', label: 'Infrastructure', emoji: '🏗️' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

const severities: { value: IssueSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-400 border-green-400/30 bg-green-400/10' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  { value: 'high', label: 'High', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  { value: 'critical', label: 'Critical', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
];

export default function ReportIssuePage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'pothole' as IssueCategory,
    severity: 'medium' as IssueSeverity,
    address: '',
  });

  // File Drop
  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) return;
    const newPreviews = accepted.map((f) => URL.createObjectURL(f));
    setFiles(accepted);
    setPreviews(newPreviews);

    // Auto-analyze with Gemini
    if (accepted[0].type.startsWith('image/') || accepted[0].type.startsWith('video/')) {
      setAnalyzing(true);
      try {
        const analysis = await analyzeIssueMedia(accepted[0]);
        setGeminiAnalysis(analysis);
        setForm((prev) => ({
          ...prev,
          category: analysis.category,
          severity: analysis.severity,
          description: prev.description || analysis.summary,
        }));
        toast.success(`🤖 AI detected: ${analysis.category.replace('_', ' ')} (${Math.round(analysis.confidence * 100)}% confidence)`, { duration: 4000 });
      } catch {
        toast.error('AI analysis failed. Please fill details manually.');
      } finally {
        setAnalyzing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 5,
    maxSize: 50 * 1024 * 1024,
  });

  // Camera capture
  const cameraRef = useRef<HTMLInputElement>(null);
  const handleCamera = () => cameraRef.current?.click();

  // GPS
  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode using free API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
          setLocation({ lat, lng, address, city });
          setForm((prev) => ({ ...prev, address }));
          toast.success('📍 Location detected!');
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }
        setLocating(false);
      },
      () => { toast.error('Could not get location'); setLocating(false); }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) { toast.error('Please login first'); return; }
    if (!location) { toast.error('Please detect your location'); return; }
    if (!form.title.trim()) { toast.error('Please add a title'); return; }

    setSubmitting(true);
    try {
      let mediaUrls: string[] = [];
      const mediaTypes: ('image' | 'video')[] = [];

      if (files.length > 0) {
        toast.loading('Uploading media...');
        mediaUrls = await uploadIssueMedia(files, currentUser.uid);
        files.forEach((f) => mediaTypes.push(f.type.startsWith('video/') ? 'video' : 'image'));
        toast.dismiss();
      }

      const issueId = await createIssue({
        title: form.title,
        description: form.description,
        category: form.category,
        severity: form.severity,
        location: { ...location, address: form.address || location.address },
        mediaUrls,
        mediaTypes,
        reportedBy: currentUser.uid,
        reporterName: userProfile.displayName,
        reporterAvatar: userProfile.photoURL,
        geminiAnalysis: geminiAnalysis || undefined,
      });

      toast.success('🎉 Issue reported! +50 points earned!');
      navigate(`/tracking/${issueId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="section-container max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-bold text-3xl text-gradient mb-2">Report an Issue</h1>
          <p className="text-gray-400">AI will automatically detect and categorize your report</p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step >= s ? 'text-neon-blue' : 'text-gray-600'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${step > s ? 'bg-neon-blue border-neon-blue text-white' : step === s ? 'border-neon-blue' : 'border-gray-700'}`}>
                  {step > s ? <CheckCircle size={14} /> : s}
                </div>
                <span className="text-xs hidden sm:block">{['Media', 'Details', 'Location'][s - 1]}</span>
              </div>
              {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-neon-blue' : 'bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Media Upload */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`glass-card rounded-2xl p-8 text-center cursor-pointer transition-all border-2 border-dashed ${
                    isDragActive ? 'border-neon-blue/70 bg-neon-blue/5' : 'border-white/10 hover:border-neon-blue/40'
                  }`}
                >
                  <input {...getInputProps()} />
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
                  />
                  {previews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {previews.map((p, i) => (
                        <div key={i} className="relative aspect-video rounded-xl overflow-hidden">
                          {files[i]?.type.startsWith('video/') ? (
                            <video src={p} className="w-full h-full object-cover" />
                          ) : (
                            <img src={p} alt={`preview-${i}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFiles([]); setPreviews([]); setGeminiAnalysis(null); }}
                            className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Upload size={40} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-white font-medium mb-1">Drop images or videos here</p>
                      <p className="text-gray-500 text-sm">or click to browse • Max 50MB</p>
                    </>
                  )}
                </div>

                {/* Camera button */}
                <button
                  type="button"
                  onClick={handleCamera}
                  className="w-full btn-secondary flex items-center justify-center gap-2 py-3 rounded-xl"
                >
                  <Camera size={18} /> Capture from Camera
                </button>

                {/* Gemini Analysis Result */}
                <AnimatePresence>
                  {analyzing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 border border-neon-purple/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                          <Brain size={16} className="text-neon-purple animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Gemini AI Analyzing...</p>
                          <p className="text-xs text-gray-500">Detecting issue type and severity</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {geminiAnalysis && !analyzing && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 border border-neon-blue/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-neon-blue" />
                        <span className="text-sm font-semibold text-neon-blue">AI Analysis Complete</span>
                        <span className="ml-auto badge-green">{Math.round(geminiAnalysis.confidence * 100)}% confident</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="glass-card rounded-lg p-2">
                          <p className="text-gray-500">Category</p>
                          <p className="text-white font-medium capitalize">{geminiAnalysis.category.replace('_', ' ')}</p>
                        </div>
                        <div className="glass-card rounded-lg p-2">
                          <p className="text-gray-500">Severity</p>
                          <p className="text-white font-medium capitalize">{geminiAnalysis.severity}</p>
                        </div>
                        <div className="glass-card rounded-lg p-2">
                          <p className="text-gray-500">Authority</p>
                          <p className="text-white font-medium">{geminiAnalysis.authority}</p>
                        </div>
                        <div className="glass-card rounded-lg p-2">
                          <p className="text-gray-500">Est. Resolution</p>
                          <p className="text-white font-medium">{geminiAnalysis.estimatedResolutionDays} days</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 italic">"{geminiAnalysis.summary}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3 text-white font-bold rounded-xl">
                  Continue →
                </button>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Issue Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Brief title of the issue"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                        className={`glass-card rounded-xl p-2 text-center transition-all border ${
                          form.category === cat.value ? 'border-neon-blue bg-neon-blue/10' : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{cat.emoji}</div>
                        <div className="text-xs text-gray-400 leading-tight">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Severity</label>
                  <div className="grid grid-cols-4 gap-2">
                    {severities.map((sev) => (
                      <button
                        key={sev.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, severity: sev.value }))}
                        className={`border rounded-lg px-3 py-2 text-xs font-semibold transition-all ${sev.color} ${
                          form.severity === sev.value ? 'ring-2 ring-current' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 rounded-xl">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1 py-3 text-white font-bold rounded-xl">
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Location & Submit */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Location *</label>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locating}
                    className="w-full btn-secondary flex items-center justify-center gap-2 py-3 rounded-xl mb-3"
                  >
                    {locating ? <><div className="spinner w-4 h-4" /> Detecting...</> : <><MapPin size={16} /> Auto-Detect GPS Location</>}
                  </button>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Or enter address manually"
                    className="input-field"
                  />
                  {location && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle size={12} />
                      Location detected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </motion.div>
                  )}
                </div>

                {/* Summary */}
                <div className="glass-card rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={14} className="text-neon-blue" />
                    <span className="text-sm font-semibold">Report Summary</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Title</span>
                      <span className="text-white font-medium truncate ml-4">{form.title || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category</span>
                      <span className="capitalize text-white">{form.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Severity</span>
                      <span className="capitalize text-white">{form.severity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Media</span>
                      <span className="text-white">{files.length} file(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reward</span>
                      <span className="text-neon-green font-bold">+50 points</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3 rounded-xl">
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !location || !form.title}
                    className="btn-primary flex-1 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? <><div className="spinner w-5 h-5" /> Submitting...</> : <>Submit Report 🚀</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
