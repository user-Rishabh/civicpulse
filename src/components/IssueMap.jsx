import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mumbai area coords — spread across city zones
const MUMBAI_COORDS = [
  [19.0760, 72.8777], [19.0596, 72.8295], [19.1136, 72.8697],
  [19.0178, 72.8478], [19.0330, 72.8397], [19.1075, 72.8263],
  [18.9548, 72.8204], [19.0882, 72.9331], [19.2183, 72.9781],
  [19.1663, 72.9961], [19.0504, 72.8648], [19.0215, 72.8663],
  [19.1444, 72.8479], [19.0346, 72.9051], [18.9919, 72.8260],
];

const SEVERITY_CONFIG = {
  Critical: { color: '#EF4444', glow: 'rgba(239,68,68,0.6)', rgb: '239,68,68',    ripple: true,  size: 28 },
  High:     { color: '#F97316', glow: 'rgba(249,115,22,0.5)', rgb: '249,115,22',  ripple: false, size: 24 },
  Medium:   { color: '#F59E0B', glow: 'rgba(245,158,11,0.4)', rgb: '245,158,11',  ripple: false, size: 22 },
  Low:      { color: '#10B981', glow: 'rgba(16,185,129,0.4)', rgb: '16,185,129',  ripple: false, size: 20 },
};

const STATUS_CONFIG = {
  Resolved:    { color: '#10B981', heatColor: 'rgba(16,185,129,0.20)' },
  'In Progress': { color: '#3B82F6', heatColor: 'rgba(59,130,246,0.22)' },
  Pending:     { color: '#F59E0B', heatColor: 'rgba(245,158,11,0.22)' },
};

const CATEGORY_ICONS = {
  'Pothole':            '🕳️',
  'Water Leak':         '💧',
  'Broken Streetlight': '💡',
  'Garbage Dumping':    '🗑️',
  'Road Damage':        '🛣️',
  'Flooding':           '🌊',
  'Graffiti':           '🎨',
  'Tree Fall':          '🌳',
  'Sewage':             '⚠️',
  'Noise':              '🔊',
  'Encroachment':       '🏗️',
  'Other':              '📍',
};

const PULSE_EVENTS = [
  { icon: '🚨', text: 'New Issue Reported', color: '#EF4444' },
  { icon: '✅', text: 'Issue Resolved', color: '#10B981' },
  { icon: '👥', text: 'Community Verification', color: '#3B82F6' },
  { icon: '👮', text: 'Officer Assigned', color: '#8B5CF6' },
  { icon: '🤖', text: 'AI Duplicate Merge', color: '#F59E0B' },
  { icon: '⚡', text: 'AI Priority Escalation', color: '#F97316' },
];

