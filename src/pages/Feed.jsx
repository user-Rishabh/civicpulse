import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { verifyInProgressImage, verifyResolvedImage } from "../lib/gemini";
import { useTheme } from "../context/ThemeContext";

export default function Feed() {
  const { isDark } = useTheme();

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

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Modal & Verification states
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [uploadingStage, setUploadingStage] = useState(""); // "inProgress" or "resolved"
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  const handleProgressImageUpload = async (e, stage) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setVerifyLoading(true);
    setVerifyError("");
    setVerifySuccess("");
    setUploadingStage(stage);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      try {
        const mimeType = dataUrl.split(";")[0].split(":")[1];
        const base64Data = dataUrl.split(",")[1];

        let result;
        if (stage === "inProgress") {
          result = await verifyInProgressImage(base64Data, mimeType, selectedIssue.category);
        } else {
          result = await verifyResolvedImage(base64Data, mimeType, selectedIssue.category);
        }

        if (result && result.is_verified) {
          setVerifySuccess(result.reason || "Verification Successful!");
          
          // Identify document ID for updating Firestore
          const targetDocId = selectedIssue.docId;
          if (!targetDocId) {
            throw new Error("Firestore document reference is missing.");
          }

          const docRef = doc(db, "issues", targetDocId);
          const nowStr = new Date().toISOString().split("T")[0];
          
          const updates = {};
          if (stage === "inProgress") {
            updates.status = "In Progress";
            updates.inProgressImage = dataUrl;
            updates.inProgressDate = nowStr;
            updates.inProgressReason = result.reason;
          } else {
            updates.status = "Resolved";
            updates.resolvedImage = dataUrl;
            updates.resolvedDate = nowStr;
            updates.resolvedReason = result.reason;
          }

          await updateDoc(docRef, updates);

          // Update selectedIssue state in place
          setSelectedIssue(prev => ({
            ...prev,
            ...updates
          }));
        } else {
          setVerifyError(result?.reason || "AI Verification Failed. The image does not match the expected phase.");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setVerifyError(err.message || "Failed to process image. Please try again.");
      } finally {
        setVerifyLoading(false);
        setUploadingStage("");
      }
    };
  };

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
        <h1 className={`text-3xl font-bold ${t.text} tracking-tight`}>Live Issue Feed</h1>
        {!loading && (
          <span className="bg-blue-500/20 text-blue-400 rounded-full px-3 py-1 text-sm font-semibold animate-fade-in">
            {filteredIssues.length} {filteredIssues.length === 1 ? "Issue" : "Issues"}
          </span>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mt-6 mb-8 flex gap-2 flex-wrap items-center">
        <span className={`${t.muted} text-xs font-semibold uppercase tracking-wider mr-2`}>Filter By:</span>
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setSelectedFilter(btn.value)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition duration-200 border ${
              selectedFilter === btn.value
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                : `${t.surface} ${t.border} ${t.muted} hover:text-white hover:border-[#4B5563]`
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
          <span className={`${t.muted} text-sm font-medium`}>Syncing live reports from database...</span>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className={`text-center py-20 ${t.surface}/40 border ${t.border} rounded-2xl flex flex-col items-center justify-center p-8`}>
          <span className="text-6xl mb-4">📭</span>
          <h2 className={`font-semibold text-xl ${t.text}`}>No Issues Reported Yet</h2>
          <p className={`${t.muted} text-sm mt-2 max-w-sm`}>
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
              onClick={() => {
                setSelectedIssue(issue);
                setVerifyError("");
                setVerifySuccess("");
              }}
              className={`rounded-2xl border overflow-hidden hover:border-blue-500/50 transition-all duration-300 flex flex-col group cursor-pointer ${t.card}`}
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
                <span className={`absolute top-3 left-3 ${t.bg}/80 backdrop-blur ${t.text} text-xs px-2.5 py-1.5 rounded-lg border ${t.border} font-semibold`}>
                  {issue.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
                    {issue.department}
                  </div>
                  <h3 className={`text-sm mt-2 font-medium line-clamp-2 leading-relaxed ${t.text}`}>
                    {issue.description}
                  </h3>
                  
                  <div className="mt-4 space-y-2">
                    <div className={`flex items-center gap-1.5 ${t.muted} text-xs`}>
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
                <div className={`mt-5 pt-4 border-t ${t.border} flex items-center justify-between gap-2`}>
                  <div className="flex items-center gap-1">
                    <span
                      title="Click to cycle status"
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleStatus(issue.docId || issue.id, issue.status);
                      }}
                      className={getStatusBadgeClass(issue.status)}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`${t.muted} text-xs font-medium`}>{issue.date}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpvote(issue.docId || issue.id, issue.upvotes);
                      }}
                      className={`hover:bg-opacity-80 border font-semibold px-3 py-1.5 rounded-lg text-xs transition duration-200 flex items-center gap-1.5 cursor-pointer ${t.surface2} ${t.border} ${t.text}`}
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

      {/* 6. DETAIL MODAL */}
      {selectedIssue && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-fade-in ${
          isDark ? 'bg-[#0A0F1E]/85' : 'bg-[#EEF2FF]/85'
        }`}>
          <div className={`border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative animate-scale-in ${t.surface} ${t.border}`}>
            
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b ${t.border}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-xl font-bold tracking-tight ${t.text}`}>Issue Details</h2>
                <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-lg border border-blue-500/30 font-semibold uppercase tracking-wider">
                  {selectedIssue.category}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getSeverityBadgeClass(selectedIssue.severity).replace("rounded-full px-2.5 py-1 text-xs font-bold border ", "")}`}>
                  {selectedIssue.severity} Severity
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedIssue(null);
                  setVerifyError("");
                  setVerifySuccess("");
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${t.muted} hover:${t.text} ${t.surface2} hover:bg-opacity-85 border ${t.border}`}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
              
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div className={`${t.surface2}/50 rounded-2xl p-5 border ${t.border} space-y-4`}>
                  <div>
                    <span className={`${t.muted} text-xs font-semibold uppercase tracking-wider block`}>Description</span>
                    <p className={`${t.text} text-sm mt-1.5 leading-relaxed font-medium`}>{selectedIssue.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className={`${t.muted} text-xs font-semibold uppercase tracking-wider block`}>Department</span>
                      <span className="text-blue-400 text-sm font-semibold mt-1 block">{selectedIssue.department}</span>
                    </div>
                    <div>
                      <span className={`${t.muted} text-xs font-semibold uppercase tracking-wider block`}>Est. Resolution</span>
                      <span className={`${t.text} text-sm font-semibold mt-1 block`}>{selectedIssue.estimated_resolution_days || 7} Days</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`flex items-center gap-2 text-sm ${t.muted}`}>
                    <span className="text-lg">📍</span>
                    <span className={`font-semibold ${t.text}`}>Location:</span>
                    <span>{selectedIssue.location}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${t.muted}`}>
                    <span className="text-lg">👤</span>
                    <span className={`font-semibold ${t.text}`}>Reporter:</span>
                    <span>{selectedIssue.reporter || "Anonymous"}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${t.muted}`}>
                    <span className="text-lg">📅</span>
                    <span className={`font-semibold ${t.text}`}>Reported Date:</span>
                    <span>{selectedIssue.date}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${t.muted}`}>
                    <span className="text-lg">👍</span>
                    <span className={`font-semibold ${t.text}`}>Upvotes:</span>
                    <span>{selectedIssue.upvotes || 0}</span>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-2">
                  <h4 className="text-blue-400 font-semibold text-sm flex items-center gap-1.5">
                    <span>💡</span> AI Recommended Action Plan
                  </h4>
                  <p className={`${isDark ? 'text-gray-300' : 'text-[#475569]'} text-sm leading-relaxed`}>{selectedIssue.suggested_action}</p>
                </div>
              </div>

              {/* Right Column: Visual Timeline Progress */}
              <div className="space-y-6">
                <h3 className={`font-bold text-lg tracking-tight mb-4 ${t.text}`}>Resolution Timeline</h3>
                
                <div className={`relative border-l-2 ${t.border} ml-4 pl-6 space-y-8`}>
                  
                  {/* Timeline Stage 1: Reported */}
                  <div className="relative">
                    {/* Circle Pin */}
                    <div className={`absolute -left-[31px] top-1 bg-green-500 w-4 h-4 rounded-full border-4 ${isDark ? 'border-[#111827]' : 'border-[#E8EFFE]'}`}></div>
                    <div>
                      <h4 className={`font-semibold text-sm flex items-center gap-2 ${t.text}`}>
                        <span>Phase 1: Issue Reported</span>
                        <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-green-500/20">Active</span>
                      </h4>
                      <p className={`${t.muted} text-xs mt-1`}>Logged into CivicPulse database.</p>
                      <div className={`mt-3 relative rounded-xl overflow-hidden border ${t.border} max-w-[240px]`}>
                        <img src={selectedIssue.imagePreview} alt="Original issue" className="w-full h-32 object-cover" />
                      </div>
                    </div>
                  </div>

                  {/* Timeline Stage 2: Work Started */}
                  <div className="relative">
                    {/* Circle Pin */}
                    <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 ${isDark ? 'border-[#111827]' : 'border-[#E8EFFE]'} ${
                      selectedIssue.status === "In Progress" || selectedIssue.status === "Resolved" ? "bg-blue-500" : "bg-[#374151]"
                    }`}></div>
                    <div>
                      <h4 className={`font-semibold text-sm flex items-center gap-2 ${t.text}`}>
                        <span>Phase 2: Work Started</span>
                        {(selectedIssue.status === "In Progress" || selectedIssue.status === "Resolved") && (
                          <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-blue-500/20">Verified</span>
                        )}
                      </h4>
                      
                      {/* Upload Button or Image */}
                      {selectedIssue.inProgressImage ? (
                        <div className="mt-3 space-y-2">
                          <div className={`relative rounded-xl overflow-hidden border ${t.border} max-w-[240px]`}>
                            <img src={selectedIssue.inProgressImage} alt="Work started" className="w-full h-32 object-cover" />
                          </div>
                          <p className={`${t.muted} text-xs`}>Started: {selectedIssue.inProgressDate}</p>
                          {selectedIssue.inProgressReason && (
                            <p className="text-blue-400/90 text-xs italic bg-blue-500/5 p-2 rounded-lg border border-blue-500/10 max-w-[280px]">
                              🤖 {selectedIssue.inProgressReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3">
                          {selectedIssue.status === "Pending" ? (
                            <div className="space-y-3">
                              <p className={`${t.muted} text-xs`}>Municipal work started? Upload progress/construction photos to verify.</p>
                              
                              <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition duration-200 shadow-md shadow-blue-500/10">
                                📁 Upload Progress Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleProgressImageUpload(e, "inProgress")}
                                  disabled={verifyLoading}
                                />
                              </label>

                              {verifyLoading && uploadingStage === "inProgress" && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="animate-spin border-2 border-blue-500 border-t-transparent rounded-full w-4 h-4"></div>
                                  <span className="text-blue-400 text-xs font-semibold animate-pulse">Gemini AI verifying construction/repairs...</span>
                                </div>
                              )}
                              {verifyError && uploadingStage === "inProgress" && (
                                <p className="text-red-400 text-xs mt-2 bg-red-500/10 border border-red-500/20 p-2 rounded-lg font-medium">{verifyError}</p>
                              )}
                            </div>
                          ) : (
                            <p className={`${t.muted} text-xs`}>Waiting for Stage 1 completion.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Stage 3: Resolved */}
                  <div className="relative">
                    {/* Circle Pin */}
                    <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 ${isDark ? 'border-[#111827]' : 'border-[#E8EFFE]'} ${
                      selectedIssue.status === "Resolved" ? "bg-green-500" : "bg-[#374151]"
                    }`}></div>
                    <div>
                      <h4 className={`font-semibold text-sm flex items-center gap-2 ${t.text}`}>
                        <span>Phase 3: Work Completed</span>
                        {selectedIssue.status === "Resolved" && (
                          <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-green-500/20">Resolved</span>
                        )}
                      </h4>
                      
                      {/* Upload Button or Image */}
                      {selectedIssue.resolvedImage ? (
                        <div className="mt-3 space-y-2">
                          <div className={`relative rounded-xl overflow-hidden border ${t.border} max-w-[240px]`}>
                            <img src={selectedIssue.resolvedImage} alt="Work completed" className="w-full h-32 object-cover" />
                          </div>
                          <p className={`${t.muted} text-xs`}>Completed: {selectedIssue.resolvedDate}</p>
                          {selectedIssue.resolvedReason && (
                            <p className="text-green-400/90 text-xs italic bg-green-500/5 p-2 rounded-lg border border-green-500/10 max-w-[280px]">
                              🤖 {selectedIssue.resolvedReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3">
                          {selectedIssue.status === "In Progress" ? (
                            <div className="space-y-3">
                              <p className={`${t.muted} text-xs`}>Municipal work completed? Upload final photo of the repaired area to resolve.</p>
                              
                              <label className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition duration-200 shadow-md shadow-green-500/10">
                                📁 Upload Completion Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleProgressImageUpload(e, "resolved")}
                                  disabled={verifyLoading}
                                />
                              </label>

                              {verifyLoading && uploadingStage === "resolved" && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="animate-spin border-2 border-green-500 border-t-transparent rounded-full w-4 h-4"></div>
                                  <span className="text-green-400 text-xs font-semibold animate-pulse">Gemini AI verifying road resolution...</span>
                                </div>
                              )}
                              {verifyError && uploadingStage === "resolved" && (
                                <p className="text-red-400 text-xs mt-2 bg-red-500/10 border border-red-500/20 p-2 rounded-lg font-medium">{verifyError}</p>
                              )}
                            </div>
                          ) : selectedIssue.status === "Resolved" ? null : (
                            <p className={`${t.muted} text-xs`}>Awaiting work progression.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end items-center px-6 py-4 border-t ${t.border} ${t.surface}`}>
              <button
                onClick={() => {
                  setSelectedIssue(null);
                  setVerifyError("");
                  setVerifySuccess("");
                }}
                className={`font-semibold px-5 py-2 rounded-xl transition text-sm cursor-pointer ${t.surface2} hover:bg-opacity-80 ${t.muted} hover:${t.text} border ${t.border}`}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
