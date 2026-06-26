import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const phrases = [
  "Upload a photo — AI categorizes it instantly.",
  "Gemini assigns severity & department automatically.",
  "Track resolution till your city is fixed."
];

export default function Home() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [particles, setParticles] = useState([]);

  const t = {
    bg: isDark ? 'bg-[#0A0F1E]' : 'bg-[#EEF2FF]',
    surface: isDark ? 'bg-[#111827]' : 'bg-[#E8EFFE]',
    surface2: isDark ? 'bg-[#1F2937]' : 'bg-[#DDE6FD]',
    border: isDark ? 'border-[#374151]' : 'border-[#C7D7F9]',
    text: isDark ? 'text-white' : 'text-[#1E293B]',
    muted: isDark ? 'text-[#9CA3AF]' : 'text-[#475569]',
    sidebar: isDark ? 'bg-[#0D1117]' : 'bg-[#E2EAFC]',
    card: isDark ? 'bg-[#111827] border-[#374151]' : 'bg-[#EEF2FF] border-[#C7D7F9]',
  };
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({ total: 10, resolved: 3 });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('civicpulse_issues');
      if (stored) {
        const issues = JSON.parse(stored);
        if (Array.isArray(issues)) {
          const total = Math.max(10, issues.length);
          const resolved = Math.max(3, issues.filter(i => i.status === 'Resolved').length);
          setStats({ total, resolved });
        }
      }
    } catch (e) {
      console.error("Failed to parse issues from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    // Generate particles on the client side to avoid hydration mismatch
    const items = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      width: `${2 + Math.random() * 4}px`,
      height: `${2 + Math.random() * 4}px`,
      background: i % 3 === 0 ? "#3B82F6" : i % 3 === 1 ? "#06B6D4" : "#8B5CF6",
      duration: `${8 + Math.random() * 12}s`,
      delay: `${Math.random() * 8}s`,
    }));
    setParticles(items);
  }, []);

  useEffect(() => {
    let timer;
    const fullText = phrases[currentPhraseIdx];
    const speed = isDeleting ? 25 : 50;

    if (!isDeleting && displayedText === fullText) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2500);
    } else if (isDeleting && displayedText === "") {
      setIsDeleting(false);
      setCurrentPhraseIdx((prev) => (prev + 1) % phrases.length);
    } else {
      timer = setTimeout(() => {
        setDisplayedText(prev => 
          isDeleting 
            ? fullText.substring(0, prev.length - 1) 
            : fullText.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIdx]);

  const colorMap = {
    blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    green: "bg-green-500/10 text-green-400 border border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    red: "bg-red-500/10 text-red-400 border border-red-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  };

  const borderTopMap = {
    blue: "border-t-2 border-t-blue-500",
    yellow: "border-t-2 border-t-yellow-500",
    green: "border-t-2 border-t-green-500",
    purple: "border-t-2 border-t-purple-500",
    red: "border-t-2 border-t-red-500",
    cyan: "border-t-2 border-t-cyan-500",
  };

  return (
    <div className={`${t.bg} min-h-screen ${t.text} relative overflow-hidden flex flex-col`}>
      {/* PARTICLE SYSTEM */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.left,
              width: p.width,
              height: p.height,
              background: p.background,
              borderRadius: "50%",
              animation: `particle-float ${p.duration} linear infinite`,
              animationDelay: p.delay,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* GRID BACKGROUND */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* GRADIENT ORBS */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-blue-600/20 rounded-full animate-pulse blur-3xl" />
        <div
          className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-cyan-600/15 rounded-full animate-pulse blur-3xl"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      {/* HERO SECTION */}
      <section 
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
          e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
        }}
        style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59,130,246,0.06), transparent 40%)' }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center max-w-6xl mx-auto w-full pt-20"
      >
        {/* BADGE */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0 }}
          className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-5 py-2 mb-8"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping bg-blue-400 absolute inline-flex h-full w-full rounded-full opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <span className="text-blue-400 text-sm font-medium">
            Powered by Gemini 1.5 Flash Vision
          </span>
          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2 font-semibold">
            NEW
          </span>
        </motion.div>

        {/* MAIN HEADING */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-8xl font-black leading-none tracking-tight flex flex-col items-center"
        >
          <span className={t.text}>Report.</span>
          <span className={t.text}>Track.</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Resolve.
          </span>
        </motion.h1>

        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`${t.muted} text-xl max-w-2xl mt-8 leading-relaxed min-h-[3rem] flex items-center justify-center font-medium`}
        >
          <span className="after:content-['|'] after:text-blue-500 after:animate-pulse after:ml-0.5">
            {displayedText}
          </span>
        </motion.p>

        {/* CTA BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto justify-center items-center"
        >
          {/* Button 1 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto"
          >
            <Link
              to={user ? "/report" : "/login"}
              className="relative overflow-hidden group flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-2xl text-lg animate-glow transition duration-200"
            >
              {/* Shimmer sweep effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out]" />
              <span>Report an Issue &rarr;</span>
            </Link>
          </motion.div>

          {/* Button 2 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto"
          >
            <Link
              to={user ? "/feed" : "/login"}
              className={`flex items-center justify-center w-full sm:w-auto border-2 ${t.border} hover:border-blue-500 ${t.text} px-10 py-4 rounded-2xl text-lg transition duration-200 font-semibold`}
            >
              <span className="bg-white/10 rounded-full w-8 h-8 inline-flex items-center justify-center mr-2 text-xs">
                ▶
              </span>
              Watch How It Works
            </Link>
          </motion.div>
        </motion.div>

        {/* TRUST BADGES */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap gap-6 mt-12 items-center justify-center"
        >
          {["Free to use", "AI Powered", "Real-time updates", "Secure"].map((text) => (
            <div key={text} className={`${t.muted} text-sm flex items-center gap-1.5 font-medium`}>
              <span className="text-green-400 font-bold">✓</span>
              <span>{text}</span>
            </div>
          ))}
        </motion.div>

        {/* FLOATING MOCKUP */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.0 }}
          className="mt-20 relative w-full max-w-xl mx-auto"
        >
          {/* Main card */}
          <div className="bg-[#111827] rounded-2xl border border-[#374151] p-5 max-w-md mx-auto shadow-2xl animate-float">
            {/* Top bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <span className="text-[#6B7280] text-xs mx-auto">civicpulse.app</span>
            </div>

            {/* Image area */}
            <div className="bg-[#1F2937] rounded-xl h-36 w-full flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-[#1F2937]"></div>
              <span className="text-[#9CA3AF] text-sm relative z-10 flex items-center gap-2 font-medium">
                📸 Photo uploaded
              </span>
            </div>

            {/* AI Analysis row */}
            <div className="mt-3 bg-[#0A0F1E] rounded-xl p-3 text-left">
              <div className="text-blue-400 text-xs font-semibold mb-2 flex items-center gap-1">
                <span>🤖</span> Gemini Analysis
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Category */}
                <div className="bg-[#1F2937] rounded-lg p-2">
                  <div className="text-[#6B7280] text-[10px] font-bold uppercase">CATEGORY</div>
                  <div className="text-white text-sm font-medium">Pothole</div>
                </div>
                {/* Severity */}
                <div className="bg-[#1F2937] rounded-lg p-2">
                  <div className="text-[#6B7280] text-[10px] font-bold uppercase">SEVERITY</div>
                  <div className="text-red-400 text-sm font-medium">Critical</div>
                </div>
                {/* Department */}
                <div className="bg-[#1F2937] rounded-lg p-2">
                  <div className="text-[#6B7280] text-[10px] font-bold uppercase">DEPARTMENT</div>
                  <div className="text-green-400 text-sm font-medium">BMC</div>
                </div>
                {/* Est. Days */}
                <div className="bg-[#1F2937] rounded-lg p-2">
                  <div className="text-[#6B7280] text-[10px] font-bold uppercase">EST. DAYS</div>
                  <div className="text-amber-400 text-sm font-medium">7 Days</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 text-left">
              <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
                <span className="font-semibold">Submitting report...</span>
                <span className="font-bold">98%</span>
              </div>
              <div className="bg-[#1F2937] rounded-full h-1.5 w-full">
                <div className="w-[98%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full h-1.5"></div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="absolute -top-6 -right-6 bg-green-500 text-white rounded-2xl px-4 py-2 text-xs font-bold shadow-xl animate-bounce">
            ✅ Issue Reported!
          </div>

          <div className="absolute -bottom-6 -left-6 bg-[#111827] border border-blue-500/30 rounded-2xl px-4 py-3 shadow-xl text-left">
            <div className="text-blue-400 text-xs font-bold">
              ⚡ 0.8s Analysis
            </div>
            <div className="text-[#9CA3AF] text-xs mt-0.5">
              Gemini verified
            </div>
          </div>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="relative z-10 py-16 px-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${t.surface} rounded-2xl p-8 border ${t.border} border-t-2 border-t-blue-500 text-center shadow-xl relative overflow-hidden`}>
            <div className="text-6xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">{stats.total}</div>
            <div className={`${t.text} font-bold text-base mt-3`}>Total Issues Reported</div>
            <div className={`${t.muted} text-xs mt-1 font-medium`}>AI auto-categorized citizen reports</div>
          </div>
          <div className={`${t.surface} rounded-2xl p-8 border ${t.border} border-t-2 border-t-green-500 text-center shadow-xl relative overflow-hidden`}>
            <div className="text-6xl font-black text-green-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">{stats.resolved}</div>
            <div className={`${t.text} font-bold text-base mt-3`}>Issues Resolved</div>
            <div className={`${t.muted} text-xs mt-1 font-medium`}>Verified and closed by city officials</div>
          </div>
          <div className={`${t.surface} rounded-2xl p-8 border ${t.border} border-t-2 border-t-amber-500 text-center shadow-xl relative overflow-hidden`}>
            <div className="text-6xl font-black text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">5</div>
            <div className={`${t.text} font-bold text-base mt-3`}>Active Departments</div>
            <div className={`${t.muted} text-xs mt-1 font-medium`}>BMC, PWD, MSEDCL, & more</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-32 px-8 relative overflow-hidden z-10">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-blue-600/3 blur-3xl pointer-events-none" />
        
        <h2 className={`text-5xl font-black text-center ${t.text} tracking-tight`}>
          How It Works
        </h2>
        <div className="mx-auto mt-3 w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />

        <div className="relative grid grid-cols-1 md:grid-cols-8 gap-4 mt-20 max-w-5xl mx-auto w-full items-center">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -8, borderColor: "rgba(59,130,246,0.5)" }}
            className={`${t.surface} rounded-3xl p-8 border ${t.border} relative overflow-hidden transition-colors duration-300 md:col-span-2`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="text-8xl font-black text-blue-500/10 absolute top-4 right-4 leading-none pointer-events-none select-none">
              1
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">
              📸
            </div>
            <h3 className={`${t.text} font-bold text-2xl mt-6`}>Snap & Upload</h3>
            <p className={`${t.muted} mt-3 leading-relaxed text-sm font-medium`}>
              Take a photo of any civic issue — pothole, leak, broken light — and upload instantly.
            </p>
          </motion.div>

          {/* Arrow 1 */}
          <div className="hidden md:flex items-center justify-center text-blue-500/30 text-5xl font-black md:col-span-1 select-none pointer-events-none">
            →
          </div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -8, borderColor: "rgba(59,130,246,0.5)" }}
            className={`${t.surface} rounded-3xl p-8 border ${t.border} relative overflow-hidden transition-colors duration-300 md:col-span-2`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="text-8xl font-black text-blue-500/10 absolute top-4 right-4 leading-none pointer-events-none select-none">
              2
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">
              🤖
            </div>
            <h3 className={`${t.text} font-bold text-2xl mt-6`}>AI Analyzes</h3>
            <p className={`${t.muted} mt-3 leading-relaxed text-sm font-medium`}>
              Gemini Vision identifies type, severity, and which municipal department handles it.
            </p>
          </motion.div>

          {/* Arrow 2 */}
          <div className="hidden md:flex items-center justify-center text-blue-500/30 text-5xl font-black md:col-span-1 select-none pointer-events-none">
            →
          </div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -8, borderColor: "rgba(59,130,246,0.5)" }}
            className={`${t.surface} rounded-3xl p-8 border ${t.border} relative overflow-hidden transition-colors duration-300 md:col-span-2`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="text-8xl font-black text-blue-500/10 absolute top-4 right-4 leading-none pointer-events-none select-none">
              3
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">
              ✅
            </div>
            <h3 className={`${t.text} font-bold text-2xl mt-6`}>Track & Resolve</h3>
            <p className={`${t.muted} mt-3 leading-relaxed text-sm font-medium`}>
              Community upvotes prioritize issues. Track status until your city is fixed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className={`py-32 px-8 ${t.surface}/30 relative z-10`}>
        <h2 className={`text-5xl font-black text-center ${t.text} tracking-tight`}>
          Everything You Need
        </h2>
        <p className={`${t.muted} text-center mt-3 text-lg font-medium`}>
          Built for citizens who care about their community
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto w-full">
          {[
            {
              icon: "🎯",
              color: "blue",
              title: "AI-Powered Analysis",
              desc: "Gemini Vision auto-categorizes every civic issue instantly",
            },
            {
              icon: "⚡",
              color: "yellow",
              title: "Real-time Updates",
              desc: "Live status changes reflected instantly across all dashboards",
            },
            {
              icon: "👥",
              color: "green",
              title: "Community Driven",
              desc: "Upvote issues to push critical problems up the priority queue",
            },
            {
              icon: "🛡️",
              color: "purple",
              title: "Officer Verified",
              desc: "Photo proof required before any status update goes live",
            },
            {
              icon: "🔔",
              color: "red",
              title: "Smart Notifications",
              desc: "Email + in-app alerts every time your issue status changes",
            },
            {
              icon: "🏛️",
              color: "cyan",
              title: "Dual Dashboard",
              desc: "Separate powerful dashboards for citizens and municipal officers",
            },
          ].map((feat) => (
            <motion.div
              key={feat.title}
              whileHover={{ scale: 1.02, borderColor: "rgba(59,130,246,0.4)" }}
              className={`${t.surface} rounded-3xl p-6 border ${t.border} ${borderTopMap[feat.color]} transition-all duration-300 text-left`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${
                  colorMap[feat.color]
                }`}
              >
                {feat.icon}
              </div>
              <h3 className={`${t.text} font-semibold text-lg md:text-xl`}>{feat.title}</h3>
              <p className={`${t.muted} text-sm mt-2 font-medium leading-relaxed`}>
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-8 text-center relative overflow-hidden z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none z-0" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className={`text-6xl font-black ${t.text} tracking-tight`}>
            Ready to Fix Your City?
          </h2>
          <p className={`${t.muted} text-xl mt-4 max-w-2xl mx-auto font-medium leading-relaxed`}>
            Join citizens making Maharashtra better, one report at a time
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block mt-10"
          >
            <Link
              to={user ? "/report" : "/login"}
              className="animate-glow bg-blue-600 hover:bg-blue-500 text-white font-bold px-12 py-5 rounded-2xl text-xl transition duration-200 block text-center"
            >
              Start Reporting Free &rarr;
            </Link>
          </motion.div>

          <p className="text-[#6B7280] text-sm mt-4 font-semibold uppercase tracking-wider">
            No credit card required &bull; Free forever &bull; Powered by AI
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`${t.bg} border-t ${t.border} py-12 px-8 relative z-10 w-full`}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center md:text-left text-[#6B7280] text-xs">
          {/* Left: Logo + tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className={`${t.text} font-bold text-lg flex items-center gap-1.5`}>
              <span>⚡</span> CivicPulse
            </div>
            <p className="text-[#6B7280] text-xs mt-1">
              Making cities better, one report at a time.
            </p>
          </div>

          {/* Center: Copyright */}
          <div className="text-[#6B7280] text-xs md:text-center font-medium">
            © 2026 CivicPulse • Vibe2Ship Hackathon
          </div>


        </div>
      </footer>
    </div>
  );
}
