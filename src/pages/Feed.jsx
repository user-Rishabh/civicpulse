import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Feed() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    // Real-time synchronization with Firestore
    const issuesCollection = collection(db, "issues");
    const unsubscribe = onSnapshot(
      issuesCollection,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
        }));
        
        // Sort issues: newest report first (docId/timestamp or date/id)
        list.sort((a, b) => b.id - a.id);

        setIssues(list);
        // Sync to localStorage as fallback
        localStorage.setItem("civicpulse_issues", JSON.stringify(list));
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error, loading from local fallback:", error);
        try {
          const stored = localStorage.getItem("civicpulse_issues");
          setIssues(stored ? JSON.parse(stored) : []);
        } catch (e) {
          console.error("Failed to load local storage fallback", e);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpvote = async (docId, currentUpvotes) => {
    try {
      const docRef = doc(db, "issues", docId);
      await updateDoc(docRef, {
        upvotes: (currentUpvotes || 0) + 1,
      });
    } catch (e) {
      console.error("Failed to upvote in Firestore:", e);
      // Fallback update local state if offline
      const updated = issues.map((issue) => {
        if (issue.docId === docId) {
          return { ...issue, upvotes: (issue.upvotes || 0) + 1 };
        }
        return issue;
      });
      setIssues(updated);
    }
  };

  const cycleStatus = async (docId, currentStatus) => {
    let nextStatus = "Pending";
    if (currentStatus === "Pending") nextStatus = "In Progress";
    else if (currentStatus === "In Progress") nextStatus = "Resolved";
    else if (currentStatus === "Resolved") nextStatus = "Pending";

    try {
      const docRef = doc(db, "issues", docId);
      await updateDoc(docRef, {
        status: nextStatus,
      });
    } catch (e) {
      console.error("Failed to cycle status in Firestore:", e);
      // Fallback update local state if offline
      const updated = issues.map((issue) => {
        if (issue.docId === docId) {
          return { ...issue, status: nextStatus };
        }
        return issue;
      });
      setIssues(updated);
    }
  };

  const filterButtons = [
    { label: "All", value: "All" },
    { label: "Pothole", value: "Pothole" },
    { label: "Water Leak", value: "Water Leak" },
    { label: "Broken Streetlight", value: "Broken Streetlight" },
    { label: "Garbage Dumping", value: "Garbage Dumping" },
    { label: "Low Severity", value: "Low" },
    { label: "Medium Severity", value: "Medium" },
    { label: "High Severity", value: "High" },
    { label: "Critical Severity", value: "Critical" },
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
    { label: "Resolved", value: "Resolved" },
  ];

  const getFilteredIssues = () => {
    if (selectedFilter === "All") return issues;

    // Check if filter is a severity
    if (["Low", "Medium", "High", "Critical"].includes(selectedFilter)) {
      return issues.filter((issue) => issue.severity === selectedFilter);
    }

    // Check if filter is a status
    if (["Pending", "In Progress", "Resolved"].includes(selectedFilter)) {
      return issues.filter((issue) => issue.status === selectedFilter);
    }

    // Otherwise, filter by category
    return issues.filter((issue) => issue.category === selectedFilter);
  };

  const getSeverityBadgeClass = (sev) => {
    const base = "rounded-full px-2.5 py-1 text-xs font-bold border ";
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

  const getStatusBadgeClass = (status) => {
    const base = "rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer border select-none transition duration-200 ";
    switch (status) {
      case "Pending":
        return base + "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30";
      case "In Progress":
        return base + "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30";
      case "Resolved":
        return base + "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30";
      default:
        return base + "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30";
    }
  };

  const filteredIssues = getFilteredIssues();

  return (
    <div className="pt-28 px-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-white tracking-tight">Live Issue Feed</h1>
        {!loading && (
          <span className="bg-blue-500/20 text-blue-400 rounded-full px-3 py-1 text-sm font-semibold animate-fade-in">
            {filteredIssues.length} {filteredIssues.length === 1 ? "Issue" : "Issues"}
          </span>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mt-6 mb-8 flex gap-2 flex-wrap items-center">
        <span className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mr-2">Filter By:</span>
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setSelectedFilter(btn.value)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition duration-200 border ${
              selectedFilter === btn.value
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                : "bg-[#111827] border-[#374151] text-[#9CA3AF] hover:text-white hover:border-[#4B5563]"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
          <span className="text-[#9CA3AF] text-sm font-medium">Syncing live reports from database...</span>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-[#111827]/40 border border-[#374151] rounded-2xl flex flex-col items-center justify-center p-8">
          <span className="text-6xl mb-4">📭</span>
          <h2 className="text-white font-semibold text-xl">No Issues Reported Yet</h2>
          <p className="text-[#9CA3AF] text-sm mt-2 max-w-sm">
            Be the first to report a civic issue in your area or try selecting a different filter.
          </p>
          <Link
            to="/report"
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 shadow-lg shadow-blue-500/20"
          >
            Report First Issue →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <div
              key={issue.docId || issue.id}
              className="bg-[#111827] rounded-2xl border border-[#374151] overflow-hidden hover:border-blue-500/50 transition-all duration-300 flex flex-col group"
            >
              {/* Top Image Area */}
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={issue.imagePreview}
                  alt={issue.category}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className={`absolute top-3 right-3 shadow-md ${getSeverityBadgeClass(issue.severity)}`}>
                  {issue.severity}
                </span>
                <span className="absolute top-3 left-3 bg-[#0A0F1E]/80 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#374151] font-semibold">
                  {issue.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
                    {issue.department}
                  </div>
                  <h3 className="text-white text-sm mt-2 font-medium line-clamp-2 leading-relaxed">
                    {issue.description}
                  </h3>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[#9CA3AF] text-xs">
                      <span>📍</span>
                      <span className="truncate font-medium">{issue.location}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-blue-400/90 text-xs bg-blue-500/5 px-2.5 py-1.5 rounded-lg border border-blue-500/10">
                      <span className="mt-0.5">💡</span>
                      <span className="line-clamp-2 leading-relaxed">{issue.suggested_action}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-5 pt-4 border-t border-[#374151] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span
                      title="Click to cycle status"
                      onClick={() => cycleStatus(issue.docId || issue.id, issue.status)}
                      className={getStatusBadgeClass(issue.status)}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#6B7280] text-xs font-medium">{issue.date}</span>
                    <button
                      onClick={() => handleUpvote(issue.docId || issue.id, issue.upvotes)}
                      className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white hover:text-blue-400 font-semibold px-3 py-1.5 rounded-lg text-xs transition duration-200 flex items-center gap-1.5"
                    >
                      <span>👍</span>
                      <span>{issue.upvotes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
