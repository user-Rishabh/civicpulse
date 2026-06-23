import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Report Issue", path: "/report" },
    { name: "Live Feed", path: "/feed" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  const isActive = (path) => location.pathname === path;

  const truncateEmail = (email) => {
    if (!email) return "";
    return email.length > 20 ? email.substring(0, 17) + "..." : email;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0A0F1E]/90 backdrop-blur-md border-b border-[#374151] px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-1 group">
        <span className="text-white font-bold text-xl tracking-tight transition group-hover:scale-105 duration-200">
          ⚡ Civic
        </span>
        <span className="text-blue-400 font-bold text-xl tracking-tight transition group-hover:scale-105 duration-200">
          Pulse
        </span>
      </Link>

      {/* Nav Links and Auth info */}
      <div className="flex items-center gap-6 md:gap-8 flex-wrap justify-center">
        {navItems.map((item) => (
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

        {/* Separator line */}
        <span className="w-[1px] h-4 bg-[#374151] hidden sm:inline-block"></span>

        {/* Auth section */}
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
