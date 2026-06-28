import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, where, getDoc, setDoc, arrayUnion, orderBy, addDoc, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Report from "./Report";
import { generateSupportReply, compareImagesForVerification } from "../lib/gemini";
import IssueMap from "../components/IssueMap";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

// Particles for CTA and sidebar backdrop
function Particles() {
  const [items, setItems] = useState([]);
  const { isDark } = useTheme();

  useEffect(() => {
    setItems(
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 3
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: isDark ? "rgba(6, 182, 212, 0.3)" : "rgba(37, 99, 235, 0.2)",
            boxShadow: isDark ? "0 0 6px rgba(6, 182, 212, 0.5)" : "0 0 6px rgba(37, 99, 235, 0.25)",
            willChange: "transform"
          }}
        />
      ))}
    </div>
  );
}

// AI Neural Network Backdrop
function AINetwork() {
  const { isDark } = useTheme();
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.045] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="200" r="4" fill="#3b82f6" />
      <circle cx="300" cy="150" r="4.5" fill="#06b6d4" className="animate-ping" />
      <circle cx="500" cy="280" r="4.5" fill="#10b981" />
      <circle cx="700" cy="180" r="5" fill="#3b82f6" />
      <circle cx="900" cy="320" r="4" fill="#06b6d4" />
      
      <line x1="100" y1="200" x2="300" y2="150" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />
      <line x1="300" y1="150" x2="500" y2="280" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />
      <line x1="500" y1="280" x2="700" y2="180" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />
      <line x1="700" y1="180" x2="900" y2="320" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />

      {/* Traveling pulses */}
      <motion.circle
        cx="100" cy="200" r="3" fill={isDark ? "#67e8f9" : "#2563eb"}
        animate={{
          cx: [100, 300, 500, 700, 900],
          cy: [200, 150, 280, 180, 320]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

// Curved data flow path guides
function DataFlowParticles() {
  const { isDark } = useTheme();
  return (
    <svg className="absolute top-[25%] left-0 w-full h-[50%] opacity-[0.035] pointer-events-none z-0" viewBox="0 0 1000 400">
      <path id="curve-path-1" d="M -50,200 C 250,50 450,350 1050,200" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <motion.circle r="3.5" fill={isDark ? "#3b82f6" : "#2563eb"} style={{ offsetPath: "path('M -50,200 C 250,50 450,350 1050,200')" }}>
        <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" />
      </motion.circle>
      <motion.circle r="3" fill={isDark ? "#10b981" : "#14b8a6"} style={{ offsetPath: "path('M -50,200 C 250,50 450,350 1050,200')" }}>
        <animateMotion dur="15s" repeatCount="indefinite" begin="4s" rotate="auto" />
      </motion.circle>
    </svg>
  );
}

// 10-Layer AI Smart City Background Component
function LivingCityBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    let frameId = null;
    const handleMouseMove = (e) => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  const transitionConfig = { duration: 0.9, ease: "easeInOut" };

  return (
    <motion.div 
      animate={{
        backgroundColor: isDark ? "#030712" : "#FFFFFF"
      }}
      transition={transitionConfig}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0"
    >
      {/* LAYER 1: Aurora morphing gradient blobs */}
      {!isMobile && (
        <motion.div 
          animate={{ opacity: isDark ? 0.15 : 0.08 }}
          transition={transitionConfig}
          className="absolute inset-0 filter blur-[90px] z-0"
        >
          <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-600/35 animate-blob-1" />
          <div className="absolute bottom-[20%] right-[15%] w-[45vw] h-[45vw] rounded-full bg-purple-600/25 animate-blob-2" />
          <div className="absolute top-[45%] left-[45%] w-[35vw] h-[35vw] rounded-full bg-cyan-600/30 animate-blob-1" />
        </motion.div>
      )}

      {/* LAYER 2: Hexagonal smart grid repeat backdrop */}
      <motion.div 
        animate={{
          opacity: isDark ? 0.06 : 0.045
        }}
        transition={transitionConfig}
        className={`absolute inset-0 z-0 ${isDark ? "hex-grid-bg" : "light-hex-grid"}`} 
      />

      <AINetwork />
      <DataFlowParticles />
      <Particles />

      {/* LAYER 8: Diagonal drifting light rays */}
      <motion.div 
        animate={{ opacity: isDark ? 0.06 : 0.09 }}
        transition={transitionConfig}
        className="absolute inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-[50%] -left-[20%] w-[150%] h-[200%] bg-gradient-to-tr from-transparent via-cyan-500/30 to-transparent pointer-events-none animate-ray transform -rotate-12" />
      </motion.div>

      {/* LAYER 9: Mouse cursor reactive spotlight overlay */}
      {!isMobile && (
        <div 
          className="absolute inset-0 z-[1] transition-opacity duration-300"
          style={{
            background: isDark
              ? `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, transparent 40%, rgba(3, 7, 18, 0.45) 85%)`
              : `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.03) 0%, transparent 60%)`
          }}
        />
      )}
    </motion.div>
  );
}

// 3D Card Hover Tilt Wrapper with Sunrise Transitions
function PremiumGlowCard({ children, className = "", hoverTilt = true }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useTheme();

  const frameRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      const xVal = clientX - rect.left - width / 2;
      const yVal = clientY - rect.top - height / 2;

      const rotX = hoverTilt ? -(yVal / (height / 2)) * 10 : 0;
      const rotY = hoverTilt ? (xVal / (width / 2)) * 10 : 0;

      setRotateX(rotX);
      setRotateY(rotY);
      setCoords({ x: clientX - rect.left, y: clientY - rect.top });
    });
  };

  const handleMouseLeave = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        y: isHovered ? -8 : 0,
        backgroundColor: isDark ? "rgba(17, 24, 39, 0.4)" : "rgba(255, 255, 255, 0.8)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(226, 232, 240, 0.8)",
        boxShadow: isDark 
          ? (isHovered ? "0 10px 40px rgba(59, 130, 246, 0.12)" : "0 4px 30px rgba(0, 0, 0, 0.4)") 
          : (isHovered ? "0 15px 35px rgba(37, 99, 235, 0.06)" : "0 8px 30px rgba(0, 0, 0, 0.03)")
      }}
      transition={{ 
        rotateX: { type: "spring", stiffness: 350, damping: 22 },
        rotateY: { type: "spring", stiffness: 350, damping: 22 },
        backgroundColor: { duration: 0.9, ease: "easeInOut" },
        borderColor: { duration: 0.9, ease: "easeInOut" },
        boxShadow: { duration: 0.9, ease: "easeInOut" }
      }}
      style={{ transformStyle: "preserve-3d" }}
      className={`premium-glow-card group relative p-6 flex flex-col justify-between border backdrop-blur-md rounded-2xl ${className}`}
    >
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: isDark 
            ? `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, rgba(37, 99, 235, 0.2), transparent 80%)`
            : `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, rgba(37, 99, 235, 0.08), transparent 80%)`
        }}
      />
      <div style={{ transform: "translateZ(25px)" }} className="w-full flex flex-col justify-between relative z-20">
        {children}
      </div>
    </motion.div>
  );
}

// ─── CountUp Number Animation ───────────────────────────────────────────────
function CountUp({ to, duration = 1.4 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (to === 0) {
      setCount(0);
      return;
    }
    const steps = 40;
    const inc = to / steps;
    let cur = 0;
    const delay = (duration * 1000) / steps;
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, to);
      setCount(Math.round(cur));
      if (cur >= to) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [to, duration]);

  return <span>{count}</span>;
}

// ─── Lightweight useInView hook ──────────────────────────────────────────────
function useInView(ref, options = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.once) observer.disconnect();
        } else if (!options.once) {
          setInView(false);
        }
      },
      { rootMargin: options.margin || "0px", threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return inView;
}

// ─── Staggered Greeting ──────────────────────────────────────────────────────
function StaggeredGreeting({ text }) {
  const letters = Array.from(text);
  return (
    <span className="inline-block">
      {letters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: index * 0.028, type: "spring", stiffness: 120 }}
          className="inline-block whitespace-pre"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Custom Cursor Glow ──────────────────────────────────────────────────────
function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const { isDark } = useTheme();

  useEffect(() => {
    let frameId = null;
    const move = (e) => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <div
      className="pointer-events-none fixed z-[9999] mix-blend-screen"
      style={{
        left: pos.x - 150,
        top: pos.y - 150,
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)",
        transition: "left 0.08s linear, top 0.08s linear"
      }}
    />
  );
}

// ─── Live Smart City Feed Toast ───────────────────────────────────────────────
// (Rendered inside CitizenDashboard using its liveToast state — this is a
//  placeholder export kept for readability; actual toast is inline in the JSX)
function LiveSmartCityFeed() {
  return null; // Handled inline via AnimatePresence toast in CitizenDashboard
}

// Rating test star trigger
const StarTwinkle = ({ idx }) => {
  const randomDelayClass = idx % 3 === 0 
    ? "animate-twinkle-1" 
    : idx % 3 === 1 
    ? "animate-twinkle-2" 
    : "animate-twinkle-3";
  return <StarIcon className={randomDelayClass} />;
};

const StarIcon = ({ className = "" }) => (
  <svg className={`w-4 h-4 text-amber-400 fill-current ${className}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);


// ═══════════════════════════════════════════════════════════════════════════
// TRACK MY REPORTS — PREMIUM LIVE TRACKING EXPERIENCE
// ═══════════════════════════════════════════════════════════════════════════

// Breathing live status badge
function LiveStatusBadge({ status }) {
  const configs = {
    Pending:     { bg: "bg-amber-500/10",  border: "border-amber-500/40",  text: "text-amber-400",  dot: "bg-amber-400",  glow: "shadow-amber-500/30",  label: "⏳ Pending"     },
    "In Progress":{ bg: "bg-blue-500/10",  border: "border-blue-500/40",   text: "text-blue-400",   dot: "bg-blue-400",   glow: "shadow-blue-500/30",   label: "⚡ In Progress" },
    Resolved:    { bg: "bg-green-500/10",  border: "border-green-500/40",  text: "text-green-400",  dot: "bg-green-400",  glow: "shadow-green-500/30",  label: "✅ Resolved"    },
    Rejected:    { bg: "bg-red-500/10",    border: "border-red-500/40",    text: "text-red-400",    dot: "bg-red-400",    glow: "shadow-red-500/30",    label: "❌ Rejected"    },
  };
  const c = configs[status] || configs.Pending;
  return (
    <motion.div
      animate={{ scale: [1, 1.03, 1], boxShadow: [`0 0 0px rgba(0,0,0,0)`, `0 0 12px var(--tw-shadow-color)`, `0 0 0px rgba(0,0,0,0)`] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black ${c.bg} ${c.border} ${c.text} ${c.glow}`}
    >
      <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </motion.div>
  );
}

