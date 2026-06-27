import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const location = useLocation();
  const { user, userProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Monitor scrolling to shrink navbar and update scroll progress bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const t = {
    bg: isDark ? 'bg-[#030712]/70' : 'bg-white/70',
    bgScrolled: isDark ? 'bg-[#030712]/90 border-white/[0.08] shadow-2xl shadow-black/40' : 'bg-white/90 border-slate-200/80 shadow-md',
    border: isDark ? 'border-white/5' : 'border-slate-200/50',
    text: isDark ? 'text-slate-100' : 'text-slate-900',
    textHover: isDark ? 'hover:text-white' : 'hover:text-slate-950',
    muted: isDark ? 'text-slate-400' : 'text-slate-500',
  };

  const isActive = (path) => location.pathname === path;

  const getNavItems = () => {
    return [];
  };

  const filteredNavItems = getNavItems();

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 backdrop-blur-xl border-b transition-all duration-300 ${
      isScrolled ? `${t.bgScrolled} py-2.5` : `${t.bg} ${t.border} py-4`
    }`}>
      {/* Scroll Progress Indicator */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center">
        
        {/* LEFT: Logo & Brand */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 group shrink-0"
        >
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="bg-blue-600 rounded-lg w-8.5 h-8.5 flex items-center justify-center text-sm text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition-shadow duration-300"
          >
            ⚡
          </motion.div>
          <div className="flex">
            <span className={`font-black text-xl tracking-tight transition-colors duration-300 ${t.text}`}>Civic</span>
            <span className="text-blue-500 font-black text-xl tracking-tight">Pulse</span>
          </div>
        </Link>

        {/* CENTER: Navigation Links */}
        {filteredNavItems.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/10 dark:bg-white/5 p-1 rounded-xl border border-slate-500/10">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative text-xs font-bold transition px-4 py-2.5 rounded-lg transition-all duration-300 ${
                  isActive(item.path)
                    ? `${t.text}`
                    : `${t.muted} ${t.textHover}`
                }`}
              >
                <motion.span 
                  className="relative z-10 inline-block"
                  whileHover={{ y: -1.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
                
                {/* Underline grows from center on hover */}
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-blue-500 group-hover:w-[60%] transition-all duration-300 rounded-full z-20" />
                
                {isActive(item.path) && (
                  <motion.span
                    layoutId="nav-active-bg"
                    className="absolute inset-0 bg-white dark:bg-[#1E293B] rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* RIGHT: User Profile & Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center hover:border-blue-500 hover:bg-slate-500/5 dark:hover:bg-white/5 transition text-lg cursor-pointer ${t.border} ${t.text}`}
            title="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Profile Avatar */}
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm border border-white/20">
                {userProfile?.name?.[0]?.toUpperCase() || "U"}
              </div>
              
              <div className="hidden sm:flex flex-col text-left">
                <span className={`text-xs font-black transition-colors duration-300 leading-tight ${t.text}`}>
                  {userProfile?.name || "Citizen"}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold leading-none mt-0.5">
                  {userProfile?.role || "user"}
                </span>
              </div>

              <button
                onClick={logout}
                className="hover:text-red-500 dark:hover:text-red-400 text-xs font-bold transition cursor-pointer bg-transparent border-none outline-none pl-2 text-slate-400"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                to="/login"
                className="relative overflow-hidden group flex items-center justify-center bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all duration-300"
              >
                {/* Shimmer sweep effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <span>Sign In</span>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
}
