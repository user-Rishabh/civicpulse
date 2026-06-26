import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();
  const [particles, setParticles] = useState([]);

  const phrases = [
    "Upload a photo → AI categorizes instantly",
    "Gemini Vision assigns severity automatically", 
    "Municipal department gets notified in seconds"
  ];
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <div className="bg-[#0A0F1E] min-h-screen text-[#F9FAFB] relative overflow-hidden flex flex-col">
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
          <span className="text-white">Report.</span>
          <span className="text-white">Track.</span>
          <span
            className="text-transparent bg-clip-text animate-gradient"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #3B82F6, #06B6D4, #8B5CF6, #3B82F6)",
            }}
          >
            Resolve.
          </span>
        </motion.h1>

        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-[#9CA3AF] text-xl max-w-2xl mt-8 leading-relaxed min-h-[3rem] flex items-center justify-center font-medium"
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
              className="flex items-center justify-center w-full sm:w-auto border-2 border-[#374151] hover:border-blue-500 text-white px-10 py-4 rounded-2xl text-lg transition duration-200 font-semibold"
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
            <div key={text} className="text-[#9CA3AF] text-sm flex items-center gap-1.5 font-medium">
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
          <div className="animate-float bg-[#111827] rounded-3xl border border-[#374151] p-6 max-w-lg mx-auto shadow-[0_0_100px_rgba(59,130,246,0.2)]">
            {/* Top bar with dots */}
            <div className="flex items-center justify-between mb-4 border-b border-[#374151]/40 pb-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <span className="text-white text-xs font-semibold tracking-wider uppercase opacity-80">
                CivicPulse
              </span>
              <div className="w-12"></div>
            </div>

            {/* Fake Image Area */}
            <div className="bg-[#1F2937] rounded-xl h-32 flex items-center justify-center border border-[#374151]/50">
              <span className="text-[#9CA3AF] text-sm font-medium flex items-center gap-2">
                📸 Photo Uploaded
              </span>
            </div>

            {/* Fake AI Analysis row */}
            <div className="mt-4 flex gap-2 justify-center">
              <span className="rounded-full px-3 py-1 text-xs font-bold text-blue-400 bg-blue-500/20 border border-blue-500/30">
                Pothole
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold text-red-400 bg-red-500/20 border border-red-500/30">
                Critical
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30">
                BMC
              </span>
            </div>

            {/* Fake Progress Bar */}
            <div className="mt-4 bg-[#1F2937] rounded-full h-2 w-full border border-[#374151]/30">
              <div className="w-2/3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full h-full"></div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="absolute -top-4 -right-8 bg-green-500 rounded-2xl px-4 py-2.5 shadow-lg animate-bounce text-white text-xs font-bold border border-green-400/25">
            ✅ Issue Reported!
          </div>

          <div className="absolute -bottom-4 -left-8 bg-[#111827] border border-[#374151] rounded-2xl px-5 py-3 shadow-2xl text-left">
            <div className="text-white text-xs font-bold flex items-center gap-1.5">
              <span>🤖</span> Gemini Analyzed
            </div>
            <div className="text-[#9CA3AF] text-xs mt-0.5 font-semibold">
              Pothole &bull; Critical &bull; BMC
            </div>
          </div>

          {/* Floating stats cards */}
          <div 
            style={{ animationDelay: "0s" }}
            className="hidden sm:block absolute -left-16 top-8 bg-[#111827] border border-[#374151] rounded-2xl px-4 py-3 shadow-2xl animate-float z-20 text-left"
          >
            <div className="text-white text-xs font-bold">
              🔥 12 Issues Fixed Today
            </div>
          </div>

          <div 
            style={{ animationDelay: "1s" }}
            className="hidden sm:block absolute -right-16 bottom-8 bg-[#111827] border border-green-500/30 rounded-2xl px-4 py-3 shadow-2xl animate-float z-20 text-left"
          >
            <div className="text-green-400 text-xs font-bold">
              ✅ AI Verified
            </div>
            <div className="text-[#9CA3AF] text-xs">
              Gemini confidence: 98%
            </div>
          </div>

          <div 
            style={{ animationDelay: "0.5s" }}
            className="hidden sm:block absolute -right-8 top-4 bg-[#111827] border border-blue-500/30 rounded-2xl px-4 py-3 shadow-2xl animate-float z-20 text-left"
          >
            <div className="text-blue-400 text-xs font-bold">
              ⚡ 0.8s Analysis
            </div>
          </div>
        </motion.div>
      </section>

      {/* STATS TICKER */}
      <div className="relative z-10 py-8 bg-[#111827]/50 border-y border-[#374151] overflow-hidden mt-0">
        <div className="animate-marquee flex gap-16 items-center">
          {Array.from({ length: 4 }).flatMap(() => [
            "🏙️ Mumbai",
            "🔧 Pothole Fixed",
            "💧 Water Leak Resolved",
            "🚦 3 Critical Issues Today",
            "⚡ AI Verified",
          ]).map((item, idx) => (
            <div
              key={idx}
              className="text-[#9CA3AF] text-sm whitespace-nowrap flex items-center gap-2 font-semibold uppercase tracking-wider"
            >
              <span className="text-blue-400">{item.split(" ")[0]}</span>
              <span>{item.split(" ").slice(1).join(" ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS SECTION */}
      <section className="py-32 px-8 relative overflow-hidden z-10">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-blue-600/3 blur-3xl pointer-events-none" />
        
        <h2 className="text-5xl font-black text-center text-white tracking-tight">
          How It Works
        </h2>
        <div className="mx-auto mt-3 w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto w-full">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -8, borderColor: "rgba(59,130,246,0.5)" }}
            className="bg-[#111827] rounded-3xl p-8 border border-[#374151] relative overflow-hidden transition-colors duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="text-8xl font-black text-blue-500/10 absolute top-4 right-4 leading-none pointer-events-none select-none">
              1
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">
              📸
            </div>
            <h3 className="text-white font-bold text-2xl mt-6">Snap & Upload</h3>
            <p className="text-[#9CA3AF] mt-3 leading-relaxed text-sm font-medium">
              Take a photo of any civic issue — pothole, leak, broken light — and upload instantly.
            </p>
          </motion.div>

          {/* Connector 1 */}
          <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-[31.5%] text-blue-500/30 text-4xl font-bold select-none pointer-events-none">
            &rarr;
          </div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -8, borderColor: "rgba(59,130,246,0.5)" }}
            className="bg-[#111827] rounded-3xl p-8 border border-[#374151] relative overflow-hidden transition-colors duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="text-8xl font-black text-blue-500/10 absolute top-4 right-4 leading-none pointer-events-none select-none">
              2
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">
              🤖
            </div>
            <h3 className="text-white font-bold text-2xl mt-6">AI Analyzes</h3>
            <p className="text-[#9CA3AF] mt-3 leading-relaxed text-sm font-medium">
              Gemini Vision identifies type, severity, and which municipal department handles it.
            </p>
          </motion.div>

          {/* Connector 2 */}
          <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-[65%] text-blue-500/30 text-4xl font-bold select-none pointer-events-none">
            &rarr;
          </div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -8, borderColor: "rgba(59,130,246,0.5)" }}
            className="bg-[#111827] rounded-3xl p-8 border border-[#374151] relative overflow-hidden transition-colors duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="text-8xl font-black text-blue-500/10 absolute top-4 right-4 leading-none pointer-events-none select-none">
              3
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">
              ✅
            </div>
            <h3 className="text-white font-bold text-2xl mt-6">Track & Resolve</h3>
            <p className="text-[#9CA3AF] mt-3 leading-relaxed text-sm font-medium">
              Community upvotes prioritize issues. Track status until your city is fixed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-32 px-8 bg-[#111827]/30 relative z-10">
        <h2 className="text-5xl font-black text-center text-white tracking-tight">
          Everything You Need
        </h2>
        <p className="text-[#9CA3AF] text-center mt-3 text-lg font-medium">
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
              className="bg-[#111827] rounded-3xl p-6 border border-[#374151] transition-all duration-300 text-left"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${
                  colorMap[feat.color]
                }`}
              >
                {feat.icon}
              </div>
              <h3 className="text-white font-bold text-lg">{feat.title}</h3>
              <p className="text-[#9CA3AF] text-sm mt-2 font-medium leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-8 text-center relative overflow-hidden z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-6xl font-black text-white tracking-tight">
            Ready to Fix Your City?
          </h2>
          <p className="text-[#9CA3AF] text-xl mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
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
      <footer className="bg-[#0A0F1E] border-t border-[#374151] py-12 px-8 relative z-10 w-full">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <div className="text-white font-bold text-xl flex items-center justify-center md:justify-start gap-1.5">
              <span>⚡</span> CivicPulse
            </div>
            <p className="text-[#6B7280] text-sm mt-1 font-medium">
              Making cities better, one report at a time.
            </p>
          </div>
          <div className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider text-center">
            Built for Vibe2Ship Hackathon 2026
          </div>
          <div>
            <div className="text-[#9CA3AF] text-sm font-semibold">
              Powered by Gemini AI + Firebase
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