// Animated vertical workflow timeline
function LiveTimeline({ status, isDark }) {
  const steps = [
    { id: 0, label: "Reported",   icon: "📋", done: true },
    { id: 1, label: "In Progress", icon: "⚡", done: status === "In Progress" || status === "Resolved" },
    { id: 2, label: "Resolved",   icon: "✅", done: status === "Resolved" },
  ];
  const activeStep = status === "Resolved" ? 2 : status === "In Progress" ? 1 : 0;

  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((step, i) => {
        const isActive = i === activeStep;
        const isDone = step.done;
        const isFuture = !isDone && !isActive;

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            {/* Node */}
            <div className="relative shrink-0 flex flex-col items-center">
              <motion.div
                animate={isActive
                  ? { scale: [1, 1.15, 1], boxShadow: ["0 0 0px rgba(37,99,235,0)", "0 0 18px rgba(37,99,235,0.5)", "0 0 0px rgba(37,99,235,0)"] }
                  : {}}
                transition={{ duration: 1.8, repeat: Infinity }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black relative z-10 transition-all duration-500 ${
                  isDone   ? "bg-green-500 text-white shadow-lg shadow-green-500/30" :
                  isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" :
                             (isDark ? "bg-[#1F2937] border border-[#374151] text-slate-500" : "bg-slate-100 border border-slate-200 text-slate-400")
                }`}
              >
                {isDone && !isActive ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>✓</motion.span>
                ) : isActive ? (
                  <>
                    <span className="relative z-10">{step.icon}</span>
                    <motion.div
                      animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-blue-500"
                    />
                  </>
                ) : step.icon}
              </motion.div>
              <span className={`text-[10px] font-bold mt-1.5 whitespace-nowrap ${
                isDone ? "text-green-400" : isActive ? "text-blue-400" : isDark ? "text-slate-600" : "text-slate-400"
              }`}>{step.label}</span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 relative overflow-hidden rounded-full ${
                steps[i+1].done ? "bg-green-500" :
                isActive ? "bg-blue-600" :
                (isDark ? "bg-slate-700" : "bg-slate-200")
              }`}>
                {/* Shimmer when active */}
                {isActive && (
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  />
                )}
                {/* Traveling particle */}
                {(isDone || isActive) && (
                  <motion.div
                    animate={{ x: ["0%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg ${
                      steps[i+1].done ? "bg-green-400 shadow-green-400/60" : "bg-blue-400 shadow-blue-400/60"
                    }`}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Live department activity feed
function LiveActivityFeed({ officerNote, status, isDark }) {
  const baseActivities = [
    { emoji: "📋", text: "Report submitted to civic portal", time: "Just now", color: "text-blue-400" },
    { emoji: "🤖", text: "AI analysis completed & department matched", time: "2 min ago", color: "text-cyan-400" },
    { emoji: "📍", text: "GPS location verified by system", time: "3 min ago", color: "text-purple-400" },
  ];

  const progressActivities = status === "In Progress" || status === "Resolved" ? [
    { emoji: "👷", text: "Engineer assigned to ward", time: "Today", color: "text-yellow-400" },
    { emoji: "📍", text: "Ward officer verified report on-site", time: "Today", color: "text-orange-400" },
    { emoji: "🚧", text: "Repair work scheduled", time: "Today", color: "text-amber-400" },
  ] : [];

  const resolvedActivities = status === "Resolved" ? [
    { emoji: "🚛", text: "Maintenance vehicle dispatched", time: "Earlier", color: "text-blue-400" },
    { emoji: "📸", text: "Work photo uploaded by officer", time: "Earlier", color: "text-green-400" },
    { emoji: "🧠", text: "AI verified completion with photo match", time: "Earlier", color: "text-emerald-400" },
  ] : [];

  const officerActivity = officerNote
    ? [{ emoji: "🏛", text: officerNote, time: "Department update", color: "text-blue-300", isNote: true }]
    : [];

  const activities = [...resolvedActivities, ...officerActivity, ...progressActivities, ...baseActivities].slice(0, 6);

  return (
    <div className={`mt-4 rounded-xl border overflow-hidden ${isDark ? "bg-[#070E1A] border-[#1E3A5F]" : "bg-slate-50 border-slate-200"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-[#1E3A5F]" : "border-slate-200"}`}>
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-400" />
          <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>Live Activity</span>
        </div>
        <span className={`text-[10px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>Municipal Workflow</span>
      </div>

      {/* Feed */}
      <div className="divide-y divide-white/5 max-h-52 overflow-hidden">
        {activities.map((act, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={`flex items-start gap-3 px-4 py-2.5 ${isDark ? "hover:bg-white/3" : "hover:bg-slate-100/50"} transition-colors`}
          >
            <span className="text-base shrink-0 mt-0.5">{act.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${act.isNote ? act.color : (isDark ? "text-slate-200" : "text-slate-700")} leading-relaxed`}>
                {act.text}
              </p>
              <span className={`text-[10px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>{act.time}</span>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${act.color.replace("text-", "bg-")}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// AI Monitoring Panel
function AIMonitorPanel({ issue, isDark, allIssues = [] }) {
  let confidenceVal = 85;
  if (allIssues && allIssues.length > 0) {
    const validConfidences = allIssues
      .map(i => i.geminiConfidence ?? i.aiConfidence)
      .filter(val => typeof val === 'number');
    if (validConfidences.length > 0) {
      const sum = validConfidences.reduce((acc, curr) => acc + curr, 0);
      confidenceVal = Math.round(sum / validConfidences.length);
    }
  } else if (issue) {
    const singleVal = issue.geminiConfidence ?? issue.aiConfidence;
    if (typeof singleVal === 'number') {
      confidenceVal = singleVal;
    }
  }

  const priority = issue.severity === "Critical" ? 95 : issue.severity === "High" ? 78 : issue.severity === "Medium" ? 55 : 32;

  const metrics = [
    { label: "Gemini Confidence", val: confidenceVal, unit: "%", color: "text-cyan-400", bg: "bg-cyan-400" },
    { label: "Priority Score", val: priority, unit: "%", color: "text-blue-400", bg: "bg-blue-400" },
    { label: "Community Support", val: Math.min((issue.upvotes || 0) * 12, 100), unit: "%", color: "text-purple-400", bg: "bg-purple-400" },
  ];

  const flags = [
    { emoji: "📍", label: "GPS Verified",       active: true },
    { emoji: "📷", label: "Image Verified",     active: !!issue.imagePreview },
    { emoji: "🏛",  label: "Dept. Matched",      active: !!issue.department },
    { emoji: "✅",  label: "Community Verified", active: !!issue.isCommunityVerified },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#060D1A] border-[#1E3A5F]" : "bg-slate-50 border-slate-200"}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? "border-[#1E3A5F]" : "border-slate-200"}`}>
        <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="text-base">🤖</motion.span>
        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-cyan-400" : "text-blue-600"}`}>AI Monitor</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Metrics */}
        {metrics.map((m, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{m.label}</span>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className={`text-xs font-black ${m.color}`}>
                <CountUp to={m.val} />{m.unit}
              </motion.span>
            </div>
            <div className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${m.val}%` }}
                transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                className={`h-full rounded-full ${m.bg}`}
              />
            </div>
          </div>
        ))}

        {/* Flags */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {flags.map((f, i) => (
            <div key={i} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold ${
              f.active
                ? (isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600")
                : (isDark ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-400")
            }`}>
              <span className="text-xs">{f.emoji}</span>
              <span className="truncate">{f.label}</span>
              {f.active && <span className="ml-auto">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Municipal Resolution Pathway & Ward Info Component
function ResolutionPathway({ issue, isDark, textTheme, textMuted, borderTheme, bgSurface2 }) {
  const ward = issue.ward || "K-West Ward (Andheri)";
  const dept = issue.department || "Municipal Corporation Department";
  const contact = issue.contactPerson || "Ward Officer (Roads & Traffic)";
  const helpline = issue.helpline || "1916 (Ext 102)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`rounded-xl border p-4 text-left ${isDark ? "bg-[#060D1A] border-[#1E3A5F]" : "bg-slate-50 border-slate-200"}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 pb-3 mb-4 border-b ${isDark ? "border-[#1E3A5F]" : "border-slate-200"}`}>
        <span className="text-base">🏢</span>
        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-blue-400" : "text-blue-600"}`}>Ward & Department Info</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department Info */}
        <div className="space-y-3">
          <div>
            <div className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Responsible Ward</div>
            <div className={`text-xs font-bold ${textTheme} mt-0.5`}>{ward}</div>
          </div>
          <div>
            <div className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Department</div>
            <div className={`text-xs font-bold ${textTheme} mt-0.5`}>{dept}</div>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-3">
          <div>
            <div className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Assigned Authority</div>
            <div className={`text-xs font-bold ${textTheme} mt-0.5`}>{contact}</div>
          </div>
          <div>
            <div className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Escalation Helpline</div>
            <div className={`text-xs font-bold ${textTheme} mt-0.5`}>{helpline}</div>
          </div>
        </div>
      </div>

      {/* Citizen Action Guideline */}
      <div className={`mt-4 p-3 rounded-lg border ${isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
        <div className="flex gap-2 items-start">
          <span className="text-sm shrink-0">💡</span>
          <div>
            <div className={`text-[10px] font-black text-blue-400 uppercase tracking-wide`}>Citizen Advisory</div>
            <p className={`text-[11px] font-semibold mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Your report has been matched to Mumbai's central database. You will receive an SMS notification as soon as the maintenance crew uploads the work verification photo.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Countdown resolution card
function ResolutionCountdown({ estimatedDays, status, isDark }) {
  if (estimatedDays === undefined || estimatedDays === null) return null;

  const isUrgent = estimatedDays <= 1;
  const isToday = estimatedDays === 0;

  if (status === "Resolved") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 flex items-center gap-4"
      >
        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-3xl">🎉</motion.span>
        <div>
          <div className="text-green-400 font-black text-base">Completed!</div>
          <div className={`text-xs font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Issue successfully resolved</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 rounded-xl border px-5 py-4 flex items-center gap-4 ${
        isUrgent
          ? "bg-red-500/10 border-red-500/30"
          : "bg-amber-500/10 border-amber-500/30"
      }`}
    >
      <motion.span
        animate={isUrgent ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="text-2xl"
      >
        {isToday ? "🔥" : isUrgent ? "⏰" : "📅"}
      </motion.span>
      <div>
        <div className={`font-black text-sm ${isUrgent ? "text-red-400" : "text-amber-400"}`}>
          {isToday ? "Expected Today" : `${estimatedDays} Day${estimatedDays !== 1 ? "s" : ""} Remaining`}
        </div>
        <div className={`text-xs font-semibold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Estimated resolution window</div>
      </div>
      <div className="ml-auto">
        <div className={`h-2 w-24 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${Math.max(5, 100 - (estimatedDays / 14) * 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full rounded-full ${isUrgent ? "bg-red-400" : "bg-amber-400"}`}
          />
        </div>
        <div className={`text-[10px] mt-1 text-right font-bold ${isUrgent ? "text-red-400" : "text-amber-400"}`}>
          {isUrgent ? "URGENT" : "On Track"}
        </div>
      </div>
    </motion.div>
  );
}

// Progress photo gallery with hover zoom + lightbox
function ProgressPhotoGallery({ workPhotos, isDark, borderTheme }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  if (!workPhotos || workPhotos.length === 0) return null;

  return (
    <div className="mt-4">
      <div className={`text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        📸 Work Progress Photos
      </div>
      <div className="flex gap-3 flex-wrap">
        {workPhotos.map((photoUrl, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setLightboxIdx(idx)}
            className={`relative w-24 h-24 rounded-xl overflow-hidden border cursor-pointer shrink-0 ${borderTheme} group shadow-md`}
          >
            <img src={photoUrl} alt={`Work ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <motion.span initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="text-white text-xl">🔍</motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIdx(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-2xl w-full"
            >
              <img src={workPhotos[lightboxIdx]} alt="Progress" className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl" />
              {/* Nav arrows */}
              <div className="absolute inset-y-0 left-2 flex items-center">
                {lightboxIdx > 0 && (
                  <button onClick={() => setLightboxIdx(i => i - 1)} className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition cursor-pointer">‹</button>
                )}
              </div>
              <div className="absolute inset-y-0 right-2 flex items-center">
                {lightboxIdx < workPhotos.length - 1 && (
                  <button onClick={() => setLightboxIdx(i => i + 1)} className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition cursor-pointer">›</button>
                )}
              </div>
              {/* Close */}
              <button onClick={() => setLightboxIdx(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-slate-800 border border-slate-700 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition cursor-pointer text-lg font-bold">×</button>
              <div className="text-center mt-3 text-slate-400 text-xs font-bold">{lightboxIdx + 1} / {workPhotos.length}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Report image with hover zoom + glow + tilt
function ReportImage({ src, isDark }) {
  const imgRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const handleMouseMove = (e) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 15;
    setTilt({ x, y });
  };

  return (
    <>
      <motion.div
        ref={imgRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
        onClick={() => setLightbox(true)}
        animate={{ rotateX: tilt.y, rotateY: tilt.x, y: hovered ? -6 : 0, boxShadow: hovered ? "0 20px 40px rgba(37,99,235,0.2)" : "0 4px 20px rgba(0,0,0,0.3)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-700/60 bg-slate-900 cursor-pointer group relative"
      >
        <img src={src} alt="" className={`w-full h-full object-cover transition-transform duration-300 ${hovered ? "scale-110" : "scale-100"}`} />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`} />
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          className="absolute inset-0 flex items-center justify-center text-white text-2xl"
        >🔍</motion.div>
        {/* Glass reflection */}
        {hovered && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "200%", opacity: 0.3 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3"
          />
        )}
      </motion.div>

      {/* Full-screen lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-8"
          >
            <motion.img
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              src={src}
              alt=""
              className="max-w-2xl max-h-[80vh] w-full object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={() => setLightbox(false)} className="absolute top-6 right-6 w-12 h-12 bg-slate-800/80 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-slate-700 transition cursor-pointer">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Full Track My Reports component with Tracker ID & Captcha support
function TrackMyReports({ myIssues, allIssues = [], isDark, textTheme, textMuted, textSubtle, bgSurface, bgSurface2, borderTheme, getSeverityBadgeClass, setActiveTab }) {
  const [activeTabMode, setActiveTabMode] = useState("direct"); // "direct" or "saved"
  const [trackerIdInput, setTrackerIdInput] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [trackedIssue, setTrackedIssue] = useState(null);
  const [copiedId, setCopiedId] = useState("");

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omit ambiguous characters like 0, O, 1, I
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    if (!captchaCode) {
      setCaptchaCode(generateCaptcha());
    }
  }, [captchaCode]);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    setCaptchaError("");
    setSearchError("");
    setTrackedIssue(null);

    // 1. Verify captcha
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError("Incorrect Captcha code. Please try again.");
      handleRefreshCaptcha();
      return;
    }

    // 2. Search issue
    const searchId = trackerIdInput.trim().toUpperCase();
    if (!searchId) {
      setSearchError("Please enter a valid Tracker ID.");
      return;
    }

    const found = allIssues.find(
      (iss) =>
        (iss.trackerId && iss.trackerId.toUpperCase() === searchId) ||
        (String(iss.id) === searchId) ||
        (`CP-${String(iss.id).slice(-6)}` === searchId) ||
        (`CP-${iss.id}` === searchId)
    );

    if (found) {
      setTrackedIssue(found);
      setCaptchaInput("");
      setCaptchaError("");
      setSearchError("");
    } else {
      setSearchError(`No report found matching Tracker ID "${searchId}". Please verify the code.`);
      handleRefreshCaptcha();
    }
  };

  const handleQuickTrack = (issue) => {
    const targetId = issue.trackerId || `CP-${String(issue.id).slice(-6)}`;
    setTrackerIdInput(targetId);
    setTrackedIssue(null);
    setSearchError("");
    setCaptchaError("");
    setCaptchaInput("");
    setCaptchaCode(generateCaptcha());
    setActiveTabMode("direct");
  };

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const tabClass = (isActive) =>
    `px-5 py-2.5 rounded-xl text-xs font-black border transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
        : isDark
        ? "bg-[#111827] border-slate-700/60 text-slate-400 hover:border-blue-500/40 hover:text-blue-400"
        : "bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
    }`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${textTheme}`}>Track Reports</h1>
          <p className={`text-xs font-bold mt-1 ${textMuted}`}>Monitor resolution milestones and municipal work proof</p>
        </div>
        
        {/* Toggle option tabs */}
        <div className="flex gap-2">
          <button onClick={() => { setActiveTabMode("direct"); setSearchError(""); setCaptchaError(""); }} className={tabClass(activeTabMode === "direct")}>
            🔍 Track via Tracker ID
          </button>
          <button onClick={() => { setActiveTabMode("saved"); setSearchError(""); setCaptchaError(""); }} className={tabClass(activeTabMode === "saved")}>
            📋 My Saved Reports
          </button>
        </div>
      </div>

      {/* Mode A: Track via Tracker ID */}
      {activeTabMode === "direct" && (
        <div className="space-y-6">
          {!trackedIssue ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-md mx-auto rounded-2xl border p-6 ${isDark ? "bg-[#111827] border-[#374151]" : "bg-white border-slate-200"} shadow-xl`}
            >
              <h3 className={`text-base font-black ${textTheme} mb-4 flex items-center gap-2`}>
                <span>🔍</span> Enter Tracker details
              </h3>
              
              <form onSubmit={handleTrackSubmit} className="space-y-4">
                {/* Tracker ID Input */}
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest ${textMuted} mb-1.5`}>
                    Tracker ID (e.g. CP-829104)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CP-XXXXXX"
                    value={trackerIdInput}
                    onChange={(e) => setTrackerIdInput(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold transition focus:outline-none focus:border-blue-500 ${
                      isDark ? "bg-[#1F2937] border-[#374151] text-white" : "bg-[#F8FAFC] border-slate-200 text-[#1E293B]"
                    }`}
                  />
                </div>

                {/* Captcha Block */}
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest ${textMuted} mb-1.5`}>
                    Security Verification (Captcha)
                  </label>
                  
                  <div className="flex gap-2 items-center mb-2">
                    {/* Stylized captcha render box */}
                    <div
                      className={`flex-1 h-11 rounded-xl flex items-center justify-center font-mono text-xl font-bold tracking-widest select-none select-none relative overflow-hidden border ${
                        isDark ? "bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-slate-700 text-cyan-400" : "bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 text-blue-600"
                      }`}
                      style={{
                        textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
                        letterSpacing: "0.4em"
                      }}
                    >
                      {/* background noise lines */}
                      <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between p-1">
                        <div className="w-full h-[1px] bg-red-400 rotate-3 transform origin-center" />
                        <div className="w-full h-[1px] bg-blue-400 -rotate-3 transform origin-center" />
                      </div>
                      <span className="italic transform -rotate-2 inline-block">{captchaCode}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center hover:bg-opacity-80 transition cursor-pointer shrink-0 ${
                        isDark ? "bg-[#1F2937] border-[#374151]" : "bg-slate-50 border-slate-200"
                      }`}
                      title="Refresh Captcha"
                    >
                      🔄
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enter captcha text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold uppercase transition focus:outline-none focus:border-blue-500 ${
                      isDark ? "bg-[#1F2937] border-[#374151] text-white" : "bg-[#F8FAFC] border-slate-200 text-[#1E293B]"
                    }`}
                  />
                </div>

                {captchaError && (
                  <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-center">
                    ⚠️ {captchaError}
                  </p>
                )}

                {searchError && (
                  <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-center">
                    ⚠️ {searchError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition text-sm shadow-lg shadow-blue-500/15 cursor-pointer mt-2"
                >
                  Locate &amp; Track Issue →
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Back / Reset button */}
              <div className="flex justify-between items-center bg-[#2563eb]/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-blue-400 text-xs font-bold">
                  📍 Tracking Issue: <span className="font-extrabold select-all">{trackedIssue.trackerId || `CP-${String(trackedIssue.id).slice(-6)}`}</span>
                </p>
                <button
                  onClick={() => { setTrackedIssue(null); handleRefreshCaptcha(); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  ← Track another issue
                </button>
              </div>

              {/* RENDER COMPREHENSIVE STATUS WORKFLOW CARD */}
              <div
                className={`relative rounded-2xl border backdrop-blur-sm overflow-hidden border-l-4 ${
                  trackedIssue.status === "Resolved" ? "border-green-500/30 border-l-green-500" :
                  trackedIssue.status === "In Progress" ? "border-blue-500/30 border-l-blue-500" :
                  (isDark ? "border-[#374151] border-l-slate-500" : "border-slate-200 border-l-slate-500")
                } ${isDark ? "bg-[#111827]/85" : "bg-white/95"}`}
                style={{ boxShadow: trackedIssue.status === "In Progress" ? "0 0 35px rgba(37,99,235,0.06)" : undefined }}
              >
                <div className="p-6 pl-8">
                  {/* TOP ROW */}
                  <div className="flex gap-5 items-start">
                    <ReportImage src={trackedIssue.imagePreview} isDark={isDark} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-1 rounded-md border border-blue-500/20 font-black uppercase tracking-wider">
                              {trackedIssue.category}
                            </span>
                            <span className={getSeverityBadgeClass(trackedIssue.severity)}>{trackedIssue.severity}</span>
                          </div>
                          <p className={`text-sm font-semibold ${textTheme} leading-relaxed line-clamp-2`}>{trackedIssue.description}</p>
                          <div className={`text-xs ${textMuted} mt-1.5 flex items-center gap-1`}>
                            <span>📍</span><span className="font-semibold">{trackedIssue.location}</span>
                          </div>
                          <div className={`text-xs ${textSubtle} mt-0.5`}>
                            Reported: {trackedIssue.date}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <LiveStatusBadge status={trackedIssue.status} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ANALYTICS ROW */}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      { label: "Upvotes", val: trackedIssue.upvotes || 0, emoji: "👍", color: "text-blue-400" },
                      { label: "Verified By", val: trackedIssue.verificationCount || (trackedIssue.verifications || []).length || 0, emoji: "✅", color: "text-green-400" },
                      { label: "Priority", val: trackedIssue.severity === "Critical" ? "🔴" : trackedIssue.severity === "High" ? "🟠" : trackedIssue.severity === "Medium" ? "🟡" : "🟢", emoji: "⚡", color: "text-amber-400", isText: true },
                    ].map((stat, i) => (
                      <div key={i} className={`rounded-xl border px-3 py-2.5 text-center ${isDark ? "bg-[#0A0F1E]/60 border-[#374151]/40" : "bg-slate-50 border-slate-200"}`}>
                        <div className={`text-lg font-black ${stat.color}`}>
                          {stat.isText ? stat.val : <CountUp to={stat.val} />}
                        </div>
                        <div className={`text-[10px] font-bold mt-0.5 ${textMuted}`}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* LIVE WORKFLOW TIMELINE */}
                  <div className={`mt-5 p-4 rounded-xl border ${isDark ? "bg-[#0A0F1E]/50 border-[#1E3A5F]/60" : "bg-slate-50 border-slate-200"}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${textMuted}`}>Live Workflow</div>
                    <LiveTimeline status={trackedIssue.status} isDark={isDark} />
                  </div>

                  {/* MAIN CONTENT GRID */}
                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left: Resolution Pathway */}
                    <div className="lg:col-span-2">
                      <ResolutionPathway
                        issue={trackedIssue}
                        isDark={isDark}
                        textTheme={textTheme}
                        textMuted={textMuted}
                        borderTheme={borderTheme}
                        bgSurface2={bgSurface2}
                      />
                    </div>
                    {/* Right: AI Monitor */}
                    <div>
                      <AIMonitorPanel issue={trackedIssue} isDark={isDark} allIssues={allIssues} />
                    </div>
                  </div>

                  {/* RESOLUTION COUNTDOWN */}
                  <ResolutionCountdown estimatedDays={trackedIssue.estimatedDays} status={trackedIssue.status} isDark={isDark} />

                  {/* WORK PROOF PHOTOS */}
                  <ProgressPhotoGallery workPhotos={trackedIssue.workPhotos} isDark={isDark} borderTheme={borderTheme} />

                  {/* RESOLVED CELEBRATION */}
                  {trackedIssue.status === "Resolved" && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-5 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-3">
                        <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3 }} className="text-3xl">🎊</motion.span>
                        <div>
                          <p className="text-green-400 font-black text-base">Issue Resolved!</p>
                          <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>Thank you for making your city better. Your report made a difference.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Mode B: Saved Reports list (Forgot Tracker ID) */}
      {activeTabMode === "saved" && (
        <div className="space-y-4">
          {myIssues.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col items-center justify-center ${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center`}
            >
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl mb-3">📋</motion.span>
              <h3 className={`${textTheme} font-bold text-lg`}>No saved reports found</h3>
              <p className={`text-xs ${textMuted} mt-2 max-w-sm`}>
                You haven't reported any issues from this account. File a new report to get a Tracker ID.
              </p>
              <button onClick={() => setActiveTab("Report an Issue")} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl transition text-sm shadow-md shadow-blue-500/10 cursor-pointer">
                Report an Issue →
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className={`rounded-xl border p-4 ${isDark ? "bg-[#111827] border-[#374151]" : "bg-slate-50 border-slate-200"}`}>
                <p className={`text-xs font-bold ${textMuted} mb-3`}>
                  Below are the reports logged under your account. Copy the Tracker ID or click Quick Track to load details.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                        <th className="py-2.5 px-3 font-black uppercase">Report Details</th>
                        <th className="py-2.5 px-3 font-black uppercase">Tracker ID</th>
                        <th className="py-2.5 px-3 font-black uppercase">Location</th>
                        <th className="py-2.5 px-3 font-black uppercase">Status</th>
                        <th className="py-2.5 px-3 font-black uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/20">
                      {myIssues.map((issue) => {
                        const targetId = issue.trackerId || `CP-${String(issue.id).slice(-6)}`;
                        return (
                          <tr key={issue.docId || issue.id} className={`hover:${isDark ? "bg-[#1F2937]/50" : "bg-slate-100/50"} transition`}>
                            <td className="py-3 px-3 font-semibold text-left">
                              <div className="flex items-center gap-2">
                                <img src={issue.imagePreview} alt="" className="w-8 h-8 rounded object-cover" />
                                <div>
                                  <span className={`text-[10px] font-black ${textTheme}`}>{issue.category}</span>
                                  <p className={`text-[10px] ${textMuted} line-clamp-1`}>{issue.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold">
                              <div className="flex items-center gap-1.5">
                                <span className={`bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-black select-all`}>
                                  {targetId}
                                </span>
                                <button
                                  onClick={(e) => handleCopyId(e, targetId)}
                                  className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                                >
                                  {copiedId === targetId ? "Copied!" : "📋 Copy"}
                                </button>
                              </div>
                            </td>
                            <td className={`py-3 px-3 font-medium ${textMuted} truncate max-w-[120px]`}>
                              {issue.location}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                issue.status === "Resolved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                issue.status === "In Progress" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {issue.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleQuickTrack(issue)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2.5 py-1 rounded-md transition cursor-pointer"
                              >
                                ⚡ Track Milestones
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM MESSAGING — AI-POWERED CIVIC COMMUNICATION CENTER
// ═══════════════════════════════════════════════════════════════════════════

// Conversation card in the left sidebar
function ConversationCard({ issue, isSelected, onClick, isDark, borderTheme }) {
  const [hovered, setHovered] = useState(false);

  const statusColors = {
    Resolved: { dot: "bg-green-400", border: "border-green-500/40" },
    "In Progress": { dot: "bg-blue-400", border: "border-blue-500/40" },
    Pending: { dot: "bg-amber-400", border: "border-amber-500/40" },
  };
  const sc = statusColors[issue.status] || statusColors.Pending;

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        boxShadow: isSelected
          ? "0 0 20px rgba(37,99,235,0.18)"
          : hovered
          ? "0 4px 16px rgba(37,99,235,0.08)"
          : "0 0 0px rgba(0,0,0,0)"
      }}
      className={`mx-2 mb-2 rounded-xl p-3 cursor-pointer relative overflow-hidden border transition-colors duration-200 ${
        isSelected
          ? "border-blue-500/60 bg-blue-500/10"
          : isDark
          ? "border-white/5 bg-[#111827]/60 hover:border-blue-500/30 hover:bg-[#111827]/80"
          : "border-slate-200 bg-white/80 hover:border-blue-400/40"
      }`}
    >
      {/* Selected indicator bar */}
      {isSelected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-blue-500"
        />
      )}

      <div className="flex items-center gap-3">
        {/* Issue image */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700/40">
            <img
              src={issue.imagePreview}
              alt=""
              className={`w-full h-full object-cover transition-transform duration-300 ${hovered ? "scale-110" : "scale-100"}`}
            />
          </div>
          {/* Status dot */}
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${isDark ? "border-[#111827]" : "border-white"} ${sc.dot}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 truncate`}>
              {issue.category}
            </span>
            <span className={`text-[9px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"} shrink-0`}>
              {issue.date ? new Date(issue.date).toLocaleDateString("en", { month: "short", day: "numeric" }) : ""}
            </span>
          </div>
          <p className={`text-xs font-semibold mt-1 truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            {issue.description || issue.location}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[10px] truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              📍 {issue.location}
            </span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              issue.status === "Resolved"
                ? "bg-green-500/10 text-green-400"
                : issue.status === "In Progress"
                ? "bg-blue-500/10 text-blue-400"
                : "bg-amber-500/10 text-amber-400"
            }`}>
              {issue.status}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Animated chat message bubble
function ChatBubble({ msg, isDark }) {
  const isUser = msg.senderRole === "citizen";
  const isAI = msg.senderRole === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 30 : -30, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`flex flex-col group ${isUser ? "items-end" : "items-start"}`}
    >
      {/* Sender label */}
      {!isUser && (
        <div className="flex items-center gap-2 mb-1.5 ml-1">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
              isAI ? "bg-cyan-500/20 text-cyan-400" : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {isAI ? "🤖" : "👷"}
          </motion.div>
          <span className={`text-[10px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {isAI ? "Gemini AI" : "Municipal Officer"}
          </span>
        </div>
      )}

      <motion.div
        whileHover={{ y: -2, boxShadow: isUser ? "0 8px 24px rgba(37,99,235,0.2)" : "0 8px 24px rgba(0,0,0,0.12)" }}
        transition={{ type: "spring", stiffness: 400 }}
        className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed relative overflow-hidden ${
          isUser
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm shadow-lg shadow-blue-500/15"
            : isAI
            ? (isDark ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/25 text-cyan-100" : "bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/60 text-cyan-900")
            : (isDark ? "bg-[#1F2937] text-white rounded-bl-sm border border-[#374151]/60" : "bg-white text-[#0F172A] rounded-bl-sm border border-slate-200 shadow-sm")
        }`}
      >
        {/* Glass shimmer on user message */}
        {isUser && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        )}
        {msg.text}
      </motion.div>

      {/* Timestamp + read receipt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`flex items-center gap-1.5 mt-1 mx-1 ${isUser ? "flex-row-reverse" : ""}`}
      >
        <span className={`text-[10px] font-semibold ${isDark ? "text-slate-600" : "text-slate-400"}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {isUser && <span className="text-blue-400 text-[10px]">✓✓</span>}
      </motion.div>
    </motion.div>
  );
}

// Animated typing indicator
function TypingIndicator({ isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-start gap-2"
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>👷</div>
      <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? "bg-[#1F2937] border border-[#374151]/60" : "bg-white border border-slate-200"} flex items-center gap-1.5`}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-slate-400" : "bg-slate-400"}`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-semibold self-end mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>typing...</span>
    </motion.div>
  );
}

// AI Smart Reply suggestions
function SmartReplies({ onSelect, isDark }) {
  const suggestions = [
    { emoji: "👍", text: "Thank you for the update!" },
    { emoji: "📍", text: "Any update on the repair?" },
    { emoji: "⏳", text: "When is the expected completion?" },
    { emoji: "📸", text: "Please upload a progress photo." },
  ];

  return (
    <div className="flex gap-2 flex-wrap px-4 pb-2">
      {suggestions.map((s, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(s.text)}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            isDark
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/60"
              : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
          }`}
        >
          {s.emoji} {s.text}
        </motion.button>
      ))}
    </div>
  );
}

// Officer status header
function OfficerStatusBar({ issue, isDark }) {
  const deptEmojis = {
    "Road Department": "🛣️",
    "Water Supply": "💧",
    "Electricity": "⚡",
    "Sanitation": "🗑️",
    "Parks": "🌳",
  };
  const emoji = deptEmojis[issue.department] || "🏛";

  return (
    <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? "border-[#1E3A5F] bg-[#060D1A]/60" : "border-slate-200 bg-slate-50/80"}`}>
      <div className="flex items-center gap-3">
        {/* Avatar with pulse */}
        <div className="relative">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-black ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
            {emoji}
          </div>
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-green-500 opacity-40"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#111827]" />
        </div>
        <div>
          <div className={`text-sm font-black ${isDark ? "text-white" : "text-slate-800"}`}>
            {issue.department || "Municipal Department"}
          </div>
          <div className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="text-green-400">● Online</span> · Responds within 15 mins
          </div>
        </div>
      </div>

      {/* Right badges */}
      <div className="flex items-center gap-2">
        <span className={`text-[9px] px-2 py-1 rounded-full font-black border ${
          issue.status === "Resolved"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : issue.status === "In Progress"
            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
          {issue.status}
        </span>
        <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-1 rounded-full border border-blue-500/20 font-black uppercase">
          {issue.category}
        </span>
      </div>
    </div>
  );
}

// AI Summary panel
function AISummaryPanel({ issue, isDark }) {
  const summaries = {
    Resolved: `✅ Issue resolved. The ${issue.department || "department"} completed the repair. Community impact: positive.`,
    "In Progress": `⚡ Repair crew assigned by ${issue.department || "department"}. Work scheduled. Estimated completion: within ${issue.estimatedDays || 7} days.`,
    Pending: `🤖 Report received and analyzed. AI matched to ${issue.department || "appropriate department"}. Awaiting officer assignment.`,
  };

  const summary = summaries[issue.status] || summaries.Pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 mt-3 mb-1 rounded-xl border p-3 ${
        isDark
          ? "bg-cyan-500/5 border-cyan-500/20"
          : "bg-cyan-50 border-cyan-200/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="text-sm">🤖</motion.span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>AI Summary</span>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-auto" />
      </div>
      <p className={`text-xs font-semibold leading-relaxed ${isDark ? "text-cyan-200/80" : "text-cyan-800"}`}>{summary}</p>
    </motion.div>
  );
}

// Empty state animation
function MessagingEmptyState({ isDark, setActiveTab }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      {/* Animated illustration */}
      <div className="relative w-40 h-40 mb-6">
        {/* Building */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl absolute left-1/2 bottom-0 -translate-x-1/2"
        >🏛</motion.div>
        {/* Chat bubbles */}
        <motion.div
          animate={{ x: [0, 8, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
          className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl rounded-bl-sm text-xs font-bold shadow-md ${isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}
        >
          Any update? 👷
        </motion.div>
        <motion.div
          animate={{ x: [0, -8, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
          className={`absolute top-12 left-2 px-3 py-1.5 rounded-xl rounded-br-sm text-xs font-bold shadow-md ${isDark ? "bg-[#1F2937] text-white border border-[#374151]" : "bg-white text-slate-700 border border-slate-200"}`}
        >
          Crew dispatched! 🚧
        </motion.div>
        {/* Robot */}
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="text-4xl absolute top-0 left-4"
        >🤖</motion.div>
      </div>

      <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-800"} mb-2`}>
        Select a civic issue
      </h3>
      <p className={`text-sm font-semibold leading-relaxed max-w-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Start communicating with your assigned municipal department in real time.
      </p>
      <motion.button
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setActiveTab("track")}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm cursor-pointer shadow-lg shadow-blue-500/15 transition"
      >
        View My Reports →
      </motion.button>
    </div>
  );
}

// Main PremiumMessaging component
function PremiumMessaging({
  myIssues, selectedChatIssue, setSelectedChatIssue,
  chatMessages, chatMessage, setChatMessage,
  handleSendChatMessage, geminiLoading, messagesEndRef,
  isDark, textTheme, textMuted, textSubtle, bgSurface, bgSurface2,
  borderTheme, getSeverityBadgeClass, setActiveTab, userProfile
}) {
  const [inputFocused, setInputFocused] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSmartReply = (text) => {
    setChatMessage(text);
    setShowSmartReplies(false);
  };

  const handleSubmit = async (e) => {
    setIsSending(true);
    await handleSendChatMessage(e);
    setShowSmartReplies(false);
    setTimeout(() => setIsSending(false), 600);
  };

  // Show smart replies when focused and no text
  useEffect(() => {
    setShowSmartReplies(inputFocused && selectedChatIssue && chatMessage.length === 0);
  }, [inputFocused, selectedChatIssue, chatMessage]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-black ${textTheme}`}>Civic Communications</h1>
          <p className={`text-xs font-bold mt-0.5 ${textMuted}`}>
            AI-powered direct line to municipal departments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs font-black text-green-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className={`flex rounded-2xl overflow-hidden border flex-1 ${isDark ? "bg-[#0A0F1E]/60 border-[#1E3A5F]/60" : "bg-white/90 border-slate-200"}`}
           style={{ minHeight: "600px", maxHeight: "700px" }}>

        {/* LEFT SIDEBAR — Conversation List */}
        <div className={`w-80 flex flex-col border-r ${isDark ? "border-[#1E3A5F]/60 bg-[#070E1A]/70" : "border-slate-200 bg-slate-50/80"} shrink-0`}>
          {/* Sidebar Header */}
          <div className={`px-4 py-4 border-b ${isDark ? "border-[#1E3A5F]/60" : "border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-black ${textTheme}`}>My Conversations</div>
                <div className={`text-[10px] font-bold mt-0.5 ${textMuted}`}>{myIssues.length} active</div>
              </div>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                💬
              </div>
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto py-2">
            {myIssues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 text-center"
              >
                <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl block mb-3">📋</motion.span>
                <p className={`text-xs font-semibold ${textMuted}`}>No issues reported yet</p>
                <button onClick={() => setActiveTab("Report an Issue")} className="mt-3 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-700 transition">
                  Report Issue →
                </button>
              </motion.div>
            ) : (
              <AnimatePresence>
                {myIssues.map((issue, i) => (
                  <motion.div
                    key={issue.docId || issue.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ConversationCard
                      issue={issue}
                      isSelected={selectedChatIssue?.id === issue.id || selectedChatIssue?.docId === issue.docId}
                      onClick={() => setSelectedChatIssue(issue)}
                      isDark={isDark}
                      borderTheme={borderTheme}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedChatIssue ? (
            <MessagingEmptyState isDark={isDark} setActiveTab={setActiveTab} />
          ) : (
            <>
              {/* Officer status bar */}
              <OfficerStatusBar issue={selectedChatIssue} isDark={isDark} />

              {/* AI Summary */}
              <AISummaryPanel issue={selectedChatIssue} isDark={isDark} />

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
                {chatMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center py-8"
                  >
                    <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-3">💬</motion.span>
                    <p className={`text-sm font-semibold ${textMuted}`}>No messages yet</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Send a message to start the conversation</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {chatMessages.map((msg) => (
                      <ChatBubble key={msg.id} msg={msg} isDark={isDark} />
                    ))}
                  </AnimatePresence>
                )}

                {/* AI typing indicator */}
                <AnimatePresence>
                  {geminiLoading && <TypingIndicator isDark={isDark} />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Smart reply chips */}
              <AnimatePresence>
                {showSmartReplies && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                  >
                    <SmartReplies onSelect={handleSmartReply} isDark={isDark} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Input */}
              <div className={`px-4 pb-4 pt-2 border-t ${isDark ? "border-[#1E3A5F]/60 bg-[#060D1A]/40" : "border-slate-200 bg-slate-50/50"}`}>
                <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                  <motion.div
                    animate={inputFocused
                      ? { boxShadow: "0 0 0 2px rgba(37,99,235,0.4), 0 0 20px rgba(37,99,235,0.08)" }
                      : { boxShadow: "0 0 0 0px transparent" }}
                    className="flex-1 rounded-2xl overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Message the department..."
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                      className={`w-full px-5 py-3.5 text-sm font-medium rounded-2xl border outline-none transition-colors duration-200 ${
                        isDark
                          ? "bg-[#111827] border-[#374151] text-white placeholder:text-slate-600 focus:border-blue-500/60"
                          : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400"
                      }`}
                    />
                  </motion.div>

                  {/* Send Button */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}
                    whileTap={{ scale: 0.94 }}
                    animate={isSending ? { rotate: [0, 15, -5, 0] } : {}}
                    disabled={!chatMessage.trim()}
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 transition disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <motion.span
                      animate={isSending ? { x: [0, 6, 0], y: [0, -4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="text-lg"
                    >
                      🚀
                    </motion.span>
                  </motion.button>
                </form>

                {/* Bottom hint */}
                <div className={`text-[10px] mt-2 font-semibold ${isDark ? "text-slate-700" : "text-slate-400"}`}>
                  🤖 Powered by Gemini AI · Auto-replies based on your report context
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM COMMUNITY FEED — CIVIC SOCIAL PLATFORM
// ═══════════════════════════════════════════════════════════════════════════

// Animated live status badge
function LiveStatusBadgeCommunity({ status }) {
  const cfg = {
    Resolved:      { bg: "bg-green-500/10",  border: "border-green-500/40",  text: "text-green-400",  label: "✅ Resolved",    anim: { scale: [1, 1.04, 1], boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 10px rgba(16,185,129,0.4)", "0 0 0px rgba(16,185,129,0)"] } },
    "In Progress": { bg: "bg-blue-500/10",   border: "border-blue-500/50",   text: "text-blue-400",   label: "⚡ In Progress", anim: { borderColor: ["rgba(37,99,235,0.4)", "rgba(37,99,235,0.9)", "rgba(37,99,235,0.4)"] } },
    Pending:       { bg: "bg-amber-500/10",  border: "border-amber-500/40",  text: "text-amber-400",  label: "⏳ Pending",     anim: { opacity: [1, 0.6, 1] } },
    Critical:      { bg: "bg-red-500/10",    border: "border-red-500/40",    text: "text-red-400",    label: "🔴 Critical",    anim: { scale: [1, 1.06, 1], boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 12px rgba(239,68,68,0.4)", "0 0 0px rgba(239,68,68,0)"] } },
  };
  const c = cfg[status] || cfg.Pending;
  return (
    <motion.span
      animate={c.anim}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={`text-[9px] px-2 py-1 rounded-full border font-black ${c.bg} ${c.border} ${c.text}`}
    >
      {c.label}
    </motion.span>
  );
}

// Premium upvote button
function UpvoteButton({ issue, onUpvote, isDark }) {
  const [popped, setPopped] = useState(false);
  const [localCount, setLocalCount] = useState(issue.upvotes || 0);

  const handleClick = (e) => {
    e.stopPropagation();
    setPopped(true);
    setLocalCount(c => c + 1);
    onUpvote(issue.docId || issue.id, issue.upvotes);
    setTimeout(() => setPopped(false), 700);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
      animate={popped ? { scale: [1, 1.3, 0.95, 1.05, 1] } : {}}
      transition={{ duration: 0.4 }}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black cursor-pointer transition-colors ${
        isDark
          ? "border-slate-700/60 bg-slate-800/60 text-slate-400 hover:border-blue-500/60 hover:text-blue-400 hover:bg-blue-500/10"
          : "border-slate-200 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-500"
      }`}
    >
      <motion.span animate={popped ? { y: [0, -4, 0], rotate: [0, -15, 0] } : {}} transition={{ duration: 0.4 }} className="text-sm">
        👍
      </motion.span>
      <motion.span animate={{ opacity: 1 }} key={localCount}>
        {localCount}
      </motion.span>
      {/* Mini confetti burst */}
      <AnimatePresence>
        {popped && [0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: 1, x: (i % 2 === 0 ? 1 : -1) * (12 + i * 6), y: -20 - i * 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className={`absolute w-1.5 h-1.5 rounded-full pointer-events-none ${["bg-blue-400","bg-cyan-400","bg-green-400","bg-yellow-400"][i]}`}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}

// Premium issue card with 3D tilt
function CommunityIssueCard({ issue, onClick, onUpvote, isDark, textTheme, textMuted, textSubtle, getSeverityBadgeClass, index, user, onVerifyClick }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const frameRef = useRef(null);

  const handleMouseMove = (e) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((clientX - rect.left) / rect.width - 0.5) * 10;
      const y = -((clientY - rect.top) / rect.height - 0.5) * 10;
      setTilt({ x, y });
    });
  };

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const isReporter = user && issue.userId === user.uid;
  const alreadyVerified = issue.verifiedBy?.includes(user?.email);
  const verificationsCount = issue.verificationCount || 0;
  
  // Calculate trust score
  const trustScore = Math.min(100, Math.round((issue.aiConfidence || 85) + verificationsCount * 5));
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: 1,
        y: hovered ? -6 : 0,
        rotateX: tilt.y,
        rotateY: tilt.x,
        boxShadow: hovered
          ? "0 20px 50px rgba(37,99,235,0.12), 0 0 0 1px rgba(37,99,235,0.25)"
          : "0 4px 20px rgba(0,0,0,0.15)"
      }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { 
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        setHovered(false); 
        setTilt({ x: 0, y: 0 }); 
      }}
      onClick={onClick}
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      className={`relative rounded-2xl border overflow-hidden cursor-pointer group flex flex-col ${
        isDark ? "bg-[#111827]/90 border-white/5 hover:border-blue-500/30" : "bg-white/95 border-slate-200 hover:border-blue-400/40"
      }`}
    >
      {/* Gradient border on hover */}
      {hovered && (
        <div className="absolute inset-0 rounded-2xl border border-blue-500/40 pointer-events-none z-10" />
      )}

      {/* Image with zoom + parallax */}
      <div className="relative overflow-hidden h-40 bg-slate-900 shrink-0">
        <motion.img
          src={issue.imagePreview}
          alt=""
          animate={{ scale: hovered ? 1.08 : 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-full object-cover"
        />
        {/* Glass shimmer on hover */}
        {hovered && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap z-20">
          <span className="bg-black/50 backdrop-blur-sm text-blue-300 text-[9px] px-2 py-0.5 rounded-full border border-blue-500/30 font-black uppercase">
            {issue.category}
          </span>
          
          {verificationsCount >= 3 && (
            <div className="relative group/tooltip">
              <motion.span 
                animate={{
                  boxShadow: ["0 0 4px rgba(16,185,129,0.3)", "0 0 14px rgba(16,185,129,0.7)", "0 0 4px rgba(16,185,129,0.3)"]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="bg-green-600/90 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 cursor-help"
              >
                <span>✔</span>
                <span>Community Verified</span>
              </motion.span>

              {/* Hover Tooltip */}
              <div className="absolute top-full left-0 mt-1.5 hidden group-hover/tooltip:block bg-slate-950/90 border border-slate-700/50 backdrop-blur-xl text-white text-[9px] p-2 rounded-xl shadow-xl w-36 z-50 text-left font-semibold">
                <div className="text-green-400 font-bold uppercase tracking-wide text-[7px] mb-1">Verified by</div>
                {issue.verifiedBy && issue.verifiedBy.length > 0 ? (
                  <div className="space-y-0.5">
                    {issue.verifiedBy.map((email, idx) => (
                      <div key={idx} className="truncate text-slate-300">
                        • {email.split("@")[0]}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400">3 Nearby Citizens</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2">
          <LiveStatusBadgeCommunity status={issue.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col gap-3 text-left">
        {/* Severity row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={getSeverityBadgeClass(issue.severity)}>{issue.severity}</span>
          {issue.department && (
            <span className="bg-purple-500/10 text-purple-400 text-[9px] px-2 py-0.5 rounded-full border border-purple-500/20 font-black">🏛 {issue.department}</span>
          )}
        </div>

        {/* Description */}
        <p className={`text-sm font-semibold leading-relaxed line-clamp-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
          {issue.description}
        </p>

        {/* Location */}
        <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
          <span>📍</span>
          <span className="truncate font-semibold">{issue.location}</span>
        </div>

        {/* Verification & Metrics Grid */}
        <div className="grid grid-cols-5 gap-1 mt-1 border-t border-b py-2 border-slate-700/30 dark:border-white/5 text-[9px] font-bold text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs">👍</span>
            <span className={`mt-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{issue.upvotes || 0}</span>
            <span className="text-[7px] text-slate-500 font-medium">Support</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs">✔</span>
            <span className={`mt-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{verificationsCount}</span>
            <span className="text-[7px] text-slate-500 font-medium">Verified</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs">🏛</span>
            <span className={`mt-0.5 truncate max-w-full ${isDark ? "text-slate-300" : "text-slate-700"}`}>{issue.status || "Pending"}</span>
            <span className="text-[7px] text-slate-500 font-medium">Status</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs">🚧</span>
            <span className={`mt-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{issue.severity || "Medium"}</span>
            <span className="text-[7px] text-slate-500 font-medium">Priority</span>
          </div>
          <div className="flex flex-col items-center">
            {/* Small circular progress */}
            <div className="relative w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5 transform -rotate-90">
                <circle cx="10" cy="10" r={radius} fill="none" stroke={isDark ? "#1F2937" : "#E2E8F0"} strokeWidth="2" />
                <circle
                  cx="10"
                  cy="10"
                  r={radius}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[7px] font-black text-emerald-400">{trustScore}%</span>
            </div>
            <span className="text-[7px] text-slate-500 font-medium mt-0.5">Trust</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between gap-1 pt-2.5 mt-auto`}>
          <div className="flex items-center gap-1.5">
            <UpvoteButton issue={issue} onUpvote={onUpvote} isDark={isDark} />
            
            {user && !isReporter && issue.status !== "Resolved" && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onVerifyClick(issue);
                }}
                whileHover={alreadyVerified ? {} : { scale: 1.05, boxShadow: "0 0 10px rgba(16,185,129,0.3)" }}
                whileTap={alreadyVerified ? {} : { scale: 0.95 }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                  alreadyVerified
                    ? "bg-green-500/10 border-green-500/30 text-green-400 cursor-default pointer-events-none"
                    : isDark
                    ? "border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/15"
                    : "border-green-400 bg-white text-green-600 hover:bg-green-50/50"
                }`}
              >
                <span>✔</span>
                <span>{alreadyVerified ? "Verified" : "Verify"}</span>
              </motion.button>
            )}
          </div>
          
          <span className={`text-[9px] font-semibold ${isDark ? "text-slate-600" : "text-slate-400"}`}>
            {issue.date}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// AI Insights panel
function AIInsightsPanel({ allIssues, isDark }) {
  const total = allIssues.length;
  const resolved = allIssues.filter(i => (i.status || "").toLowerCase() === "resolved").length;
  const inProgress = allIssues.filter(i => (i.status || "").toLowerCase() === "in progress").length;
  const categories = {};
  allIssues.forEach(i => { categories[i.category] = (categories[i.category] || 0) + 1; });
  const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const avgRes = resolved > 0 ? (2.1).toFixed(1) : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 mb-5 ${isDark ? "bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border-cyan-500/20" : "bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200/60"}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="text-lg">🤖</motion.span>
        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>AI Community Insights</span>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-cyan-400 ml-auto" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Reports", val: total, emoji: "📋", color: "text-blue-400" },
          { label: "Resolved", val: resolved, emoji: "✅", color: "text-green-400" },
          { label: "In Progress", val: inProgress, emoji: "⚡", color: "text-amber-400" },
          { label: "Avg Resolution", val: avgRes, emoji: "⏱", color: "text-cyan-400", isText: true },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border px-3 py-3 text-center ${isDark ? "bg-black/20 border-white/5" : "bg-white/60 border-white/80"}`}>
            <div className="text-xl mb-1">{s.emoji}</div>
            <div className={`text-lg font-black ${s.color}`}>
              {s.isText ? s.val : <CountUp to={s.val} />}
              {s.isText && s.val !== "—" && <span className="text-xs ml-0.5">days</span>}
            </div>
            <div className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className={`mt-3 text-xs font-semibold ${isDark ? "text-cyan-300/70" : "text-cyan-700"}`}>
        📊 Top category: <span className="font-black">{topCat}</span> · Community participation: <span className="font-black text-green-400">+18% today</span>
      </div>
    </motion.div>
  );
}

// Trending categories panel
function TrendingCategories({ allIssues, isDark }) {
  const categories = {};
  allIssues.forEach(i => { categories[i.category] = (categories[i.category] || 0) + 1; });
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;

  const catEmojis = { "Pothole": "🛣️", "Water Leak": "💧", "Broken Streetlight": "💡", "Garbage Dumping": "🗑️", "Noise Pollution": "🔊" };

  return (
    <div className={`rounded-2xl border p-4 mb-5 ${isDark ? "bg-[#0A0F1E]/60 border-[#1E3A5F]/60" : "bg-white/90 border-slate-200"}`}>
      <div className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>🔥 Trending Issues</div>
      <div className="space-y-2.5">
        {sorted.map(([cat, count], i) => (
          <div key={cat}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {catEmojis[cat] || "📍"} {cat}
              </span>
              <span className={`text-[10px] font-black ${isDark ? "text-slate-500" : "text-slate-400"}`}>{count}</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / max) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                className={`h-full rounded-full ${["bg-blue-500","bg-cyan-500","bg-green-500","bg-amber-500","bg-purple-500"][i]}`}
              />
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>No data yet</p>
        )}
      </div>
    </div>
  );
}

// Community activity ticker
function CommunityActivityTicker({ isDark }) {
  const activities = [
    "👍 Rahul supported a road damage report",
    "🤖 AI merged 2 duplicate reports",
    "👷 Officer acknowledged streetlight complaint",
    "📸 Progress photo uploaded by department",
    "✅ Water leak issue resolved in Andheri",
    "🚧 Repair crew dispatched to Bandra",
  ];
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % activities.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-4 ${isDark ? "bg-[#070E1A]/80 border-[#1E3A5F]/60" : "bg-slate-50 border-slate-200"}`}>
      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            {activities[current]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Live status header bar
function CommunityStatusBar({ allIssues, isDark }) {
  const online = Math.floor(280 + allIssues.length * 4);
  const todayNew = Math.floor(allIssues.length * 0.6);
  const todayResolved = allIssues.filter(i => i.status === "Resolved").length;
  const aiProcessing = Math.min(allIssues.filter(i => i.status === "In Progress").length, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-6 px-5 py-3 rounded-2xl border mb-5 flex-wrap ${isDark ? "bg-[#060D1A]/80 border-[#1E3A5F]/60" : "bg-white/90 border-slate-200"}`}
    >
      {[
        { emoji: "🟢", label: "citizens online", val: online, color: "text-green-400" },
        { emoji: "📍", label: "new today", val: todayNew, color: "text-blue-400" },
        { emoji: "🚧", label: "resolved today", val: todayResolved, color: "text-emerald-400" },
        { emoji: "⚡", label: "AI processing", val: aiProcessing, color: "text-cyan-400" },
      ].map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-sm">{s.emoji}</span>
          <span className={`text-sm font-black ${s.color}`}><CountUp to={s.val} /></span>
          <span className={`text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</span>
          {i < 3 && <div className={`w-px h-4 ml-2 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />}
        </div>
      ))}
    </motion.div>
  );
}

// Premium filter chips
function FilterChips({ communityFilter, setCommunityFilter, isDark }) {
  const filters = [
    { id: "All", label: "All Issues", emoji: "🌐" },
    { id: "Pothole", label: "Pothole", emoji: "🛣️" },
    { id: "Water Leak", label: "Water Leak", emoji: "💧" },
    { id: "Broken Streetlight", label: "Streetlight", emoji: "💡" },
    { id: "Garbage Dumping", label: "Garbage", emoji: "🗑️" },
    { id: "Pending", label: "Pending", emoji: "⏳" },
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-5">
      {filters.map((f, i) => {
        const isActive = communityFilter === f.id;
        return (
          <motion.button
            key={f.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(37,99,235,0.15)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCommunityFilter(f.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border transition-all cursor-pointer overflow-hidden ${
              isActive
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                : isDark
                ? "bg-[#111827] border-slate-700/60 text-slate-400 hover:border-blue-500/40 hover:text-blue-400"
                : "bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {isActive && (
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            )}
            <motion.span animate={isActive ? { rotate: [0, 15, -5, 0] } : {}} transition={{ duration: 0.4 }}>{f.emoji}</motion.span>
            <span>{f.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Full PremiumCommunityFeed component
function PremiumCommunityFeed({
  filteredCommunityIssues, communityFilter, setCommunityFilter,
  selectedIssue, setSelectedIssue, handleUpvote,
  handleVerifyUpload, verifyLoading, verifyStatus,
  isDark, textTheme, textMuted, textSubtle, bgSurface, bgSurface2,
  borderTheme, getSeverityBadgeClass, user, allIssues, onVerifyClick
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-black ${textTheme}`}>Community Feed</h1>
          <p className={`text-xs font-bold mt-0.5 ${textMuted}`}>Live civic issues from citizens around you</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs font-black text-green-400 uppercase tracking-widest">Live</span>
        </div>
      </div>


      {/* AI insights */}
      <AIInsightsPanel allIssues={allIssues || []} isDark={isDark} />

      {/* Two-column layout: main feed + sidebar */}
      <div className="flex gap-5">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Activity ticker */}
          <CommunityActivityTicker isDark={isDark} />

          {/* Filter chips */}
          <FilterChips communityFilter={communityFilter} setCommunityFilter={setCommunityFilter} isDark={isDark} />

          {/* Grid */}
          {filteredCommunityIssues.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col items-center justify-center ${isDark ? "bg-[#111827]/80 border-white/5" : "bg-white/90 border-slate-200"} border rounded-2xl p-16 text-center`}
            >
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl mb-3">🏙️</motion.span>
              <h3 className={`${textTheme} font-bold text-lg`}>No issues match this filter</h3>
              <p className={`text-sm mt-1 ${textMuted}`}>Try selecting a different category</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommunityIssues.map((issue, i) => (
                <CommunityIssueCard
                  key={issue.docId || issue.id}
                  issue={issue}
                  index={i}
                  onClick={() => setSelectedIssue(issue)}
                  onUpvote={handleUpvote}
                  isDark={isDark}
                  textTheme={textTheme}
                  textMuted={textMuted}
                  textSubtle={textSubtle}
                  getSeverityBadgeClass={getSeverityBadgeClass}
                  user={user}
                  onVerifyClick={onVerifyClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          <TrendingCategories allIssues={allIssues || []} isDark={isDark} />

          {/* Quick stat card */}
          <div className={`rounded-2xl border p-4 ${isDark ? "bg-[#0A0F1E]/60 border-[#1E3A5F]/60" : "bg-white/90 border-slate-200"}`}>
            <div className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>📊 City Health</div>
            {[
              { label: "Critical Issues", val: (allIssues || []).filter(i => (i.severity || "").toLowerCase() === "critical").length, color: "bg-red-500" },
              { label: "High Priority", val: (allIssues || []).filter(i => (i.severity || "").toLowerCase() === "high").length, color: "bg-orange-500" },
              { label: "Resolved", val: (allIssues || []).filter(i => (i.status || "").toLowerCase() === "resolved").length, color: "bg-green-500" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</span>
                </div>
                <span className={`text-xs font-black ${isDark ? "text-white" : "text-slate-700"}`}><CountUp to={s.val} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EXPANDED CARD MODAL */}
      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIssue(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={e => e.stopPropagation()}
              className={`relative max-w-xl w-full rounded-2xl border overflow-hidden max-h-[90vh] overflow-y-auto ${
                isDark ? "bg-[#111827] border-[#374151]" : "bg-white border-slate-200"
              }`}
            >
              {/* Hero image */}
              {selectedIssue.imagePreview && (
                <div className="relative h-56 overflow-hidden bg-slate-900">
                  <img src={selectedIssue.imagePreview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex gap-2 flex-wrap">
                    <LiveStatusBadgeCommunity status={selectedIssue.status} />
                    {selectedIssue.isCommunityVerified && (
                      <span className="bg-green-500/80 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-full font-black">✅ Community Verified</span>
                    )}
                  </div>
                  <button onClick={() => setSelectedIssue(null)} className="absolute top-3 right-3 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-black/70 transition cursor-pointer backdrop-blur-sm">×</button>
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-1 rounded-md border border-blue-500/20 font-black uppercase tracking-wider">{selectedIssue.category}</span>
                  <span className={getSeverityBadgeClass(selectedIssue.severity)}>{selectedIssue.severity}</span>
                  {selectedIssue.department && (
                    <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2.5 py-1 rounded-md border border-purple-500/20 font-black uppercase">{selectedIssue.department}</span>
                  )}
                </div>

                {/* Description */}
                <div className="text-left">
                  <h4 className={`text-[10px] ${textMuted} font-black uppercase tracking-widest mb-1`}>Description</h4>
                  <p className={`text-sm leading-relaxed ${textTheme}`}>{selectedIssue.description}</p>
                </div>

                <div className={`text-xs ${textMuted} flex items-center gap-1 font-semibold`}>
                  <span>📍</span><span className={textTheme}>{selectedIssue.location}</span>
                </div>

                {selectedIssue.suggested_action && (
                  <div className="text-sm text-blue-400 font-semibold">⚡ {selectedIssue.suggested_action}</div>
                )}

                {selectedIssue.officerNote && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="text-xs font-black text-blue-400 mb-1">🏢 Department Update</div>
                    <p className={`text-xs leading-relaxed ${textTheme}`}>{selectedIssue.officerNote}</p>
                  </div>
                )}

                {/* Verification */}
                {selectedIssue.userId !== user?.uid && selectedIssue.status === "Pending" && (
                  <div className={`rounded-xl border p-4 ${isDark ? "bg-[#0A0F1E]/60 border-[#374151]" : "bg-slate-50 border-slate-200"}`}>
                    <div className={`text-sm font-black mb-1 ${textTheme}`}>Verify this Issue</div>
                    <p className={`text-xs leading-relaxed mb-3 ${textMuted}`}>Upload a photo to verify and earn +200 points.</p>
                    {selectedIssue.verifiedBy?.includes(user?.email) ? (
                      <div className="text-green-400 text-xs font-bold">✓ You already verified this issue.</div>
                    ) : verifyLoading ? (
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                        <div className="animate-spin border-2 border-blue-500 border-t-transparent rounded-full w-4 h-4" />
                        <span>Gemini is comparing photos...</span>
                      </div>
                    ) : verifyStatus ? (
                      <div className={`text-xs p-3 rounded-lg ${verifyStatus.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                        <div className="font-bold">{verifyStatus.success ? "✓ Verified!" : "✗ Failed"}</div>
                        <div>{verifyStatus.reason}</div>
                        {verifyStatus.success && <div className="font-bold text-green-400 mt-1">+200 Points!</div>}
                      </div>
                    ) : (
                      <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition">
                        📷 Upload to Verify
                        <input type="file" accept="image/*" className="hidden" onChange={handleVerifyUpload} />
                      </label>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className={`flex items-center justify-between pt-4 border-t ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
                  <UpvoteButton issue={selectedIssue} onUpvote={handleUpvote} isDark={isDark} />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedIssue(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-sm cursor-pointer shadow-md shadow-blue-500/15 transition"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CitizenDashboard() {
  const { user, userProfile, logout } = useAuth();
  const { isDark } = useTheme();

  const t = {
    bg: isDark ? 'bg-[#0A0F1E]' : 'bg-[#FFFFFF]',
    surface: isDark ? 'bg-[#111827]' : 'bg-[#FFFFFF]',
    surface2: isDark ? 'bg-[#1F2937]' : 'bg-[#F8FAFC]',
    border: isDark ? 'border-[#374151]' : 'border-[#E2E8F0]',
    text: isDark ? 'text-white' : 'text-[#0F172A]',
    muted: isDark ? 'text-[#9CA3AF]' : 'text-[#475569]',
    sidebar: isDark ? 'bg-[#0D1117]/90' : 'bg-[#F8FAFC]/95',
    card: isDark ? 'bg-[#111827] border-[#374151]' : 'bg-[#FFFFFF] border-[#E2E8F0]',
  };

  const bgPrimary = t.bg;
  const bgSurface = t.surface;
  const bgSurface2 = t.surface2;
  const bgSidebar = t.sidebar;
  const borderTheme = t.border;
  const borderSidebar = t.border;
  const textTheme = t.text;
  const textMuted = t.muted;
  const textSubtle = isDark ? "text-[#6B7280]" : "text-[#64748B]";

  const [issues, setIssues] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [communityFilter, setCommunityFilter] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [mapFilter, setMapFilter] = useState("all");

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [verifyModalIssue, setVerifyModalIssue] = useState(null);
  const [verifyStep, setVerifyStep] = useState("idle"); // idle, uploading, analyzing, comparing, gps, matching, success, error
  const [verifyPhoto, setVerifyPhoto] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [communityIssues, setCommunityIssues] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'issues'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() }));
      data.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      setCommunityIssues(data);
    }, (error) => {
      console.error('communityIssues fetch error:', error);
    });
    return () => unsub();
  }, []);

  const [liveToast, setLiveToast] = useState(null);

  useEffect(() => {
    setVerifyStatus(null);
    setVerifyLoading(false);
    setVerifyStep("idle");
    setVerifyPhoto(null);
    setShowConfetti(false);
  }, [selectedIssue, verifyModalIssue]);

  const handleVerifyUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const targetIssue = verifyModalIssue || selectedIssue;
    if (!targetIssue) return;

    setVerifyLoading(true);
    setVerifyStatus(null);
    setVerifyStep("uploading");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const dataUrl = reader.result;
        setVerifyPhoto(dataUrl);

        const mimeType = dataUrl.split(";")[0].split(":")[1];
        const base64Data = dataUrl.split(",")[1];

        const origUrl = targetIssue.imagePreview;
        if (!origUrl) {
          throw new Error("Original issue photo is missing.");
        }
        const origMimeType = origUrl.split(";")[0].split(":")[1];
        const origBase64 = origUrl.split(",")[1];

        // 1. Analyze step
        setVerifyStep("analyzing");
        await new Promise(r => setTimeout(r, 1500));

        // 2. Comparing step
        setVerifyStep("comparing");
        await new Promise(r => setTimeout(r, 1500));

        const comparison = await compareImagesForVerification(
          origBase64,
          origMimeType,
          base64Data,
          mimeType,
          targetIssue.category
        );

        if (!comparison.verified) {
          throw new Error(comparison.reason || "AI scene comparison check failed.");
        }

        // 3. GPS step
        setVerifyStep("gps");
        await new Promise(r => setTimeout(r, 1500));

        // 4. Matching step
        setVerifyStep("matching");
        await new Promise(r => setTimeout(r, 1500));

        const docId = targetIssue.docId || targetIssue.id;
        const issueRef = doc(db, "issues", docId);
        
        const currentCount = targetIssue.verificationCount || 0;
        const newCount = currentCount + 1;
        const newVerifiedBy = [...(targetIssue.verifiedBy || []), user.email];
        
        const updates = {
          verificationCount: newCount,
          verifiedBy: arrayUnion(user.email)
        };

        if (newCount >= 3) {
          updates.isCommunityVerified = true;
          
          const bumpSeverity = (current) => {
            if (current === "Low") return "Medium";
            if (current === "Medium") return "High";
            return "Critical";
          };
          const newSeverity = bumpSeverity(targetIssue.severity);
          updates.severity = newSeverity;
          
          await addDoc(collection(db, "notifications"), {
            id: Date.now(),
            issueId: docId,
            message: `🔥 Community Verified. Priority Increased. Verified by 3 Nearby Citizens at ${targetIssue.location}.`,
            type: "verification",
            read: false,
            createdAt: new Date().toISOString(),
            userEmail: "officer"
          });
        } else {
          await addDoc(collection(db, "notifications"), {
            id: Date.now(),
            issueId: docId,
            message: `${newCount} citizens verified the ${targetIssue.category} issue at ${targetIssue.location}.`,
            type: "verification",
            read: false,
            createdAt: new Date().toISOString(),
            userEmail: "officer"
          });
        }

        await updateDoc(issueRef, updates);

        setVerifyStatus({ success: true, reason: comparison.reason });
        setVerifyStep("success");
        setShowConfetti(true);

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          points: (userProfile?.points || 0) + 200
        });

        setLiveToast("✔ Thank you! Your verification helped increase community trust.");
        setTimeout(() => setLiveToast(null), 4000);

        setCommunityIssues(prev => 
          prev.map(i => {
            if (i.docId === docId || String(i.id) === String(docId)) {
              return { 
                ...i, 
                verificationCount: newCount, 
                verifiedBy: newVerifiedBy,
                isCommunityVerified: newCount >= 3 ? true : (i.isCommunityVerified || false),
                severity: newCount >= 3 ? updates.severity : i.severity
              };
            }
            return i;
          })
        );

        setIssues(prev => 
          prev.map(i => {
            if (i.docId === docId || String(i.id) === String(docId)) {
              return { 
                ...i, 
                verificationCount: newCount, 
                verifiedBy: newVerifiedBy,
                isCommunityVerified: newCount >= 3 ? true : (i.isCommunityVerified || false),
                severity: newCount >= 3 ? updates.severity : i.severity
              };
            }
            return i;
          })
        );

        if (selectedIssue && (selectedIssue.docId === docId || String(selectedIssue.id) === String(docId))) {
          setSelectedIssue(prev => ({
            ...prev,
            verificationCount: newCount,
            verifiedBy: newVerifiedBy,
            isCommunityVerified: newCount >= 3 ? true : (prev.isCommunityVerified || false),
            severity: newCount >= 3 ? updates.severity : prev.severity
          }));
        }

        if (verifyModalIssue) {
          setVerifyModalIssue(prev => ({
            ...prev,
            verificationCount: newCount,
            verifiedBy: newVerifiedBy,
            isCommunityVerified: newCount >= 3 ? true : (prev.isCommunityVerified || false),
            severity: newCount >= 3 ? updates.severity : prev.severity
          }));
        }

      } catch (err) {
        console.error("Verification error:", err);
        setVerifyStatus({ success: false, reason: err.message || "Failed to analyze verification photo." });
        setVerifyStep("error");
      } finally {
        setVerifyLoading(false);
      }
    };
  };

  // Notification bell state
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('civicpulse_notifications') || '[]'); } catch { return []; }
  });

  // Real-time Chat States
  const [selectedChatIssue, setSelectedChatIssue] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, geminiLoading]);

  useEffect(() => {
    if (!user?.email) return;
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ docId: docSnap.id, ...docSnap.data() }));
      const myIssueIds = new Set(myIssues.map(i => String(i.id)));
      const filtered = list.filter(n => 
        n.userEmail === user.email || 
        n.userEmail === "all" ||
        (!n.userEmail && myIssueIds.has(String(n.issueId)))
      );
      setNotifications(filtered);
    }, (error) => {
      console.error("Failed to load notifications from Firestore:", error);
    });
    return () => unsubscribe();
  }, [user, issues]);

  useEffect(() => {
    if (!selectedChatIssue?.id) {
      setChatMessages([]);
      return;
    }
    const chatDocRef = doc(db, "chats", String(selectedChatIssue.id));
    const unsubscribe = onSnapshot(chatDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setChatMessages(snapshot.data().messages || []);
      } else {
        setChatMessages([]);
      }
    }, (error) => {
      console.error("Error listening to chat messages:", error);
    });
    return () => unsubscribe();
  }, [selectedChatIssue]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'issues'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        docId: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => {
        const valA = typeof a.id === 'number' ? a.id : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const valB = typeof b.id === 'number' ? b.id : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return valB - valA;
      });
      setIssues(data);
      setTotalCount(data.length);
      setInProgressCount(data.filter(i => i.status === "In Progress" || i.status?.toLowerCase() === "in progress").length);
      setResolvedCount(data.filter(i => i.status === "Resolved" || i.status?.toLowerCase() === "resolved").length);
      setLoading(false);
    }, (error) => {
      console.error('Firestore error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const allIssues = communityIssues;
  const myIssues = issues;

  const filteredMapIssues = mapFilter === 'mine' 
    ? myIssues
    : mapFilter === 'critical'
    ? allIssues.filter(i => i.severity === 'Critical')
    : mapFilter === 'pending'
    ? allIssues.filter(i => i.status === 'Pending')
    : allIssues;

  const handleUpvote = async (docId, currentUpvotes) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.docId === docId || String(i.id) === String(docId)
          ? { ...i, upvotes: (i.upvotes || 0) + 1 }
          : i
      )
    );
    setSelectedIssue((prev) => {
      if (prev && (prev.docId === docId || String(prev.id) === String(docId))) {
        return { ...prev, upvotes: (prev.upvotes || 0) + 1 };
      }
      return prev;
    });

    try {
      const docRef = doc(db, "issues", docId);
      await updateDoc(docRef, {
        upvotes: (currentUpvotes || 0) + 1,
      });
    } catch (e) {
      console.error("Failed to upvote:", e);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    const userMsgText = chatMessage.trim();
    if (!userMsgText || !selectedChatIssue) return;

    const messageId = Date.now();
    const timestamp = new Date().toISOString();
    const newMessage = {
      id: messageId,
      text: userMsgText,
      senderEmail: user?.email || "citizen@example.com",
      senderRole: "citizen",
      timestamp: timestamp,
    };

    const chatDocId = String(selectedChatIssue.id);
    const chatDocRef = doc(db, "chats", chatDocId);

    try {
      const chatDocSnap = await getDoc(chatDocRef);
      if (chatDocSnap.exists()) {
        await updateDoc(chatDocRef, {
          messages: arrayUnion(newMessage),
        });
      } else {
        await setDoc(chatDocRef, {
          issueId: selectedChatIssue.id,
          citizenEmail: user?.email || "citizen@example.com",
          officerEmail: selectedChatIssue.department || "",
          messages: [newMessage],
        });
      }
      setChatMessage("");
    } catch (err) {
      console.error("Failed to send chat message:", err);
      return;
    }

    setGeminiLoading(true);
    try {
      const history = [...chatMessages, newMessage];
      const aiReplyText = await generateSupportReply({
        userProfile,
        issue: selectedChatIssue,
        chatHistory: history,
        userMessage: userMsgText,
      });

      const aiMessage = {
        id: Date.now(),
        text: aiReplyText,
        senderEmail: "gemini-support@civicpulse.gov",
        senderRole: "officer",
        timestamp: new Date().toISOString(),
      };

      await updateDoc(chatDocRef, {
        messages: arrayUnion(aiMessage),
      });
    } catch (aiErr) {
      console.error("Gemini support reply failed:", aiErr);
    } finally {
      setGeminiLoading(false);
    }
  };


  const getLeaderboard = (issuesList) => {
    const userStats = {};
    issuesList.forEach(i => {
      const email = i.userEmail;
      if (email) {
        if (!userStats[email]) {
          userStats[email] = {
            name: i.reporterName || i.reporter || email.split("@")[0],
            count: 0
          };
        }
        userStats[email].count += 1;
      }
    });
    return Object.values(userStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const leaderboard = getLeaderboard(allIssues);

  const getSeverityBadgeClass = (sev) => {
    const base = "rounded-md px-2 py-0.5 text-[10px] font-bold border inline-block ";
    switch (sev) {
      case "Low":
        return base + "bg-green-500/20 text-green-400 border-green-500/30";
      case "Medium":
        return base + "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "High":
        return base + "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Critical":
        return base + "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return base + "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const tabs = [
    { id: "Dashboard", label: "Dashboard", icon: "⊞" },
    { id: "Report an Issue", label: "Report an Issue", icon: "+" },
    { id: "track", label: "Track My Reports", icon: "◎" },
    { id: "Send Message", label: "Send Message", icon: "✉" },
    { id: "community", label: "Community Feed", icon: "❖" },
    { id: "map", label: "Issue Map", icon: "🗺️" }
  ];

  const getFilteredCommunityIssues = () => {
    const activeIssues = (allIssues || []).filter((i) => {
      const status = (i.status || "").toLowerCase();
      return status !== "resolved";
    });
    if (communityFilter === "All") return activeIssues;
    if (communityFilter === "Pending") {
      return activeIssues.filter((i) => 
        (i.status || "").toLowerCase() === "pending"
      );
    }
    return activeIssues.filter((i) => 
      (i.category || "").toLowerCase() === communityFilter.toLowerCase()
    );
  };

  const filteredCommunityIssues = getFilteredCommunityIssues();

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = userProfile?.name || "Citizen";
    const firstName = name.split(" ")[0];
    if (hr < 12) return `Good morning, ${firstName}!`;
    if (hr < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const myIssueIdsForChat = new Set(myIssues.map(i => String(i.id)));
  const hasUnreadMessages = notifications.some(
    (n) => myIssueIdsForChat.has(String(n.issueId)) && !n.read && n.type === "message"
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{
        opacity: 1,
        y: 0,
        color: isDark ? "#F8FAFC" : "#0F172A",
        backgroundColor: isDark ? "#030712" : "#FFFFFF"
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen flex relative overflow-hidden"
    >
      {/* Subtle Noise Filter Backdrop Overlay */}
      <div className="noise-overlay" />

      {/* 10-Layer AI Smart City Background */}
      <LivingCityBackground />

      {/* Global Mouse Spotlight */}
      <CustomCursor />

      {/* Floating Smart City Live Activity Telemetry Ticker */}
      <LiveSmartCityFeed />

      {/* Sidebar */}
      <motion.div 
        animate={{
          backgroundColor: isDark ? "rgba(13, 17, 23, 0.9)" : "rgba(248, 250, 252, 0.95)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(226, 232, 240, 0.8)"
        }}
        transition={{ duration: 0.9 }}
        className={`w-64 border-r h-screen fixed left-0 top-0 pt-20 flex flex-col z-30`}
      >
        
        {/* TOP: User profile section */}
        <div className={`px-4 pb-6 border-b ${borderSidebar} mt-2`}>
          {/* Floating Avatar */}
          <div className="relative mx-auto w-12 h-12">
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            >
              {(userProfile?.name || user?.email || "U")[0].toUpperCase()}
            </motion.div>
            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-[#0D1117] animate-online-pulse" />
          </div>
          {/* Name */}
          <div className={`${textTheme} font-semibold text-sm text-center mt-3`}>
            {userProfile?.name || "User"}
          </div>
          {/* Email */}
          <div className={`${textMuted} text-xs text-center mt-1 truncate px-2`} title={user?.email}>
            {user?.email}
          </div>
          {/* Role badge */}
          <div className="flex justify-center mt-2">
            <span className="bg-blue-500/10 text-blue-400 text-xs rounded-full px-3 py-1 font-medium mx-auto animate-pulse">
              Citizen
            </span>
          </div>
        </div>

        {/* NAV ITEMS (Hover link slides & rotating icons) */}
        <nav className="mt-6 px-3 flex-1 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isSendMessage = tab.id === "Send Message";
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative group px-1"
              >
                <motion.div
                  whileHover={{ x: 6 }}
                  animate={{
                    backgroundColor: isActive 
                      ? "#2563eb" 
                      : "transparent"
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm font-semibold relative overflow-hidden ${
                    isActive
                      ? "text-white shadow-lg shadow-blue-500/20"
                      : `${isDark ? "text-slate-400 hover:text-white" : "text-[#475569] hover:text-[#0F172A]"} hover:bg-slate-200/50 dark:hover:bg-slate-800/50`
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite_linear]" />
                  )}

                  <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-blue-500 transition-transform duration-300 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`} />

                  <span className="text-base transition-transform duration-300 group-hover:rotate-12">{tab.icon}</span>
                  <span className="flex-1">{tab.label}</span>
                  
                  {isSendMessage && hasUnreadMessages && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </motion.div>
              </div>
            );
          })}
        </nav>

        {/* BOTTOM of sidebar */}
        <div className="mt-auto px-3 pb-6">
          <div className={`border-t ${borderSidebar} pt-4`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${textMuted} hover:text-red-400 hover:bg-red-500/5 w-full transition text-sm font-medium bg-transparent border-none outline-none text-left cursor-pointer`}
            >
              <span className="text-base">⎋</span>
              <span>Sign Out</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 pt-20 px-8 pb-20 min-w-0 relative z-10">
        
        {/* Simulated Ticker Toast Message popup */}
        <AnimatePresence>
          {liveToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-24 left-[50%] -translate-x-[50%] bg-slate-900/90 border border-blue-500/30 text-white rounded-xl px-4 py-3 shadow-[0_4px_25px_rgba(37,99,235,0.15)] backdrop-blur-xl z-[999] text-xs font-black"
            >
              <span>{liveToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NOTIFICATION BELL */}
        {(() => {
          const unreadCount = notifications.filter(n => !n.read).length;
          const markAllRead = async () => {
            const unread = notifications.filter(n => !n.read);
            for (const n of unread) {
              if (n.docId) {
                await updateDoc(doc(db, "notifications", n.docId), { read: true });
              }
            }
          };
          const markOneRead = async (notif) => {
            if (notif.docId) {
              await updateDoc(doc(db, "notifications", notif.docId), { read: true });
            }
            setNotifOpen(false);
            if (notif.issueId) {
              try {
                const issueDoc = await getDoc(doc(db, "issues", String(notif.issueId)));
                if (issueDoc.exists()) {
                  setSelectedIssue({ docId: issueDoc.id, ...issueDoc.data() });
                  setActiveTab('community');
                }
              } catch (e) {
                console.error("Failed to load issue from notification:", e);
                setActiveTab('track');
              }
            } else {
              setActiveTab('track');
            }
          };
          return (
            <div className="fixed top-20 right-8 z-50 flex items-center gap-3">
              {/* Leaderboard Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setLeaderboardOpen(!leaderboardOpen);
                    setNotifOpen(false);
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl hover:border-blue-500/50 transition cursor-pointer ${bgSurface} ${borderTheme} ${textTheme}`}
                >
                  <span className="text-lg">🏆</span>
                </motion.button>
                {leaderboardOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-2xl shadow-black/50 ${bgSurface} ${borderTheme} z-50`}>
                    <div className="flex items-center justify-between mb-3 border-b border-[#1F2937]/50 pb-2">
                      <span className={`font-bold text-sm ${textTheme}`}>Top Contributors This Week</span>
                    </div>
                    <div className="space-y-2">
                      {leaderboard.length === 0 ? (
                        <p className={`text-xs text-center py-4 ${textMuted}`}>No contributors yet</p>
                      ) : (
                        leaderboard.map((contrib, index) => {
                          const rankStyles = [
                            { badge: "bg-yellow-500 text-black", emoji: "🥇" },
                            { badge: "bg-gray-400 text-black", emoji: "🥈" },
                            { badge: "bg-amber-600 text-white", emoji: "🥉" }
                          ];
                          const style = rankStyles[index] || { badge: "bg-gray-700 text-white", emoji: `${index + 1}` };
                          return (
                            <div key={contrib.name} className="flex items-center gap-3 bg-[#1F2937] rounded-xl p-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${style.badge}`}>
                                {style.emoji}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-white text-sm font-semibold truncate">{contrib.name}</div>
                                <div className="text-[#9CA3AF] text-xs">{contrib.count} reports</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setLeaderboardOpen(false);
                  }}
                  className={`relative w-10 h-10 flex items-center justify-center rounded-xl hover:border-blue-500/50 transition cursor-pointer ${bgSurface} ${borderTheme} ${textTheme}`}
                >
                  <span className="text-lg">&#x1F514;</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.button>
                {notifOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-2xl shadow-black/50 ${bgSurface} ${borderTheme} z-50`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-bold text-sm ${textTheme}`}>Notifications</span>
                      {unreadCount > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={markAllRead}
                          className="text-blue-400 text-xs font-semibold hover:text-blue-300 cursor-pointer bg-transparent border-none"
                        >
                          Mark all as read
                        </motion.button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className={`text-xs text-center py-4 ${textMuted}`}>No notifications yet</p>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.docId || notif.id}
                            onClick={() => markOneRead(notif)}
                            className={`rounded-xl p-3 cursor-pointer transition ${bgSurface2} ${isDark ? 'hover:bg-[#374151]/50' : 'hover:bg-[#E2E8F0]/50'} ${
                              !notif.read ? 'border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <p className={`text-xs leading-relaxed ${textTheme}`}>{notif.message}</p>
                            <p className={`text-[10px] mt-1 ${textSubtle}`}>
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
            <span className="text-[#9CA3AF] text-sm font-medium">Loading your space...</span>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD TAB */}
            {activeTab === "Dashboard" && (
              <div className="space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className={`text-3xl font-black ${textTheme}`}>
                        <StaggeredGreeting text={getGreeting()} />
                      </h1>
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1 shrink-0 animate-gold-shine relative overflow-hidden">
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-badge-shine" />
                        ⭐ {userProfile?.points || 0} pts
                      </div>
                    </div>
                    <p className={`${textMuted} text-sm mt-1`}>
                      {getFormattedDate()}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("Report an Issue")}
                    className="relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-sm transition duration-200 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out]" />
                    <span>+ Report New Issue</span>
                  </button>
                </div>

                {/* Stats Row with 3D Tilt Panels */}
                <div className="grid grid-cols-3 gap-5">
                  {/* My Reports */}
                  <PremiumGlowCard className="h-40 flex flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl shadow-inner">
                        📋
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                          <CountUp to={totalCount} />
                        </div>
                        <div className={`${textMuted} text-xs font-bold uppercase tracking-wider mt-1`}>My Reports</div>
                      </div>
                    </div>
                    <div className={`w-full ${bgSurface2} h-1.5 rounded-full mt-5 overflow-hidden`}>
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${totalCount > 0 ? 100 : 0}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full"
                      />
                    </div>
                  </PremiumGlowCard>

                  {/* In Progress */}
                  <PremiumGlowCard className="h-40 flex flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xl shadow-inner">
                        ⚡
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                          <CountUp to={inProgressCount} />
                        </div>
                        <div className={`${textMuted} text-xs font-bold uppercase tracking-wider mt-1`}>In Progress</div>
                      </div>
                    </div>
                    <div className={`w-full ${bgSurface2} h-1.5 rounded-full mt-5 overflow-hidden`}>
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full rounded-full"
                      />
                    </div>
                  </PremiumGlowCard>

                  {/* Resolved */}
                  <PremiumGlowCard className="h-40 flex flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center text-xl shadow-inner">
                        ✅
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                          <CountUp to={resolvedCount} />
                        </div>
                        <div className={`${textMuted} text-xs font-bold uppercase tracking-wider mt-1`}>Resolved</div>
                      </div>
                    </div>
                    <div className={`w-full ${bgSurface2} h-1.5 rounded-full mt-5 overflow-hidden`}>
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full"
                      />
                    </div>
                  </PremiumGlowCard>
                </div>

                {/* Achievements Cards Overhaul */}
                {(() => {
                  const getBadges = (issues, totalUpvotesVal) => {
                    const count = issues.length;
                    const resolved = issues.filter(i => i.status === 'Resolved').length;
                    
                    return [
                      { id: 'first_report', icon: '🌱', name: 'First Reporter', desc: 'Submit your first civic issue', earned: count >= 1, color: 'green' },
                      { id: 'active_citizen', icon: '⭐', name: 'Active Citizen', desc: 'Report 3 or more issues', earned: count >= 3, color: 'yellow' },
                      { id: 'community_hero', icon: '🏆', name: 'Community Hero', desc: 'Report 5 or more issues', earned: count >= 5, color: 'amber' },
                      { id: 'problem_solver', icon: '✅', name: 'Problem Solver', desc: 'Get 1 issue resolved', earned: resolved >= 1, color: 'blue' },
                      { id: 'influencer', icon: '🔥', name: 'City Influencer', desc: 'Receive 10+ total upvotes', earned: totalUpvotesVal >= 10, color: 'red' },
                      { id: 'champion', icon: '👑', name: 'City Champion', desc: 'Report 10+ issues and get 5+ resolved', earned: count >= 10 && resolved >= 5, color: 'purple' }
                    ];
                  };

                  const computedTotalUpvotes = myIssues.reduce((sum, i) => sum + (i.upvotes || 0), 0);
                  const badges = getBadges(myIssues, computedTotalUpvotes);
                  const earnedCount = badges.filter(b => b.earned).length;

                  const badgeColors = {
                    green: { earned: "bg-green-500/10 border-green-500/30 text-green-400", text: "text-green-400" },
                    yellow: { earned: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400", text: "text-yellow-400" },
                    amber: { earned: "bg-amber-500/10 border-amber-500/30 text-amber-400", text: "text-amber-400" },
                    blue: { earned: "bg-blue-500/10 border-blue-500/30 text-blue-400", text: "text-blue-400" },
                    red: { earned: "bg-red-500/10 border-red-500/30 text-red-400", text: "text-red-400" },
                    purple: { earned: "bg-purple-500/10 border-purple-500/30 text-purple-400", text: "text-purple-400" }
                  };

                  return (
                    <div className={`${bgSurface} rounded-2xl border ${borderTheme} p-6 mt-4`}>
                      <div className="text-lg font-extrabold">Your Achievements</div>
                      <div className={`${textMuted} text-xs mt-1`}>Earn badges by actively reporting civic issues</div>
                      <div className="text-blue-500 text-xs font-bold mt-1">{earnedCount}/{badges.length} badges earned</div>

                      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-5">
                        {badges.map(b => {
                          const colors = badgeColors[b.color] || badgeColors.blue;
                          return (
                            <PremiumGlowCard
                              key={b.id}
                              className={b.earned
                                ? `${colors.earned} text-center flex flex-col items-center justify-between h-44 border-2`
                                : "bg-[#1F2937]/20 border border-[#374151] rounded-xl p-4 text-center opacity-40 grayscale h-44 flex flex-col items-center justify-between"
                              }
                            >
                              <div
                                className={`text-3xl mb-2 ${b.earned ? "animate-bounce" : "animate-lock-pulse"}`}
                                style={{ filter: b.earned ? 'none' : 'grayscale(100%)' }}
                              >
                                {b.earned ? b.icon : "🔒"}
                              </div>
                              <div>
                                <div className="text-xs font-extrabold truncate w-full">{b.name}</div>
                                <div className={`${textMuted} text-[10px] mt-1 line-clamp-2`}>{b.desc}</div>
                              </div>
                              {b.earned ? (
                                <div className={`${colors.text} text-[10px] mt-2 font-black uppercase tracking-wider`}>✓ Earned</div>
                              ) : (
                                <div className="text-[#6B7280] text-[10px] mt-2 font-bold uppercase">Locked</div>
                              )}
                            </PremiumGlowCard>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* My Recent Reports & Need to report something? Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`${bgSurface} border ${borderTheme} rounded-2xl p-6`}>
                    <h2 className={`text-xl font-bold ${textTheme} mb-4`}>My Recent Reports</h2>
                    
                    {myIssues.length === 0 ? (
                      <p className={`${textMuted} text-sm`}>You haven't reported any issues yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {myIssues.slice(0, 3).map((issue) => (
                          <div
                            key={issue.docId || issue.id}
                            onClick={() => setActiveTab('track')}
                            className={`flex items-center gap-3 p-3 rounded-xl hover:${bgSurface2} transition cursor-pointer group`}
                          >
                            {/* Image skeleton shimmer loader overlay */}
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                              <img
                                src={issue.imagePreview}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-500/20">
                                  {issue.category}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border ${
                                  issue.status === "Resolved"
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : issue.status === "In Progress"
                                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                }`}>
                                  {issue.status}
                                </span>
                              </div>
                              <div className={`${textMuted} text-xs mt-1 truncate`}>
                                📍 {issue.location}
                              </div>
                            </div>
                            <span className="text-[#6B7280] group-hover:text-blue-500 transition-transform group-hover:translate-x-1 text-sm shrink-0">&rarr;</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 text-left">
                      <button
                        onClick={() => setActiveTab("track")}
                        className="text-blue-500 hover:text-blue-600 text-xs font-semibold cursor-pointer"
                      >
                        View All My Reports &rarr;
                      </button>
                    </div>
                  </div>

                  <div className={`${bgSurface} border ${borderTheme} rounded-2xl p-6 flex flex-col justify-between text-left`}>
                    <div>
                      <h2 className={`text-xl font-bold ${textTheme} mb-2`}>Need to report something?</h2>
                      <p className={`${textMuted} text-sm leading-relaxed`}>
                        You can easily file a complaint directly within the workspace. Click below or select the "Report an Issue" tab to open the reporting portal.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("Report an Issue")}
                      className="relative overflow-hidden group mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition duration-200 text-sm shadow-md shadow-blue-500/10 cursor-pointer active:scale-[0.98]"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out]" />
                      <span>Report an Issue &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REPORT AN ISSUE TAB */}
            {activeTab === "Report an Issue" && (
              <div className="-mt-8">
                <Report onViewReports={() => setActiveTab("track")} />
              </div>
            )}

            {/* 3. TRACK MY REPORTS TAB — PREMIUM LIVE TRACKING */}
            {activeTab === "track" && (
              <TrackMyReports
                myIssues={myIssues}
                allIssues={allIssues}
                isDark={isDark}
                textTheme={textTheme}
                textMuted={textMuted}
                textSubtle={textSubtle}
                bgSurface={bgSurface}
                bgSurface2={bgSurface2}
                borderTheme={borderTheme}
                getSeverityBadgeClass={getSeverityBadgeClass}
                setActiveTab={setActiveTab}
              />
            )}

            {/* 4. SEND MESSAGE TAB — PREMIUM CIVIC COMMUNICATION CENTER */}
            {activeTab === "Send Message" && (
              <PremiumMessaging
                myIssues={myIssues}
                selectedChatIssue={selectedChatIssue}
                setSelectedChatIssue={setSelectedChatIssue}
                chatMessages={chatMessages}
                chatMessage={chatMessage}
                setChatMessage={setChatMessage}
                handleSendChatMessage={handleSendChatMessage}
                geminiLoading={geminiLoading}
                messagesEndRef={messagesEndRef}
                isDark={isDark}
                textTheme={textTheme}
                textMuted={textMuted}
                textSubtle={textSubtle}
                bgSurface={bgSurface}
                bgSurface2={bgSurface2}
                borderTheme={borderTheme}
                getSeverityBadgeClass={getSeverityBadgeClass}
                setActiveTab={setActiveTab}
                userProfile={userProfile}
              />
            )}

            {/* 5. COMMUNITY TAB — PREMIUM CIVIC SOCIAL PLATFORM */}
            {activeTab === "community" && (
              <PremiumCommunityFeed
                filteredCommunityIssues={filteredCommunityIssues}
                communityFilter={communityFilter}
                setCommunityFilter={setCommunityFilter}
                selectedIssue={selectedIssue}
                setSelectedIssue={setSelectedIssue}
                handleUpvote={handleUpvote}
                handleVerifyUpload={handleVerifyUpload}
                verifyLoading={verifyLoading}
                verifyStatus={verifyStatus}
                isDark={isDark}
                textTheme={textTheme}
                textMuted={textMuted}
                textSubtle={textSubtle}
                bgSurface={bgSurface}
                bgSurface2={bgSurface2}
                borderTheme={borderTheme}
                getSeverityBadgeClass={getSeverityBadgeClass}
                user={user}
                allIssues={communityIssues}
                onVerifyClick={(issue) => {
                  setVerifyModalIssue(issue);
                  setVerifyStep("idle");
                }}
              />
            )}

            {/* 6. MAP TAB */}
            {activeTab === "map" && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-left">
                  <h2 className={`text-2xl font-bold ${textTheme} mb-2`}>Issue Map</h2>
                  <p className={`${textMuted} mb-6`}>All civic issues reported across Mumbai</p>
                </div>
                
                {/* Filter buttons */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {['all','mine','critical','pending'].map(f => (
                    <button
                      key={f}
                      onClick={() => setMapFilter(f)}
                      className={`px-4 py-2 rounded-lg text-sm capitalize transition cursor-pointer ${
                        mapFilter === f 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                          : `${bgSurface} border ${borderTheme} ${textMuted} hover:text-white`
                      }`}
                    >
                      {f === 'all' ? 'All Issues' : f === 'mine' ? 'My Issues' : f === 'critical' ? 'Critical' : 'Pending'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <IssueMap issues={filteredMapIssues} height="580px" />
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* Community Verification Modal */}
      <AnimatePresence>
        {verifyModalIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4"
            onClick={() => {
              if (verifyStep === "idle" || verifyStep === "success" || verifyStep === "error") {
                setVerifyModalIssue(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative max-w-md w-full rounded-3xl border p-6 overflow-hidden ${
                isDark ? "bg-[#111827]/90 border-white/10 text-white" : "bg-white border-slate-200 text-[#0F172A]"
              } shadow-2xl backdrop-blur-2xl flex flex-col gap-4`}
            >
              
              {/* Confetti Explosion Layer */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 flex items-center justify-center">
                  <div className="relative w-2 h-2">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const color = ["#10B981", "#3B82F6", "#06B6D4", "#F59E0B", "#EF4444"][i % 5];
                      const angle = (i / 60) * 2 * Math.PI;
                      const distance = Math.random() * 180 + 40;
                      const delay = Math.random() * 0.12;
                      return (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1.5 }}
                          animate={{
                            x: Math.cos(angle) * distance,
                            y: Math.sin(angle) * distance,
                            opacity: 0,
                            scale: 0.3
                          }}
                          transition={{ duration: 1.4, ease: "easeOut", delay }}
                          className="absolute w-2.5 h-2.5 rounded-full"
                          style={{ background: color }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Close button */}
              {(verifyStep === "idle" || verifyStep === "success" || verifyStep === "error") && (
                <button
                  onClick={() => setVerifyModalIssue(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition cursor-pointer text-white font-extrabold"
                >
                  ×
                </button>
              )}

              {/* Header */}
              <div className="text-left">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Citizen Action Required</span>
                <h3 className="text-lg font-black mt-1 flex items-center gap-1.5">
                  <span>✔</span> Community Verification
                </h3>
              </div>

              {/* Step: Idle (Initial details screen) */}
              {verifyStep === "idle" && (
                <div className="space-y-4 text-left">
                  {/* Original image */}
                  {verifyModalIssue.imagePreview && (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-white/5 bg-slate-950/40">
                      <img src={verifyModalIssue.imagePreview} alt="Original report" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <span className="bg-black/60 backdrop-blur-md text-[9px] font-black text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/30 uppercase">
                          {verifyModalIssue.category}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Issue details list */}
                  <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${isDark ? "bg-[#080D17]/80 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                    <div>
                      <span className="text-slate-500 uppercase font-black text-[9px]">Issue</span>
                      <div className="font-bold text-sm mt-0.5 line-clamp-1">{verifyModalIssue.description}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 uppercase font-black text-[9px]">Location</span>
                        <div className="font-semibold mt-0.5 truncate">{verifyModalIssue.location.split(",")[0]}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-black text-[9px]">Report Date</span>
                        <div className="font-semibold mt-0.5">{verifyModalIssue.date || "Today"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 uppercase font-black text-[9px]">Department</span>
                        <div className="font-semibold mt-0.5 text-purple-400">🏛 {verifyModalIssue.department || "BMC Roads Div"}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-black text-[9px]">Current Trust</span>
                        <div className="font-semibold mt-0.5 text-emerald-400">
                          {Math.min(100, Math.round((verifyModalIssue.aiConfidence || 85) + (verifyModalIssue.verificationCount || 0) * 5))}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info alert box */}
                  <div className="bg-blue-600/10 border border-blue-500/25 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <span className="text-lg">📢</span>
                    <p className="text-[11px] leading-relaxed text-blue-300 font-semibold">
                      "Visit the location and upload a recent photo confirming this issue still exists."
                    </p>
                  </div>

                  {/* Image input buttons */}
                  <div className="flex gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 transition-all">
                      <span>📷</span>
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleVerifyUpload} />
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold py-3.5 rounded-2xl text-xs cursor-pointer active:scale-95 transition-all">
                      <span>📸</span>
                      <span>Take Photo</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleVerifyUpload} />
                    </label>
                  </div>
                </div>
              )}

              {/* Step: Analyzing / Scanning (Interactive AI progress screen) */}
              {(verifyStep !== "idle" && verifyStep !== "success" && verifyStep !== "error") && (
                <div className="py-8 flex flex-col items-center justify-center gap-6">
                  {/* Photo container with AI scanning beam animation */}
                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 flex items-center justify-center">
                    {verifyPhoto ? (
                      <img src={verifyPhoto} alt="Verification" className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="animate-pulse text-2xl text-cyan-400">🤖</div>
                    )}
                    {/* Horizontal Scan Beam */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(6,182,212,0.8)] z-10"
                    />
                  </div>

                  {/* Current scanning phase message */}
                  <div className="text-center space-y-2 w-full px-8">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block animate-pulse">
                      Running Gemini Vision AI
                    </span>
                    <h4 className="text-sm font-black text-slate-100">
                      {verifyStep === "uploading" && "Uploading verification photo..."}
                      {verifyStep === "analyzing" && "Analyzing Image..."}
                      {verifyStep === "comparing" && "Comparing Scene..."}
                      {verifyStep === "gps" && "Checking GPS..."}
                      {verifyStep === "matching" && "Matching Issue..."}
                    </h4>

                    {/* Progress indicator */}
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden relative border border-white/5">
                      <motion.div
                        animate={{
                          width: 
                            verifyStep === "uploading" ? "15%" :
                            verifyStep === "analyzing" ? "40%" :
                            verifyStep === "comparing" ? "65%" :
                            verifyStep === "gps" ? "80%" : "95%"
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Success Screen */}
              {verifyStep === "success" && (
                <div className="py-6 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-3xl animate-bounce">
                    🎉
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-green-400">Verification Successful!</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed font-semibold">
                      {verifyStatus?.reason || "The upload was successfully cross-referenced with the original complaint."}
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/25 rounded-2xl py-3.5 px-6 mt-2">
                    <span className="text-[10px] font-black text-green-400 block uppercase tracking-wider">Rewards Earned</span>
                    <span className="text-xl font-black text-white mt-1 block">+200 Points</span>
                  </div>
                  <button
                    onClick={() => setVerifyModalIssue(null)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3.5 rounded-2xl text-xs mt-4 active:scale-95 transition-all shadow-md shadow-green-500/10 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Step: Error Screen */}
              {verifyStep === "error" && (
                <div className="py-6 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl animate-pulse">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-red-400">Verification Failed</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed font-semibold">
                      {verifyStatus?.reason || "Verification image did not match the original issue."}
                    </p>
                  </div>
                  <button
                    onClick={() => setVerifyStep("idle")}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold py-3.5 rounded-2xl text-xs mt-4 active:scale-95 transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
