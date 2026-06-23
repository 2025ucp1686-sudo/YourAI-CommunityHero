import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { motion } from 'framer-motion';
import { Filter, MapPin, Layers, AlertTriangle } from 'lucide-react';
import { getMockIssues } from '@/services/issueService';
import type { Issue, IssueCategory, IssueSeverity } from '@/types';
import { Link } from 'react-router-dom';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#162a52' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e3a6e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0f2040' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060d1a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
];

const markerColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const categoryEmoji: Record<string, string> = {
  pothole: '🕳️', water_leakage: '💧', garbage: '🗑️',
  streetlight: '💡', drainage: '🌊', road_damage: '🚧',
  infrastructure: '🏗️', other: '📋',
};

export default function GeoMapPage() {
  const issues = useMemo(() => getMockIssues(), []);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filterCat, setFilterCat] = useState<IssueCategory | 'all'>('all');
  const [filterSev, setFilterSev] = useState<IssueSeverity | 'all'>('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries: ['visualization'],
  });

  const center = { lat: 12.9716, lng: 77.5946 };

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (filterCat !== 'all' && i.category !== filterCat) return false;
      if (filterSev !== 'all' && i.severity !== filterSev) return false;
      return true;
    });
  }, [issues, filterCat, filterSev]);

  const heatmapData = useMemo(() => {
    if (!isLoaded || !window.google) return [];
    return filteredIssues.map((i) => new window.google.maps.LatLng(i.location.lat, i.location.lng));
  }, [filteredIssues, isLoaded]);

  if (!isLoaded) return (
    <div className="page-container flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-10 h-10 mx-auto mb-4" />
        <p className="text-gray-400">Loading map...</p>
        {!MAPS_API_KEY && (
          <p className="text-xs text-yellow-400 mt-2">⚠️ Add VITE_GOOGLE_MAPS_API_KEY to .env to enable maps</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container pb-0">
      <div className="section-container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-gradient mb-1">Live Issue Map</h1>
            <p className="text-gray-400 text-sm">{filteredIssues.length} issues in your area</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showHeatmap ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'glass-card border border-white/10 hover:border-white/20'}`}
            >
              <Layers size={14} /> Heatmap
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass-card border border-white/10 hover:border-white/20 transition-all"
            >
              <Filter size={14} /> Filter
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card rounded-2xl p-4 mb-4 flex flex-wrap gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value as any)} className="input-field text-sm py-1.5">
                <option value="all">All</option>
                {['pothole', 'water_leakage', 'garbage', 'streetlight', 'drainage', 'road_damage'].map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Severity</label>
              <select value={filterSev} onChange={(e) => setFilterSev(e.target.value as any)} className="input-field text-sm py-1.5">
                <option value="all">All</option>
                {['low', 'medium', 'high', 'critical'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* Legend */}
            <div className="ml-auto flex items-end gap-4">
              {Object.entries(markerColors).map(([sev, color]) => (
                <div key={sev} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  {sev}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Map */}
      <div style={{ height: 'calc(100vh - 240px)', minHeight: 400 }} className="relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={13}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Markers */}
          {!showHeatmap && filteredIssues.map((issue) => (
            <Marker
              key={issue.id}
              position={{ lat: issue.location.lat, lng: issue.location.lng }}
              onClick={() => setSelectedIssue(issue)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: markerColors[issue.severity],
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
          ))}

          {/* Heatmap */}
          {showHeatmap && heatmapData.length > 0 && (
            <HeatmapLayer
              data={heatmapData}
              options={{
                radius: 30,
                opacity: 0.8,
                gradient: ['transparent', 'rgba(0,212,255,0.3)', 'rgba(168,85,247,0.6)', 'rgba(239,68,68,1)'],
              }}
            />
          )}

          {/* Info Window */}
          {selectedIssue && (
            <InfoWindow
              position={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
              onCloseClick={() => setSelectedIssue(null)}
            >
              <div style={{ background: '#0a1628', color: 'white', padding: '12px', maxWidth: 240, borderRadius: 8 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{categoryEmoji[selectedIssue.category]}</div>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{selectedIssue.title}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{selectedIssue.location.address}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', padding: '2px 8px', borderRadius: 12, fontSize: 10 }}>
                    {selectedIssue.category.replace('_', ' ')}
                  </span>
                  <span style={{ background: `${markerColors[selectedIssue.severity]}20`, color: markerColors[selectedIssue.severity], padding: '2px 8px', borderRadius: 12, fontSize: 10 }}>
                    {selectedIssue.severity}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  ✓ {selectedIssue.verificationCount} verified
                </p>
                <a
                  href={`/tracking/${selectedIssue.id}`}
                  style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#00d4ff', textDecoration: 'none' }}
                >
                  View Details →
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
