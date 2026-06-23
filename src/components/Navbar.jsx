import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Report Issue", path: "/report" },
    { name: "Live Feed", path: "/feed" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  const isActive = (path) => location.pathname === path;

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

      {/* Nav Links */}
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
      </div>
    </nav>
  );
}
