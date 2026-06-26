import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Navbar() {
  const location = useLocation();
  const { user, userProfile, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const truncateEmail = (email) => {
    if (!email) return "";
    return email.length > 20 ? email.substring(0, 17) + "..." : email;
  };

  const getNavItems = () => {
    const baseItems = [{ name: "Home", path: "/" }];

    if (!user) {
      return baseItems;
    }

    if (userProfile?.role === "officer") {
      return [
        ...baseItems,
        { name: "Live Feed", path: "/feed" },
        { name: "Officer Panel", path: "/officer-dashboard" },
      ];
    } else {
      return [
        { name: "My Dashboard", path: "/citizen-dashboard" },
      ];
    }
  };

  const filteredNavItems = getNavItems();
  const firstLetter = user?.email ? user.email.charAt(0).toUpperCase() : "";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        {/* LEFT Logo & Brand */}
        <Link 
          to="/" 
          className="flex items-center gap-2 group shrink-0"
          style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246,0.5))" }}
        >
          <div className="bg-blue-600 rounded-lg w-8 h-8 flex items-center justify-center text-sm text-white font-bold">
            ⚡
          </div>
          <div className="flex">
            <span className="text-white font-bold text-xl">Civic</span>
            <span className="text-blue-400 font-bold text-xl">Pulse</span>
          </div>
        </Link>

        {/* CENTER (when logged in): nav links */}
        {user && (
          <div className="hidden md:flex items-center gap-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition px-4 py-2 rounded-lg ${
                  isActive(item.path)
                    ? "text-white bg-white/5"
                    : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}

        {/* RIGHT Auth actions */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {userProfile?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-white text-sm font-medium">
                {userProfile?.name || "User"}
              </span>
              <button
                onClick={logout}
                className="text-[#9CA3AF] hover:text-red-400 text-sm font-medium transition cursor-pointer bg-transparent border-none outline-none"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className="relative overflow-hidden group flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all duration-300"
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
