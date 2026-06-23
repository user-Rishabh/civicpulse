import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    departments: 0,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("civicpulse_issues");
      const issues = stored ? JSON.parse(stored) : [];
      
      const total = issues.length;
      const resolved = issues.filter(issue => issue.status === "Resolved").length;
      
      const departmentsSet = new Set(issues.map(issue => issue.department));
      const departments = departmentsSet.size;

      setStats({ total, resolved, departments });
    } catch (e) {
      console.error("Failed to load issues from localStorage", e);
    }
  }, []);

  return (
    <div className="pt-32 pb-20 px-8 max-w-6xl mx-auto flex flex-col items-center">
      {/* Hero Section */}
      <div className="text-center max-w-3xl">
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs inline-flex items-center gap-1.5 mb-6 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          ✨ Powered by Gemini 1.5 Flash Vision
        </span>
        
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-6">
          Report. Track. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Resolve.
          </span>
        </h1>
        
        <p className="text-[#9CA3AF] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Upload a photo of any civic problem — AI instantly categorizes it, assigns severity, and routes it to the right municipal department.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/report"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition duration-200 text-center"
          >
            Report an Issue →
          </Link>
          <Link
            to="/feed"
            className="w-full sm:w-auto border border-[#374151] hover:bg-[#1F2937] text-white font-semibold px-8 py-4 rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition duration-200 text-center"
          >
            View Live Feed
          </Link>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="mt-28 w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white tracking-tight">
          How CivicPulse Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Card 1 */}
          <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] hover:border-blue-500/30 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-4">
              📸
            </div>
            <h3 className="text-white font-semibold text-lg">Snap & Upload</h3>
            <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed">
              Take a photo of any civic issue — pothole, water leak, broken streetlight — and upload it instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] hover:border-blue-500/30 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-4">
              🤖
            </div>
            <h3 className="text-white font-semibold text-lg">AI Analyzes</h3>
            <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed">
              Gemini Vision identifies the issue type, severity level, and which municipal department should handle it.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] hover:border-blue-500/30 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-4">
              📍
            </div>
            <h3 className="text-white font-semibold text-lg">Track Resolution</h3>
            <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed">
              Issue gets logged with location. Community upvotes push it up priority. Track status till resolved.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#111827] rounded-2xl p-8 border border-[#374151] text-center flex flex-col justify-center">
            <span className="text-5xl font-black text-blue-400 tracking-tight">
              {stats.total}
            </span>
            <span className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mt-3">
              Total Issues Reported
            </span>
          </div>

          <div className="bg-[#111827] rounded-2xl p-8 border border-[#374151] text-center flex flex-col justify-center">
            <span className="text-5xl font-black text-green-400 tracking-tight">
              {stats.resolved}
            </span>
            <span className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mt-3">
              Issues Resolved
            </span>
          </div>

          <div className="bg-[#111827] rounded-2xl p-8 border border-[#374151] text-center flex flex-col justify-center">
            <span className="text-5xl font-black text-amber-400 tracking-tight">
              {stats.departments}
            </span>
            <span className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mt-3">
              Departments Notified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