// --- Heatmap layer using Canvas overlay ---
function HeatmapLayer({ issues }) {
  const map = useMap();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!issues.length) return;
    const canvas = L.DomUtil.create('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '400';
    map.getPanes().overlayPane.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
    };
    map.on('resize moveend zoomend', resize);
    resize();

    const draw = () => {
      const ctx = canvas.getContext('2d');
      const size = map.getSize();
      ctx.clearRect(0, 0, size.x, size.y);
      phaseRef.current = (phaseRef.current + 0.008) % (Math.PI * 2);
      const pulse = 0.7 + 0.3 * Math.sin(phaseRef.current);

      issues.forEach((issue, idx) => {
        const coord = MUMBAI_COORDS[idx % MUMBAI_COORDS.length];
        const pt = map.latLngToContainerPoint([coord[0], coord[1]]);
        const sc = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Medium;
        const r = 65 * pulse;
        const innerAlpha = +(0.55 * pulse).toFixed(3);
        const outerAlpha = 0;
        const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
        gradient.addColorStop(0,   `rgba(${sc.rgb},${innerAlpha})`);
        gradient.addColorStop(0.5, `rgba(${sc.rgb},${+(innerAlpha * 0.5).toFixed(3)})`);
        gradient.addColorStop(1,   `rgba(${sc.rgb},${outerAlpha})`);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      map.off('resize moveend zoomend', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [map, issues]);

  return null;
}

// --- Radar ripple ring for critical markers ---
function RadarRipples({ position, color }) {
  return (
    <>
      <Circle center={position} radius={80} pathOptions={{ color, fillColor: color, fillOpacity: 0.04, opacity: 0.15, weight: 1 }} />
      <Circle center={position} radius={150} pathOptions={{ color, fillColor: color, fillOpacity: 0.02, opacity: 0.08, weight: 1 }} />
    </>
  );
}

// --- Premium animated marker icon ---
function createSmartIcon(issue, idx) {
  const sc = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Medium;
  const icon = CATEGORY_ICONS[issue.category] || '📍';
  const size = sc.size;
  const animDelay = (idx % 5) * 200;

  const rippleHtml = sc.ripple ? `
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size * 2.5}px;height:${size * 2.5}px;border-radius:50%;background:${sc.color};opacity:0;animation:radarRipple 2s ${animDelay}ms ease-out infinite;z-index:-1;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size * 2}px;height:${size * 2}px;border-radius:50%;background:${sc.color};opacity:0;animation:radarRipple 2s ${animDelay + 700}ms ease-out infinite;z-index:-1;"></div>
  ` : '';

  const resolvedGlow = (issue.status === 'Resolved')
    ? `box-shadow:0 0 10px 3px rgba(16,185,129,0.7),0 0 0 2px rgba(16,185,129,0.4);`
    : `box-shadow:0 0 12px 4px ${sc.glow},0 2px 8px rgba(0,0,0,0.6);`;

  return L.divIcon({
    html: `
      <style>
        @keyframes radarRipple{0%{transform:translate(-50%,-50%) scale(0.4);opacity:0.6}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
        @keyframes markerFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes markerBounceIn{0%{transform:scale(0) translateY(-20px)}60%{transform:scale(1.15) translateY(2px)}80%{transform:scale(0.95)}100%{transform:scale(1) translateY(0)}}
        @keyframes markerPulse{0%,100%{box-shadow:0 0 12px 4px ${sc.glow},0 2px 8px rgba(0,0,0,0.6)}50%{box-shadow:0 0 22px 8px ${sc.glow},0 2px 16px rgba(0,0,0,0.7)}}
      </style>
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${rippleHtml}
        <div style="
          width:${size}px;height:${size}px;
          background:linear-gradient(135deg,${sc.color},${sc.color}cc);
          border:2.5px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          ${resolvedGlow}
          animation:markerBounceIn 0.6s ${animDelay}ms cubic-bezier(.34,1.56,.64,1) backwards,
                    markerFloat 3s ${animDelay + 200}ms ease-in-out infinite,
                    markerPulse 2.5s ${animDelay}ms ease-in-out infinite;
          display:flex;align-items:center;justify-content:center;
          position:relative;z-index:2;
        ">
          <span style="transform:rotate(45deg);font-size:${Math.floor(size * 0.5)}px;line-height:1;">${icon}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    className: '',
  });
}

// --- Premium glassmorphism popup ---
function PremiumPopup({ issue }) {
  const sc = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Medium;
  const icon = CATEGORY_ICONS[issue.category] || '📍';
  const aiConfidence = Math.floor(75 + Math.random() * 23);
  const trustScore = Math.floor(60 + Math.random() * 38);
  const verifiedCount = Math.floor(Math.random() * 12) + 1;

  return (
    <div style={{
      width: '280px',
      background: 'linear-gradient(135deg,rgba(15,23,42,0.97),rgba(30,41,59,0.97))',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${sc.color}40`,
      borderRadius: '16px',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 20px ${sc.glow}`,
    }}>
      {/* Image */}
      {issue.imagePreview && (
        <div style={{ position: 'relative', height: '110px', overflow: 'hidden' }}>
          <img src={issue.imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(15,23,42,0.9))' }} />
          <div style={{ position: 'absolute', bottom: '8px', left: '10px', display: 'flex', gap: '6px' }}>
            <span style={{ background: '#3B82F6', color: 'white', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em' }}>{issue.category}</span>
            <span style={{ background: sc.color + '33', color: sc.color, border: `1px solid ${sc.color}60`, padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>{issue.severity}</span>
          </div>
        </div>
      )}

      <div style={{ padding: '14px' }}>
        {!issue.imagePreview && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <span style={{ background: '#3B82F6', color: 'white', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>{issue.category}</span>
            <span style={{ background: sc.color + '33', color: sc.color, border: `1px solid ${sc.color}60`, padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>{issue.severity}</span>
          </div>
        )}

        {/* Description */}
        <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 10px', lineHeight: 1.5, fontWeight: 500 }}>
          {(issue.description || '').slice(0, 90)}{(issue.description || '').length > 90 ? '...' : ''}
        </p>

        {/* Location */}
        <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>📍</span> {issue.location}
        </p>

        {/* AI metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          {[
            { label: 'AI Confidence', value: `${aiConfidence}%`, color: '#3B82F6' },
            { label: 'Trust Score', value: `${trustScore}%`, color: '#10B981' },
            { label: 'Verified', value: `${verifiedCount} 👥`, color: '#8B5CF6' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '9px', color: '#64748B', marginTop: '2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Info row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
          {[
            { label: 'Department', value: issue.department || 'BMC' },
            { label: 'Est. Resolution', value: issue.estimatedDays ? `${issue.estimatedDays}d` : 'TBD' },
            { label: 'Priority', value: issue.severity },
            { label: 'Status', value: issue.status || 'Pending' },
          ].map(info => (
            <div key={info.label} style={{ fontSize: '11px' }}>
              <span style={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.06em' }}>{info.label}</span>
              <div style={{ color: '#E2E8F0', fontWeight: 700, marginTop: '1px' }}>{info.value}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          {[
            { label: '👍 Support', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: '#60A5FA' },
            { label: '✓ Verify', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: '#34D399' },
            { label: '🔍 Track', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', color: '#A78BFA' },
          ].map(btn => (
            <button key={btn.label} style={{
              background: btn.bg,
              border: `1px solid ${btn.border}`,
              borderRadius: '8px',
              padding: '6px 4px',
              fontSize: '10px',
              fontWeight: 800,
              color: btn.color,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}>{btn.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- AI Ops Widget ---
function AIOpsWidget({ issues }) {
  const [stats, setStats] = useState({
    monitoring: 847, processing: 12, merged: 34,
    verified: 156, officers: 8, avgRes: 4.2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(s => ({
        monitoring: s.monitoring + Math.floor(Math.random() * 5),
        processing: Math.max(1, s.processing + (Math.random() > 0.5 ? 1 : -1)),
        merged: s.merged + (Math.random() > 0.85 ? 1 : 0),
        verified: s.verified + (Math.random() > 0.7 ? 1 : 0),
        officers: Math.max(3, Math.min(15, s.officers + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))),
        avgRes: Math.max(1, Math.min(10, +(s.avgRes + (Math.random() * 0.2 - 0.1)).toFixed(1))),
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const rows = [
    { label: 'AI Monitoring', value: stats.monitoring.toLocaleString(), icon: '🤖', color: '#3B82F6' },
    { label: 'Processing', value: `${stats.processing} active`, icon: '⚙️', color: '#8B5CF6' },
    { label: 'Duplicates Merged', value: stats.merged, icon: '🔗', color: '#F59E0B' },
    { label: 'Community Verified', value: stats.verified, icon: '✅', color: '#10B981' },
    { label: 'Officers Active', value: stats.officers, icon: '👮', color: '#06B6D4' },
    { label: 'Avg Resolution', value: `${stats.avgRes}d`, icon: '⏱️', color: '#F97316' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        width: '200px',
        background: 'linear-gradient(135deg,rgba(3,7,18,0.95),rgba(15,23,42,0.95))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: '16px',
        padding: '14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5),0 0 30px rgba(59,130,246,0.08)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: '10px', fontWeight: 900, color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Operations</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>{row.icon}</span>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>{row.label}</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 900, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Live bar */}
      <div style={{ marginTop: '12px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg,transparent,#3B82F6,#06B6D4,transparent)' }}
        />
      </div>
    </motion.div>
  );
}

// --- City Health Card ---
function CityHealthCard({ issues }) {
  const total = issues.length;
  const resolved = issues.filter(i => (i.status || '').toLowerCase() === 'resolved').length;
  const critical = issues.filter(i => (i.severity || '').toLowerCase() === 'critical').length;
  const pending = issues.filter(i => (i.status || '').toLowerCase() === 'pending').length;

  let score = 100;
  score -= pending * 3; score -= critical * 5; score += resolved * 2;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const getStatus = (s) => {
    if (s >= 75) return { label: 'Healthy', color: '#10B981' };
    if (s >= 50) return { label: 'Moderate', color: '#F59E0B' };
    if (s >= 25) return { label: 'Poor', color: '#F97316' };
    return { label: 'Critical', color: '#EF4444' };
  };
  const { label, color } = getStatus(score);
  const circ = 2 * Math.PI * 28;
  const dash = circ - (score / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 1000,
        width: '190px',
        background: 'linear-gradient(135deg,rgba(3,7,18,0.95),rgba(15,23,42,0.95))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>City Health Score</div>

      {/* Ring + number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
          <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <motion.circle
              cx="32" cy="32" r="28" fill="none"
              stroke={color} strokeWidth="8"
              strokeDasharray={circ}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '8px', color: '#64748B', fontWeight: 600 }}>/100</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              <span style={{ color: '#EF4444', fontWeight: 700 }}>{critical}</span> Critical
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{resolved}</span> Resolved
            </div>
          </div>
        </div>
      </div>

      {/* mini bar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: '2px' }}
        />
      </div>
    </motion.div>
  );
}

// --- Live Civic Pulse Ticker ---
function LivePulseTicker() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const evt = PULSE_EVENTS[Math.floor(Math.random() * PULSE_EVENTS.length)];
      const id = ++counterRef.current;
      setToasts(prev => [...prev.slice(-3), { ...evt, id }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      bottom: '14px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      pointerEvents: 'none',
      width: '300px',
    }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              background: 'linear-gradient(135deg,rgba(3,7,18,0.96),rgba(15,23,42,0.96))',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${t.color}40`,
              borderRadius: '10px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 8px 24px rgba(0,0,0,0.4),0 0 12px ${t.color}20`,
              fontFamily: 'Inter, sans-serif',
              width: '100%',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
            <span style={{ fontSize: '12px' }}>{t.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#E2E8F0' }}>{t.text}</span>
            <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#475569', fontWeight: 600 }}>LIVE</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Map Controls (zoom fit) ---
function MapController({ issues }) {
  const map = useMap();
  useEffect(() => {
    if (issues.length > 0) {
      map.setView([19.0760, 72.8777], 11, { animate: true });
    }
  }, []);
  return null;
}

// --- MAIN EXPORT ---
export default function IssueMap({ issues = [], height = '450px' }) {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div style={{ height, position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 0 60px rgba(59,130,246,0.08),0 20px 60px rgba(0,0,0,0.4)' }}>

      {/* Overlays */}
      <CityHealthCard issues={issues} />
      <AIOpsWidget issues={issues} />
      <LivePulseTicker />

      {/* Map */}
      <MapContainer
        center={[19.0760, 72.8777]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />

        <MapController issues={issues} />
        {!prefersReduced && <HeatmapLayer issues={issues} />}

        {issues.map((issue, index) => {
          const coords = MUMBAI_COORDS[index % MUMBAI_COORDS.length];
          const sc = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Medium;
          return (
            <React.Fragment key={issue.id || index}>
              {issue.severity === 'Critical' && !prefersReduced && (
                <RadarRipples position={coords} color={sc.color} />
              )}
              <Marker
                position={coords}
                icon={createSmartIcon(issue, index)}
              >
                <Popup maxWidth={300} className="premium-popup">
                  <PremiumPopup issue={issue} />
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

      </MapContainer>

      {/* Legend bar */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        right: '14px',
        zIndex: 1000,
        background: 'rgba(3,7,18,0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: '8px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Severity</div>
        {[['Critical', '#EF4444'], ['High', '#F97316'], ['Medium', '#F59E0B'], ['Low', '#10B981']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Global popup style override */}
      <style>{`
        .premium-popup .leaflet-popup-content-wrapper { padding: 0; background: transparent; box-shadow: none; border: none; }
        .premium-popup .leaflet-popup-content { margin: 0; }
        .premium-popup .leaflet-popup-tip { background: rgba(15,23,42,0.97); }
        .leaflet-popup-close-button { color: #64748B !important; font-size: 16px !important; top: 6px !important; right: 8px !important; z-index: 10; }
      `}</style>
    </div>
  );
}
