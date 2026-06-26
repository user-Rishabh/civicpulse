import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
        ...baseItems,
        { name: "Report Issue", path: "/report" },
        { name: "Live Feed", path: "/feed" },
        { name: "My Dashboard", path: "/citizen-dashboard" },
      ];
    }
  };

  const filteredNavItems = getNavItems();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0A0F1E]/90 backdrop-blur-md border-b border-[#374151] px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Left side: Brand logo + Tabular nav links */}
      <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
        <Link to="/" className="flex items-center gap-1 group shrink-0">
          <span className="text-white font-bold text-xl tracking-tight transition group-hover:scale-105 duration-200">
            ⚡ Civic
          </span>
          <span className="text-blue-400 font-bold text-xl tracking-tight transition group-hover:scale-105 duration-200">
            Pulse
          </span>
        </Link>
        
        {/* Nav Links - Tabular format */}
        <div className="flex items-center gap-6 md:gap-8 flex-wrap justify-center">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm transition-all duration-200 ${
                isActive(item.path)
                  ? "text-blue-400 font-semibold"
                  : "text-[#9CA3AF] hover:text-white font-medium"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Right side: Auth section */}
      <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
        {user ? (
          <div className="flex items-center gap-4">
            <span
              className="text-[#9CA3AF] text-sm font-medium"
              title={user.email}
            >
              {truncateEmail(user.email)}
            </span>
            <button
              onClick={logout}
              className="text-[#9CA3AF] hover:text-red-400 text-sm font-medium cursor-pointer transition-colors duration-200 border-none bg-transparent outline-none"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
