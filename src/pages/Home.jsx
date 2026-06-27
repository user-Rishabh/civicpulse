import { useEffect, useState, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence, useInView, useScroll, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import CityHealthScore from "../components/CityHealthScore";
import IssueMap from "../components/IssueMap";

// Custom SVG Icons
const ShieldCheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CpuIcon = () => (
  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ className = "" }) => (
  <svg className={`w-4 h-4 text-amber-400 fill-current ${className}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
  </svg>
);

// CountUp component using requestAnimationFrame
function CountUp({ to, duration = 1.5, decimals = 0, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = parseFloat(to);
    if (isNaN(end)) return;

    const totalMs = duration * 1000;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalMs, 1);
      const easeProgress = progress * (2 - progress); // Ease out quad
      const currentVal = start + easeProgress * (end - start);
      setCount(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(updateCount);
  }, [isInView, to, duration]);

  return (
    <span ref={ref}>
      {count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  );
}

// Particle system for CTA background
function Particles() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    setItems(
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 6 + 5,
        delay: Math.random() * 2
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -90, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 0.6, 0]
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
            background: "rgba(6, 182, 212, 0.4)",
            boxShadow: "0 0 10px rgba(6, 182, 212, 0.8)"
          }}
        />
      ))}
    </div>
  );
}

// Custom Cursor Trail Component
function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorType, setCursorType] = useState("default"); // default, card, button, hero

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const card = target.closest(".premium-glow-card, .glass-card");
      const button = target.closest("a, button, [role='button']");
      const heroIllustration = target.closest(".hero-illustration");

      if (heroIllustration) {
        setCursorType("hero");
      } else if (button) {
        setCursorType("button");
      } else if (card) {
        setCursorType("card");
      } else {
        setCursorType("default");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  const springConfig = { stiffness: 450, damping: 25 };
  const outerX = useSpring(position.x - 20, springConfig);
  const outerY = useSpring(position.y - 20, springConfig);

  return (
    <>
      {/* Inner Dot */}
      <div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-blue-500 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden md:block"
        style={{ left: position.x, top: position.y }}
      />
      {/* Outer Glow / Ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] hidden md:block"
        style={{
          left: outerX,
          top: outerY,
          width: cursorType === "button" ? 40 : cursorType === "hero" ? 75 : 40,
          height: cursorType === "button" ? 40 : cursorType === "hero" ? 75 : 40,
          border: cursorType === "button" ? "2px solid #2563EB" : "none",
          background: cursorType === "card" 
            ? "radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)" 
            : cursorType === "hero" 
            ? "radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)" 
            : cursorType === "button"
            ? "transparent"
            : "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
          filter: cursorType === "button" ? "none" : "blur(4px)",
          transition: "width 0.2s, height 0.2s, border 0.2s, background 0.2s"
        }}
      />
    </>
  );
}

// 3D Card Hover Tilt Wrapper
function PremiumGlowCard({ children, className = "", hoverTilt = true }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Coordinates from card center
    const xVal = e.clientX - rect.left - width / 2;
    const yVal = e.clientY - rect.top - height / 2;

    // Angle rotation limits (-12 to 12 deg)
    const rotX = hoverTilt ? -(yVal / (height / 2)) * 12 : 0;
    const rotY = hoverTilt ? (xVal / (width / 2)) * 12 : 0;

    setRotateX(rotX);
    setRotateY(rotY);
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        y: isHovered ? -10 : 0
      }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`premium-glow-card group relative p-8 flex flex-col items-start border border-white/5 bg-[#111827]/40 shadow-[0_4px_30px_rgba(0,0,0,0.4)] ${className}`}
    >
      {/* Radial glow layer centered on cursor coordinate */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(160px circle at ${coords.x}px ${coords.y}px, rgba(37, 99, 235, 0.2), transparent 80%)`
        }}
      />

      {/* Rotating border glow indicator */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

      {/* Content depth tilt wrapper */}
      <div style={{ transform: "translateZ(30px)" }} className="w-full flex flex-col items-start relative z-20">
        {children}
      </div>
    </motion.div>
  );
}

// FAQ Accordion Item component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PremiumGlowCard 
      hoverTilt={false}
      className={`transition-all duration-300 border p-5 ${
        isOpen ? "border-blue-500/25 bg-slate-950/60 shadow-[0_0_20px_rgba(37,99,235,0.06)]" : "border-white/5"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-bold text-base md:text-lg hover:text-blue-400 transition-colors focus:outline-none cursor-pointer group"
      >
        <motion.span 
          className="text-white relative z-10 inline-block"
          whileHover={{ x: 6 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {question}
        </motion.span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-blue-400 font-bold"
        >
          ▼
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="mt-3 text-sm leading-relaxed text-slate-400 font-medium pb-1">
          {answer}
        </p>
      </motion.div>
    </PremiumGlowCard>
  );
}

// Timeline Step item
function TimelineStep({ item, idx, isLast, progressY }) {
  const stepRef = useRef(null);
  const isInView = useInView(stepRef, { once: true, margin: "-100px" });

  const opacity = isInView ? 1 : 0.4;
  const isPulsing = isInView;

  return (
    <motion.div
      ref={stepRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="flex gap-6 md:gap-10 items-start text-left relative z-10"
      style={{ opacity }}
    >
      {/* Icon node */}
      <div className="relative shrink-0">
        <motion.div
          animate={isPulsing ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px rgba(59,130,246,0)", "0 0 15px rgba(59,130,246,0.3)", "0 0 0px rgba(59,130,246,0)"] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#07111F] border flex items-center justify-center shadow-lg transition-colors duration-300 ${
            isInView ? "border-blue-500 text-blue-400" : "border-white/10 text-slate-500"
          }`}
        >
          {item.icon}
        </motion.div>
        
        {/* Flip Number badge */}
        <motion.span 
          whileHover={{ rotateY: 180 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center border border-[#030712] cursor-pointer"
        >
          {item.step}
        </motion.span>
      </div>

      {/* Details Card */}
      <PremiumGlowCard className="flex-1 hover:border-blue-500/25 transition-all duration-300">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Step {item.step}</span>
        <h3 className="text-lg md:text-xl font-bold text-white mt-1">{item.title}</h3>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed font-medium">
          {item.desc}
        </p>
      </PremiumGlowCard>
    </motion.div>
  );
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

// SVG City Skyline with Blinking Windows
function Skyline() {
  return (
    <svg className="absolute bottom-0 left-0 w-full h-[280px] opacity-[0.06] pointer-events-none z-0 overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
      <rect x="30" y="100" width="70" height="200" fill="#1e293b" />
      <rect x="50" y="120" width="8" height="12" fill="#fef08a" className="animate-blink-1" />
      <rect x="75" y="120" width="8" height="12" fill="#fef08a" className="animate-blink-2" />
      <rect x="50" y="150" width="8" height="12" fill="#fef08a" className="animate-blink-2" />

      <rect x="140" y="60" width="90" height="240" fill="#0f172a" />
      <rect x="160" y="80" width="10" height="16" fill="#67e8f9" className="animate-blink-2" />
      <rect x="190" y="80" width="10" height="16" fill="#67e8f9" className="animate-blink-1" />
      <rect x="160" y="120" width="10" height="16" fill="#67e8f9" className="animate-blink-1" />

      <rect x="290" y="140" width="80" height="160" fill="#1e293b" />
      <rect x="310" y="160" width="8" height="12" fill="#fef08a" className="animate-blink-2" />
      <rect x="340" y="160" width="8" height="12" fill="#fef08a" className="animate-blink-1" />

      <rect x="420" y="90" width="100" height="210" fill="#0f172a" />
      <rect x="445" y="110" width="12" height="12" fill="#67e8f9" className="animate-blink-1" />
      <rect x="475" y="110" width="12" height="12" fill="#67e8f9" className="animate-blink-2" />

      <rect x="580" y="120" width="60" height="180" fill="#1e293b" />
      <rect x="690" y="80" width="110" height="220" fill="#0f172a" />
      <rect x="715" y="100" width="8" height="16" fill="#fef08a" className="animate-blink-1" />
      <rect x="755" y="100" width="8" height="16" fill="#fef08a" className="animate-blink-2" />
    </svg>
  );
}

// AI Node Network Layer
function AINetwork() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="220" r="4.5" fill="#3b82f6" />
      <circle cx="320" cy="170" r="5" fill="#06b6d4" className="animate-ping" />
      <circle cx="520" cy="320" r="4.5" fill="#10b981" />
      <circle cx="720" cy="200" r="5" fill="#3b82f6" />
      <circle cx="920" cy="370" r="4.5" fill="#06b6d4" />
      
      <line x1="120" y1="220" x2="320" y2="170" stroke="#64748b" strokeWidth="1" />
      <line x1="320" y1="170" x2="520" y2="320" stroke="#64748b" strokeWidth="1" />
      <line x1="520" y1="320" x2="720" y2="200" stroke="#64748b" strokeWidth="1" />
      <line x1="720" y1="200" x2="920" y2="370" stroke="#64748b" strokeWidth="1" />

      {/* Travelling pulse line */}
      <motion.circle
        cx="120"
        cy="220"
        r="3"
        fill="#67e8f9"
        animate={{
          cx: [120, 320, 520, 720, 920],
          cy: [220, 170, 320, 200, 370]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

// Curved data flow path guides
function DataFlowParticles() {
  return (
    <svg className="absolute top-[25%] left-0 w-full h-[50%] opacity-[0.035] pointer-events-none z-0" viewBox="0 0 1000 400">
      <path id="curve-path-1" d="M -50,200 C 250,50 450,350 1050,200" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      
      <motion.circle r="3.5" fill="#3b82f6" style={{ offsetPath: "path('M -50,200 C 250,50 450,350 1050,200')" }}>
        <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" />
      </motion.circle>
      
      <motion.circle r="3" fill="#10b981" style={{ offsetPath: "path('M -50,200 C 250,50 450,350 1050,200')" }}>
        <animateMotion dur="15s" repeatCount="indefinite" begin="4s" rotate="auto" />
      </motion.circle>
    </svg>
  );
}

// Neon wave dividers
function WaveDivider() {
  return (
    <div className="relative w-full h-10 pointer-events-none overflow-hidden z-10">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 40" preserveAspectRatio="none">
        <path d="M 0,20 Q 360,38 720,20 T 1440,20 L 1440,40 L 0,40 Z" fill="rgba(3, 7, 18, 0.4)" />
        <path d="M 0,20 Q 360,38 720,20 T 1440,20" fill="none" stroke="rgba(37,99,235,0.15)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

// Floating Event Ticker Sidebar Panel
function LiveSmartCityFeed() {
  const events = [
    "📍 New pothole reported near Bandra West",
    "🚧 Water leakage detected at Dadar Market",
    "⚡ Streetlight repaired near Juhu Beach",
    "🚮 Garbage pile resolved in Ward 3",
    "🤖 AI assigned issue to BMC Roads Div",
    "✓ AI verified manhole cover resolution"
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % events.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[900] hidden sm:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.9 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
          className="premium-glow-card backdrop-blur-xl bg-[#111827]/60 border border-cyan-500/20 px-4 py-3 shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-2xl flex items-center gap-2.5 max-w-[280px] text-left"
        >
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <div>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">City Live Telemetry</span>
            <p className="text-xs text-white font-extrabold mt-1 leading-tight">{events[index]}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Mock issues for Leaflet Map Preview
const MOCK_ISSUES = [
  { id: "mock-1", category: "Pothole", severity: "Critical", status: "In Progress", description: "Deep crater causing traffic gridlock on Linking Road.", location: "Linking Road, Bandra West", coordinates: [19.0596, 72.8295] },
  { id: "mock-2", category: "Streetlight", severity: "Medium", status: "Resolved", description: "Streetlight flickering at night near the beach.", location: "Juhu Tara Road, Juhu", coordinates: [19.1136, 72.8697] },
  { id: "mock-3", category: "Garbage", severity: "High", status: "Under Investigation", description: "Pile of plastic wastes clogging the drainage.", location: "Dadar West Market", coordinates: [19.0178, 72.8478] },
  { id: "mock-4", category: "Water Leakage", severity: "High", status: "In Progress", description: "Water pipeline burst causing waste of drinking water.", location: "Colaba Causeway", coordinates: [19.0330, 72.8397] },
  { id: "mock-5", category: "Manhole", severity: "Critical", status: "In Progress", description: "Open sewer manhole near the station exit.", location: "Andheri East Station", coordinates: [19.0760, 72.8777] }
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 428, resolved: 312 });
  const [liveIssues, setLiveIssues] = useState(MOCK_ISSUES);
  
  // Real-time simulated reports popped on the Leaflet preview
  useEffect(() => {
    const reportInterval = setInterval(() => {
      const types = ["Pothole", "Garbage", "Water Leakage", "Streetlight"];
      const locations = ["Bandra West", "Juhu Beach", "Dadar West", "Colaba Causeway", "Andheri Station"];
      const severities = ["Critical", "High", "Medium", "Low"];
      const coordsArr = [
        [19.0760, 72.8777], [19.0596, 72.8295], [19.1136, 72.8697],
        [19.0178, 72.8478], [19.0330, 72.8397]
      ];
      
      const newReport = {
        id: `simulated-${Date.now()}`,
        category: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: "Pending",
        description: "Simulated incoming citizen report synced live.",
        location: locations[Math.floor(Math.random() * locations.length)],
        coordinates: coordsArr[Math.floor(Math.random() * coordsArr.length)]
      };
      setLiveIssues(prev => [newReport, ...prev].slice(0, 10));
    }, 7000);
    return () => clearInterval(reportInterval);
  }, []);

  // Storytelling sequence timeline states
  const [storyStep, setStoryStep] = useState(0);
  useEffect(() => {
    const timelineInterval = setInterval(() => {
      setStoryStep(prev => (prev + 1) % 8);
    }, 2800);
    return () => clearInterval(timelineInterval);
  }, []);

  // Live Toast notification state popped randomly
  const [toast, setToast] = useState(null);
  useEffect(() => {
    const alerts = [
      "📍 Water leakage reported near Dadar West",
      "🚧 Critical pothole reported in Bandra West",
      "⚡ Streetlight repair verified in Juhu tara",
      "🚮 Garbage pile resolved by BMC sanitation crew"
    ];
    const alertInterval = setInterval(() => {
      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      setToast(randomAlert);
      setTimeout(() => setToast(null), 3000);
    }, 9000);
    return () => clearInterval(alertInterval);
  }, []);

  // Parallax mouse movements
  const heroRef = useRef(null);
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const floatX1 = useMotionValue(0);
  const floatY1 = useMotionValue(0);
  const floatX2 = useMotionValue(0);
  const floatY2 = useMotionValue(0);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    parallaxX.set(mouseX / 30);
    parallaxY.set(mouseY / 30);
    floatX1.set(mouseX / 15);
    floatY1.set(mouseY / 15);
    floatX2.set(mouseX / 40);
    floatY2.set(mouseY / 40);
  };

  const handleMouseLeave = () => {
    parallaxX.set(0);
    parallaxY.set(0);
    floatX1.set(0);
    floatY1.set(0);
    floatX2.set(0);
    floatY2.set(0);
  };

  // Scroll connecting line ref for Timeline
  const timelineContainerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineContainerRef,
    offset: ["start center", "end center"]
  });
  const lineScaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const lineTipTop = useTransform(lineScaleY, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('civicpulse_issues');
      if (stored) {
        const issues = JSON.parse(stored);
        if (Array.isArray(issues) && issues.length > 0) {
          const totalVal = Math.max(428, 428 + issues.length);
          const resolvedVal = Math.max(312, 312 + issues.filter(i => i.status === 'Resolved').length);
          setStats({ total: totalVal, resolved: resolvedVal });
        }
      }
    } catch (e) {
      console.error("Failed to parse issues from localStorage:", e);
    }
  }, []);

  const words = "Report Civic Issues. Create Real Change.".split(" ");

  return (
    <div className="bg-[#030712] mesh-bg min-h-screen text-[#F8FAFC] relative overflow-hidden flex flex-col pt-16">
      
      {/* Subtle Noise Filter Backdrop Overlay */}
      <div className="noise-overlay" />

      {/* Grid Drift Blueprint Overlay */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0 animate-grid-drift"
        style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.15) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(59,130,246,0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* AI Node Network Layer & Data Flow Lines */}
      <AINetwork />
      <DataFlowParticles />

      {/* Global Mouse Pointer Glowing dot and ring trailing wrapper */}
      <CustomCursor />

      {/* Floating Smart City Live Activity Telemetry Ticker */}
      <LiveSmartCityFeed />

      {/* HERO SECTION */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 pt-12 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        {/* Vector city skyline rendering behind hero content */}
        <Skyline />

        {/* Left Side: Copywriting & CTA */}
        <div className="lg:col-span-6 flex flex-col text-left relative z-10">
          
          {/* Tag (Hover blinks robot eye) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover="hover"
            className="inline-flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide w-fit mb-6 cursor-help"
          >
            <motion.svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="5" y="8" width="14" height="11" rx="2" />
              <path d="M9 16h6" />
              <motion.ellipse
                variants={{ hover: { ry: 0.1 } }}
                transition={{ duration: 0.15 }}
                cx="9" cy="12" rx="1.5" ry="1.5"
                fill="currentColor"
              />
              <motion.ellipse
                variants={{ hover: { ry: 0.1 } }}
                transition={{ duration: 0.15 }}
                cx="15" cy="12" rx="1.5" ry="1.5"
                fill="currentColor"
              />
            </motion.svg>
            <span>Gemini AI verification engine</span>
          </motion.div>

          {/* Word by word Headline with slow gradient shifts */}
          <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-white">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.12, delayChildren: 0.2 }
                }
              }}
            >
              {words.map((word, index) => {
                const isHighlight = index >= 3;
                return (
                  <motion.span
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } }
                    }}
                    className={`inline-block mr-3 select-none ${
                      isHighlight 
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 animate-gradient-shift-text animate-shimmer-text font-black" 
                        : "text-slate-100 font-black"
                    }`}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-slate-400 text-lg md:text-xl mt-6 leading-relaxed max-w-xl font-medium"
          >
            CivicPulse empowers citizens to report local issues using AI-powered classification, real-time tracking, and transparent community updates.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 mt-8"
          >
            <motion.div 
              whileHover="hover" 
              whileTap={{ scale: 0.95 }} 
              className="w-full sm:w-auto"
            >
              <RouterLink
                to={user ? "/report" : "/login"}
                className="relative overflow-hidden group flex items-center justify-center gap-2.5 w-full sm:w-auto bg-[#2563EB] hover:bg-blue-600 text-white font-extrabold px-8 py-4 rounded-2xl text-base shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] border border-blue-400/25 transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out]" />
                <span>Report Issue</span>
                <motion.span
                  variants={{ hover: { x: 5 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="inline-block"
                >
                  <ArrowRightIcon className="w-4.5 h-4.5" />
                </motion.span>
              </RouterLink>
            </motion.div>

            <motion.div 
              whileHover="hover" 
              whileTap={{ scale: 0.95 }} 
              className="w-full sm:w-auto"
            >
              <RouterLink
                to={user ? "/dashboard" : "/login"}
                className="flex items-center justify-center gap-2.5 w-full sm:w-auto border border-white/10 hover:border-blue-500 bg-white/5 hover:bg-white/10 text-white font-extrabold px-8 py-4 rounded-2xl text-base transition duration-300"
              >
                Explore Dashboard
              </RouterLink>
            </motion.div>
          </motion.div>

          {/* Animated Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-wrap gap-x-6 gap-y-3 mt-12 items-center text-left"
          >
            {[
              { label: "AI Powered" },
              { label: "Geo-tagged" },
              { label: "Real-time Tracking" },
              { label: "Government Ready" }
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
                <span>{badge.label}</span>
              </div>
            ))}
          </motion.div>

        </div>

        {/* Right Side: Floating Dashboard Mockup with Mouse Parallax & Storytelling */}
        <div className="lg:col-span-6 relative w-full flex items-center justify-center mt-8 lg:mt-0 hero-illustration">
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
            className="w-full max-w-lg premium-glow-card rounded-[22px] p-6 shadow-2xl relative border border-white/8 bg-[#111827]/40 backdrop-blur-xl z-10 overflow-hidden"
          >
            {/* Horizontal AI Scan Line (Active when storyStep is scanning >= 3) */}
            <AnimatePresence>
              {storyStep >= 3 && (
                <motion.div 
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-20 pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                />
              )}
            </AnimatePresence>

            {/* Top window UI Controls */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/70"></span>
              </div>
              <span className="text-[#64748B] text-xs font-bold mx-auto select-none">system_vision_panel.sh</span>
            </div>

            {/* Vision AI Panel Mockup */}
            <div className="bg-[#07111F] rounded-2xl p-4.5 text-left border border-white/5 relative">
              <div className="flex items-center justify-between mb-3.5">
                <div className="text-cyan-400 text-xs font-black tracking-wider flex items-center gap-1.5 uppercase">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  Gemini-1.5-Flash-Vision
                </div>
                
                {/* Soft severity pulse */}
                <motion.span 
                  animate={{ opacity: [1, 0.5, 1], scale: [1, 1.02, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-red-500/10 text-red-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-red-500/20"
                >
                  Critical
                </motion.span>
              </div>

              {/* Photo Area */}
              <div className="h-44 w-full rounded-xl bg-gradient-to-br from-slate-900 to-[#0F172A] flex flex-col items-center justify-center relative overflow-hidden mb-3.5 border border-white/5">
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md border border-white/5 z-10">
                  📍 19.0760° N, 72.8777° E
                </div>
                
                {/* Simulated Object Detection Box (Appears at step 3) */}
                <AnimatePresence>
                  {storyStep >= 3 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="absolute inset-x-12 inset-y-10 border-2 border-dashed border-red-500 z-10 flex flex-col items-start p-1"
                    >
                      <span className="bg-red-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Detected: Pothole
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <svg className="w-12 h-12 text-slate-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-slate-500 text-[10px] font-bold tracking-wider">img_pothole_mumbai.jpg</span>
              </div>

              {/* Metrics parameters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#030712] rounded-xl p-3 border border-white/5">
                  <span className="text-[#64748B] font-extrabold uppercase text-[9px] tracking-wider">Detected Type</span>
                  <div className="text-white font-bold mt-0.5">Road Infrastructure</div>
                </div>
                <div className="bg-[#030712] rounded-xl p-3 border border-white/5">
                  <span className="text-[#64748B] font-extrabold uppercase text-[9px] tracking-wider">Verification Score</span>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    {storyStep >= 4 ? <CountUp to={98.7} decimals={1} suffix="%" /> : "0.0%"}
                  </div>
                </div>
                <div className="bg-[#030712] rounded-xl p-3 border border-white/5">
                  <span className="text-[#64748B] font-extrabold uppercase text-[9px] tracking-wider">Assigned Ward</span>
                  <div className="text-white font-bold mt-0.5">
                    {storyStep >= 6 ? "BMC H-West (Bandra)" : "Calculating..."}
                  </div>
                </div>
                <div className="bg-[#030712] rounded-xl p-3 border border-white/5">
                  <span className="text-[#64748B] font-extrabold uppercase text-[9px] tracking-wider">Est. Resolution</span>
                  <div className="text-amber-400 font-bold mt-0.5">2 Days Plan</div>
                </div>
              </div>
            </div>

            {/* Simulated Live Resolution Timeline */}
            <div className="mt-4 text-left bg-slate-950/40 rounded-xl p-3.5 border border-white/5">
              <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5 font-bold">
                <span>Verification & Dispatch Pipeline</span>
                <span className="text-cyan-400 uppercase tracking-widest text-[9px] font-black">
                  {storyStep === 7 ? "Resolved" : "Active"}
                </span>
              </div>
              <div className="bg-slate-900 rounded-full h-1.5 w-full overflow-hidden relative">
                {/* Continuous progress filling */}
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: storyStep === 0 ? "0%" 
                      : storyStep === 1 ? "15%" 
                      : storyStep === 2 ? "30%" 
                      : storyStep === 3 ? "45%" 
                      : storyStep === 4 ? "60%" 
                      : storyStep === 5 ? "75%" 
                      : storyStep === 6 ? "90%" 
                      : "100%" 
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full h-1.5"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-extrabold uppercase mt-2">
                <span className={storyStep >= 1 ? "text-cyan-400" : ""}>Upload</span>
                <span className={storyStep >= 4 ? "text-cyan-400" : ""}>AI verified</span>
                <span className={storyStep >= 6 ? "text-cyan-400" : ""}>BMC Dispatched</span>
                <span className={storyStep >= 7 ? "text-emerald-400" : ""}>Resolved</span>
              </div>
            </div>
          </motion.div>

          {/* Floating cards */}
          {/* Card A: Detected Category */}
          <motion.div
            style={{ x: floatX1, y: floatY1 }}
            animate={{ 
              y: [0, -14, 0],
              rotate: [0, 2, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -right-2 bg-[#07111F]/90 border border-white/10 rounded-2xl p-4.5 shadow-2xl z-20 flex items-center gap-3.5 text-left backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <CpuIcon />
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vision AI Tag</div>
              <div className="text-xs font-black text-white mt-0.5">AI Detected: Pothole</div>
            </div>
          </motion.div>

          {/* Card B: Storytelling status popup (fades in/out on sequence) */}
          <div className="absolute -bottom-8 -left-6 z-20">
            <AnimatePresence mode="wait">
              {storyStep >= 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3 text-left backdrop-blur-md"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pipeline Notification</div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {storyStep === 5 ? "Gemini detected Road Damage" : storyStep === 6 ? "Routed to BMC Roads Division" : "Issue Closed: Verified Fixed ✅"}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card C: Floating Verification Score */}
          <motion.div
            style={{ x: floatX2, y: floatY2 }}
            animate={{ 
              scale: [1, 1.05, 1],
              y: [0, 8, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 -right-8 hidden sm:flex bg-slate-950 text-white rounded-xl px-4 py-3 shadow-2xl z-20 border border-white/10 text-left items-center gap-2 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-black text-emerald-400">
              ✓
            </div>
            <div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider">AI Confidence Score</div>
              <div className="text-xs font-black text-emerald-400">99.8% Verified</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Toast Popups (appears randomly every few seconds) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-950/90 border border-blue-500/35 text-white rounded-2xl px-5 py-4 shadow-[0_4px_30px_rgba(59,130,246,0.15)] backdrop-blur-xl z-[999] text-sm font-black flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* TRUST SECTION (Slide Left scroll animation) */}
      <motion.section 
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative z-10 border-y border-white/5 bg-slate-950/20 py-10"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <p className="text-center text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-6">
            Engineered for Modern Governance & Citizen Co-operation
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            {[
              { icon: <ShieldCheckIcon />, title: "AI-Powered Verification" },
              { icon: <ActivityIcon />, title: "Real-Time Tracking" },
              { icon: <MapPinIcon />, title: "Geo-tagged Reports" },
              { icon: <UsersIcon />, title: "Government Ready" }
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-left group">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  {badge.icon}
                </div>
                <span className="font-extrabold text-sm text-slate-400 group-hover:text-blue-400 transition-colors duration-300">
                  {badge.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* FEATURES SECTION (Stagger Zoom reveal) */}
      <section className="relative z-10 py-24 px-6 md:px-8 max-w-7xl mx-auto w-full text-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide w-fit mb-5">
            Features & Mechanics
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Designed for Community Resolution
          </h2>
          <p className="text-slate-400 text-lg md:text-xl mt-4 max-w-2xl mx-auto font-medium">
            AI-powered issue validation and decentralized citizen collaboration.
          </p>
        </motion.div>

        {/* Feature Cards Grid (Staggered Reveal with 3D cursor-tilt) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 text-left">
          {[
            {
              icon: <CpuIcon />,
              title: "AI Issue Detection",
              desc: "Gemini Vision automatically classifies issues, estimates response time, and assigns the correct government department.",
            },
            {
              icon: <MapPinIcon />,
              title: "Interactive Map",
              desc: "Explore reported issues nearby in real-time. View precise coordinates and severity metrics visualised instantly.",
            },
            {
              icon: <ActivityIcon />,
              title: "Live Status Tracking",
              desc: "Get updates via notifications. Follow your ticket directly through stages: Pending, In Progress, and Resolved.",
            },
            {
              icon: <UsersIcon />,
              title: "Community Voting",
              desc: "Citizens vote on neighboring issues. High upvote counts boost priority in the municipal officer dashboard.",
            },
            {
              icon: <TrendingUpIcon />,
              title: "Analytics Dashboard",
              desc: "Track department resolution times, health scores, and open ticket frequencies across ward jurisdictions.",
            },
            {
              icon: <BuildingIcon />,
              title: "Department Management",
              desc: "Tailored portal for officers allowing photo-proof verification, direct citizen chat, and action plans.",
            }
          ].map((feat, idx) => (
            <PremiumGlowCard
              key={idx}
              className="animate-border-rotate"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-blue-500/10 group-hover:scale-110 group-hover:rotate-[360deg] text-blue-400 z-10">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-blue-400 z-10">{feat.title}</h3>
              <p className="text-slate-400 mt-3 text-sm font-medium leading-relaxed z-10">
                {feat.desc}
              </p>
            </PremiumGlowCard>
          ))}
        </div>
      </section>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* HOW IT WORKS SECTION (TIMELINE FILL ON SCROLL) */}
      <section className="relative z-10 py-24 border-y border-white/5 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide w-fit mb-5">
              Platform Workflow
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Reclaiming Civic Accountability
            </h2>
            <p className="text-slate-400 text-lg md:text-xl mt-4 max-w-2xl mx-auto font-medium">
              Simple 5-step process bridging citizens and municipal officers.
            </p>
          </div>

          {/* Timeline Wrapper (Vertical fill on scroll with trailing tip dot) */}
          <div ref={timelineContainerRef} className="relative max-w-3xl mx-auto pl-6 md:pl-16 space-y-12">
            
            {/* Background track line */}
            <div className="absolute left-[30px] md:left-[46px] top-4 bottom-4 w-[2px] bg-slate-900 z-0" />
            
            {/* Scroll-Filling Line */}
            <motion.div
              style={{ scaleY: lineScaleY, transformOrigin: "top" }}
              className="absolute left-[30px] md:left-[46px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-blue-500 via-cyan-400 to-emerald-400 z-0"
            />

            {/* Glowing trailing tip dot */}
            <motion.div
              style={{ top: lineTipTop, y: "-50%" }}
              className="absolute left-[30px] md:left-[46px] w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)] z-10"
            />

            {[
              { step: "01", title: "Capture & Upload", desc: "Snap a photo of the pothole, trash, or leak in your ward and submit.", icon: <CameraIcon /> },
              { step: "02", title: "AI Analysis", desc: "Gemini AI scans, assigns category, severity, and proper department.", icon: <BrainIcon /> },
              { step: "03", title: "Official Intake", desc: "Municipal officers verify the ticket and assign a priority action plan.", icon: <SendIcon /> },
              { step: "04", title: "Track Progress", desc: "View the status bar go from Pending to In Progress. Upvote for urgency.", icon: <ClockIcon /> },
              { step: "05", title: "Issue Resolved", desc: "Officers upload completion photos, validated by AI, closing the loop.", icon: <CheckCircleIcon /> }
            ].map((item, idx) => (
              <TimelineStep 
                key={idx} 
                item={item} 
                idx={idx} 
                isLast={idx === 4}
                progressY={scrollYProgress}
              />
            ))}
          </div>

        </div>
      </section>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* STATISTICS SECTION (confetti burst + self drawing SVG chart) */}
      <section className="relative z-10 py-24 px-6 md:px-8 max-w-7xl mx-auto w-full">
        {/* City Health Score Widget */}
        <div className="mb-16">
          <CityHealthScore />
        </div>

        {/* Counter cards (with self-drawing sparklines on view and hover confetti triggers) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { value: stats.total, label: "Reports Submitted", suffix: "+", desc: "Verifiable reports filed", icon: <CameraIcon />, chartD: "M0,15 C20,10 40,25 60,8 C80,10 90,5 100,12" },
            { value: stats.resolved, label: "Issues Resolved", suffix: "", desc: "AI-verified resolutions", icon: <CheckCircleIcon />, chartD: "M0,18 C15,10 30,5 50,15 C70,12 85,2 100,5" },
            { value: 1250, label: "Active Citizens", suffix: "+", desc: "Contributing to ward improvements", icon: <UsersIcon />, chartD: "M0,15 Q25,8 50,12 T100,2" },
            { value: 1.8, label: "Resolution Time", suffix: " Days", decimals: 1, desc: "Average close-out delay", icon: <ClockIcon />, chartD: "M0,5 C30,15 70,5 100,18" }
          ].map((stat, idx) => {
            const [bursts, setBursts] = useState([]);
            const triggerConfetti = () => {
              const newBursts = Array.from({ length: 12 }).map((_, i) => ({
                id: i,
                color: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"][i % 5],
                angle: (i / 12) * 2 * Math.PI,
                distance: Math.random() * 40 + 20
              }));
              setBursts(newBursts);
              setTimeout(() => setBursts([]), 1000);
            };

            return (
              <PremiumGlowCard
                key={idx}
                hoverTilt={false}
                className="bg-slate-900/30 flex flex-col items-center overflow-visible cursor-pointer"
              >
                <div 
                  onMouseEnter={triggerConfetti}
                  className="w-full flex flex-col items-center relative"
                >
                  {/* Confetti particles */}
                  {bursts.map((b) => (
                    <motion.div
                      key={b.id}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos(b.angle) * b.distance,
                        y: Math.sin(b.angle) * b.distance,
                        opacity: 0,
                        scale: 0.5
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-30"
                      style={{ background: b.color }}
                    />
                  ))}

                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-blue-400 z-10 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tight z-10"
                  >
                    <CountUp to={stat.value} decimals={stat.decimals || 0} suffix={stat.suffix} />
                  </motion.div>
                  
                  <div className="font-extrabold text-sm md:text-base text-white mt-3 z-10">
                    {stat.label}
                  </div>
                  
                  <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider z-10">
                    {stat.desc}
                  </div>
                  
                  {/* Self-drawing SVG sparkline */}
                  <div className="w-full mt-5 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 20">
                      <motion.path
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.8, ease: "easeInOut", delay: idx * 0.15 }}
                        d={stat.chartD}
                        fill="none"
                        stroke="url(#sparkline-grad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="50%" stopColor="#06B6D4" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </PremiumGlowCard>
            );
          })}
        </div>
      </section>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* INTERACTIVE MAP PREVIEW */}
      <section className="relative z-10 py-24 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Map Info Block */}
          <div className="lg:col-span-4 text-left group">
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide w-fit mb-5">
              Ward GIS Interface
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Visualise Issues Across Wards
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-4 leading-relaxed font-semibold">
              Track live pothole reports, broken streetlights, water leaks, and municipal activities mapped down to exact coordinates. Click on marker popups to inspect severity.
            </p>
            <div className="mt-8">
              <RouterLink
                to={user ? "/feed" : "/login"}
                className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white font-extrabold px-6 py-3.5 rounded-xl text-sm transition duration-300 shadow-md shadow-blue-500/20"
              >
                <span>Explore Live Issues</span>
                <ArrowRightIcon className="w-4 h-4" />
              </RouterLink>
            </div>
            
            {/* Easter Egg: driving car across card bottom when hovered */}
            <div className="w-full relative h-6 overflow-hidden mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5 rounded-full border border-white/5">
              <span className="absolute bottom-0.5 left-0 pointer-events-none text-xs animate-drive">
                🚗
              </span>
            </div>
          </div>

          {/* Map Container */}
          <div className="lg:col-span-8 relative">
            <div className="p-2 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
              <IssueMap issues={liveIssues} height="430px" />
            </div>
            {/* Floating marker overlay label */}
            <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-[#030712] text-[10px] font-black uppercase px-3.5 py-2 rounded-full shadow-xl z-20 border border-emerald-400 animate-pulse">
              ● GIS Synchronization Active
            </div>
          </div>

        </div>
      </section>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* TESTIMONIALS SECTION (INFINITE MARQUEE CAROUSEL) */}
      <section className="relative z-10 py-24 overflow-hidden text-center">
        <div className="max-w-7xl mx-auto px-6 md:px-8 mb-14">
          <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide w-fit mb-5">
            Testimonials
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Voices of Our Wards
          </h2>
          <p className="text-slate-400 text-lg md:text-xl mt-4 max-w-2xl mx-auto font-medium">
            Hear how CivicPulse is helping communities and municipal bodies restore accountability.
          </p>
        </div>

        {/* Infinite Marquee row */}
        <div className="w-full relative overflow-hidden py-4 select-none">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#030712] to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#030712] to-transparent z-20 pointer-events-none" />

          <div className="flex gap-8 animate-marquee-scroll whitespace-nowrap">
            {[
              {
                role: "Citizen",
                name: "Rohan Deshmukh",
                location: "Andheri West, Mumbai",
                quote: "The speed is unbelievable. I snapped a photo of an open manhole near my local gym, Gemini identified the ward, and in 3 days it was covered. I've never seen such responsiveness.",
                rating: 5,
                avatarBg: "from-blue-500 to-indigo-600",
                initials: "RD"
              },
              {
                role: "Municipal Officer",
                name: "Officer A. K. Patil",
                location: "BMC Road Dept",
                quote: "CivicPulse saves us hours of categorization. We get precise geo-tagged logs and severity ratings. Gemini photo-proof verification guarantees my ground team only submits verified fixes.",
                rating: 5,
                avatarBg: "from-emerald-500 to-teal-600",
                initials: "AP"
              },
              {
                role: "NGO Rep",
                name: "Meera Sen",
                location: "CleanCity Foundation",
                quote: "We use the public feed analytics to audit city sanitation scores. The transparency of upvotes ensures that the local government addresses high-density community concerns first.",
                rating: 5,
                avatarBg: "from-amber-500 to-orange-600",
                initials: "MS"
              },
              {
                role: "Citizen",
                name: "Priya Nair",
                location: "Kothrud, Pune",
                quote: "Being able to track issues in real-time means we don't need to chase ward officials. The in-app chat provides direct connection. My reported pipeline leakage got resolved within 36 hours.",
                rating: 5,
                avatarBg: "from-purple-500 to-pink-600",
                initials: "PN"
              },
              {
                role: "Officer",
                name: "Engineer S. K. Shinde",
                location: "PMC Water Works",
                quote: "Duplicate detection works perfectly. In the past, we had ten crews showing up to evaluate the same leak. CivicPulse groups matching reports instantly. A true game-changer.",
                rating: 5,
                avatarBg: "from-cyan-500 to-blue-600",
                initials: "SS"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="inline-block w-[350px] shrink-0 premium-glow-card p-6 text-left relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02] border border-white/5 bg-slate-900/40 whitespace-normal group"
                style={{
                  transform: `rotate(${idx % 2 === 0 ? "0.6" : "-0.6"}deg)`
                }}
              >
                {/* Rating stars with Twinkle animations */}
                <div className="flex gap-1 mb-4 z-10 relative">
                  <StarTwinkle idx={0} />
                  <StarTwinkle idx={1} />
                  <StarTwinkle idx={2} />
                  <StarTwinkle idx={3} />
                  <StarTwinkle idx={4} />
                </div>
                
                {/* Quote */}
                <p className="text-slate-300 text-sm leading-relaxed font-semibold italic z-10 relative">
                  "{item.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3.5 mt-6 border-t border-white/5 pt-4 z-10 relative">
                  {/* Rotating avatar on card hover */}
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.avatarBg} flex items-center justify-center text-white text-xs font-black border border-white/10 transition-transform duration-300 group-hover:rotate-12`}>
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white leading-tight">{item.name}</h4>
                    <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider mt-0.5">{item.role} &bull; {item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* FAQ SECTION */}
      <section className="relative z-10 py-24 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide w-fit mb-5">
              Information Directory
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-lg md:text-xl mt-4 font-medium">
              Clear answers to common questions about reporting, data privacy, and municipal operations.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What types of civic issues can I report?",
                a: "You can report any local public infrastructure issues including potholes, broken streetlights, water pipeline leakages, open sewage drains, garbage piles, traffic signal failures, and broken public amenities."
              },
              {
                q: "How does the AI auto-categorization work?",
                a: "When you upload a photo, our backend routes it to Google Gemini 1.5 Flash. The model analyzes the image to identify the issue, determines its priority severity level, auto-detects your location details, and assigns it directly to the responsible municipal department (e.g. BMC Roads Div)."
              },
              {
                q: "How can I be sure the municipal officers are actually working on it?",
                a: "Our dual dashboard requires the officer to upload verification photos of the fix. The system uses Gemini Vision AI to verify that the repair matches the original complaint before status is marked as 'Resolved'."
              },
              {
                q: "Can I upvote complaints from my neighbors?",
                a: "Yes! The live community feed displays issues reported nearby. You can upvote issues to increase their visibility. Complaints with more upvotes rise to the top of the priority list on the officer panel."
              },
              {
                q: "Is my personal information secure?",
                a: "Absolutely. CivicPulse uses secure Firebase Authentication. Municipal officers only see the issue description, photos, and approximate geo-location. Your personal login details and email address are never exposed publicly."
              }
            ].map((faq, idx) => (
              <FAQItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>

        </div>
      </section>

      {/* Wave Section Separator */}
      <WaveDivider />

      {/* FINAL CTA SECTION */}
      <section className="relative z-10 py-28 px-6 text-center overflow-hidden bg-gradient-to-b from-blue-950 to-[#030712] text-white border-t border-white/5">
        <Particles />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Together We Build Better Cities
          </h2>
          <p className="text-blue-200/80 text-lg md:text-xl mt-6 max-w-2xl leading-relaxed font-semibold">
            Join thousands of active citizens reporting issues and monitoring progress in Mumbai and Pune. Change starts in your street.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto justify-center">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
              <RouterLink
                to={user ? "/report" : "/login"}
                className="bg-white hover:bg-slate-100 text-[#030712] font-black px-10 py-4.5 rounded-2xl text-base shadow-2xl flex items-center justify-center gap-2 w-full sm:w-auto transition duration-300"
              >
                Start Reporting
              </RouterLink>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
              <RouterLink
                to="/feed"
                className="bg-blue-800/40 hover:bg-blue-800/60 text-white border border-white/10 font-black px-10 py-4.5 rounded-2xl text-base flex items-center justify-center gap-2 w-full sm:w-auto transition duration-300"
              >
                Learn More
              </RouterLink>
            </motion.div>
          </div>

          <p className="text-blue-200/60 text-xs font-black uppercase tracking-widest mt-6">
            Free forever for citizens &bull; AI Verified &bull; Real-time GIS
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[#030712] py-16 px-6 md:px-8 text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="col-span-2 flex flex-col text-left">
            <RouterLink to="/" className="flex items-center gap-2 group mb-4">
              <div className="bg-blue-600 rounded-lg w-8 h-8 flex items-center justify-center text-sm text-white font-bold">
                ⚡
              </div>
              <div className="flex">
                <span className="font-black text-xl text-white">Civic</span>
                <span className="text-blue-500 font-black text-xl">Pulse</span>
              </div>
            </RouterLink>
            <p className="text-xs font-medium leading-relaxed max-w-sm mb-6 text-slate-400">
              AI-powered hyperlocal civic issue reporting platform bridging citizens and ward officials. Reclaiming accountability, one report at a time.
            </p>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              © 2026 CivicPulse &bull; Vibe2Ship Hackathon
            </span>
          </div>

          {/* Column 2: Product */}
          <div className="text-left flex flex-col">
            <h5 className="font-extrabold text-xs text-white uppercase tracking-wider mb-4">Product</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><RouterLink to="/report" className="hover:text-blue-500 text-slate-400">File a Report</RouterLink></li>
              <li><RouterLink to="/feed" className="hover:text-blue-500 text-slate-400">Live Feed</RouterLink></li>
              <li><RouterLink to="/dashboard" className="hover:text-blue-500 text-slate-400">Citizen Panel</RouterLink></li>
              <li><a href="#how-it-works" className="hover:text-blue-500 text-slate-400">How It Works</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="text-left flex flex-col">
            <h5 className="font-extrabold text-xs text-white uppercase tracking-wider mb-4">Resources</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><a href="#faq" className="hover:text-blue-500 text-slate-400">FAQ Directory</a></li>
              <li><a href="#features" className="hover:text-blue-500 text-slate-400">AI Capabilities</a></li>
              <li><a href="#" className="hover:text-blue-500 text-slate-400">API Documentation</a></li>
              <li><a href="#" className="hover:text-blue-500 text-slate-400">System Status</a></li>
            </ul>
          </div>

          {/* Column 4: About / Legal */}
          <div className="text-left flex flex-col">
            <h5 className="font-extrabold text-xs text-white uppercase tracking-wider mb-4">About</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><a href="#" className="hover:text-blue-500 text-slate-400">Our Mission</a></li>
              <li>
                <a 
                  href="https://github.com/user-Rishabh/civicpulse" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-blue-500 text-slate-400 inline-flex items-center gap-1"
                >
                  <span>GitHub</span>
                  <GithubIcon />
                </a>
              </li>
              <li><a href="#" className="hover:text-blue-500 text-slate-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-500 text-slate-400">Terms of Use</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
