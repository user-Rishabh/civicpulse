import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState, useEffect } from 'react';

export default function CityHealthScore() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'issues'), (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const total = issues.length;
  const resolved = issues.filter(i => i.status === 'Resolved').length;
  const critical = issues.filter(i => i.severity === 'Critical').length;
  const pending = issues.filter(i => i.status === 'Pending').length;

  let score = 100;
  score -= pending * 3;
  score -= critical * 5;
  score += resolved * 2;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const getStatus = (s) => {
    if (s >= 75) return { label: 'Healthy', color: '#10B981', ring: '#10B981' };
    if (s >= 50) return { label: 'Moderate', color: '#F59E0B', ring: '#F59E0B' };
    if (s >= 25) return { label: 'Poor', color: '#F97316', ring: '#F97316' };
    return { label: 'Critical', color: '#EF4444', ring: '#EF4444' };
  };

  const { label, color, ring } = getStatus(score);
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#9CA3AF] text-xs uppercase tracking-widest mb-1">Mumbai City Health Score</p>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black" style={{ color }}>{score}</span>
            <span className="text-[#9CA3AF] text-xl mb-2">/100</span>
          </div>
          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: color + '20', color }}>
            {label}
          </span>
          <p className="text-[#6B7280] text-xs mt-3 max-w-xs">
            Score drops when issues are reported and rises when they are resolved. Officers are responsible for improving this score.
          </p>
        </div>

        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1F2937" strokeWidth="12" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={ring} strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{score}</span>
            <span className="text-[#9CA3AF] text-xs">/ 100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-5">
        {[
          { label: 'Total', value: total, color: 'text-blue-400' },
          { label: 'Pending', value: pending, color: 'text-yellow-400' },
          { label: 'Critical', value: critical, color: 'text-red-400' },
          { label: 'Resolved', value: resolved, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1F2937] rounded-xl p-3 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-[#9CA3AF] text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
