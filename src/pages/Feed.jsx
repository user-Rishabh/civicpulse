import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";
import { verifyInProgressImage, verifyResolvedImage, compareImagesForVerification } from "../lib/gemini";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// --- Community Verified Badge ---
function CommunityVerifiedBadge({ count }) {
  return (
    <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 rounded-full px-2.5 py-1 community-verified-card" style={{ animation: 'none', boxShadow: 'none', border: '1px solid rgba(251,191,36,0.55)' }}>
      <span className="shield-pulse text-sm">🛡</span>
      <span className="text-amber-400 text-xs font-black">Community Verified</span>
      <span className="bg-amber-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{count}</span>
    </div>
  );
}

// --- Animated check success ---
function VerifySuccess({ reason }) {
  return (
    <div className="verify-fade-up flex flex-col items-center gap-3 py-4">
      <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path className="checkmark-path" d="M6 17L13 24L26 9" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-green-400 font-bold text-sm text-center">Verification Accepted!</p>
      <p className="text-[#9CA3AF] text-xs text-center leading-relaxed max-w-xs">{reason}</p>
    </div>
  );
}

export default function Feed() {
  const { isDark } = useTheme();
  const { userProfile } = useAuth();
  const currentUserEmail = userProfile?.email || "";
  const currentUserName = userProfile?.name || userProfile?.displayName || "Anonymous";

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

  // Existing detail modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [uploadingStage, setUploadingStage] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  // Community Verification modal state
  const [cvModalIssue, setCvModalIssue] = useState(null);
  const [cvPhotoFile, setCvPhotoFile] = useState(null);
  const [cvPhotoPreview, setCvPhotoPreview] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvResult, setCvResult] = useState(null); // { accepted, reason, confidence }
  const [cvError, setCvError] = useState("");

  const cvFileInputRef = useRef(null);

  // ── Existing progress/resolution uploader ──────────────────────────────
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
          const targetDocId = selectedIssue.docId;
          if (!targetDocId) throw new Error("Firestore document reference is missing.");
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
          setSelectedIssue(prev => ({ ...prev, ...updates }));
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

  // ── Firestore listener ─────────────────────────────────────────────────
  useEffect(() => {
    const issuesCollection = collection(db, "issues");
    const unsubscribe = onSnapshot(
      issuesCollection,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
        list.sort((a, b) => b.id - a.id);
        setIssues(list);
        localStorage.setItem("civicpulse_issues", JSON.stringify(list));
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error, loading from local fallback:", error);
        try {
          const stored = localStorage.getItem("civicpulse_issues");
          setIssues(stored ? JSON.parse(stored) : []);
        } catch (e) { console.error("Failed to load local storage fallback", e); }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Upvote ─────────────────────────────────────────────────────────────
  const handleUpvote = async (docId, currentUpvotes) => {
    try {
      await updateDoc(doc(db, "issues", docId), { upvotes: (currentUpvotes || 0) + 1 });
    } catch (e) {
      setIssues(issues.map(issue =>
        issue.docId === docId ? { ...issue, upvotes: (issue.upvotes || 0) + 1 } : issue
      ));
    }
  };

  const cycleStatus = async (docId, currentStatus) => {
    let nextStatus = "Pending";
    if (currentStatus === "Pending") nextStatus = "In Progress";
    else if (currentStatus === "In Progress") nextStatus = "Resolved";
    try {
      await updateDoc(doc(db, "issues", docId), { status: nextStatus });
    } catch (e) {
      setIssues(issues.map(issue =>
        issue.docId === docId ? { ...issue, status: nextStatus } : issue
      ));
    }
  };

  // ── Community Verify helpers ───────────────────────────────────────────
  const isOriginalReporter = (issue) =>
    currentUserEmail && issue.userEmail && currentUserEmail === issue.userEmail;

  const hasAlreadyVerified = (issue) => {
    if (!currentUserEmail) return false;
    const verifications = issue.verifications || [];
    return verifications.some(v => v.verifierEmail === currentUserEmail);
  };

  const openCvModal = (issue, e) => {
    e.stopPropagation();
    setCvModalIssue(issue);
    setCvPhotoFile(null);
    setCvPhotoPreview(null);
    setCvResult(null);
    setCvError("");
  };

  const closeCvModal = () => {
    setCvModalIssue(null);
    setCvPhotoFile(null);
    setCvPhotoPreview(null);
    setCvResult(null);
    setCvError("");
  };

  const handleCvPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvPhotoFile(file);
    setCvResult(null);
    setCvError("");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setCvPhotoPreview(reader.result);
  };

  const handleCommunityVerify = async () => {
    if (!cvPhotoFile || !cvModalIssue) return;
    setCvLoading(true);
    setCvResult(null);
    setCvError("");

    try {
      // Convert verification photo to base64
      const verifyDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(cvPhotoFile);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      const verifyBase64 = verifyDataUrl.split(",")[1];
      const verifyMime = verifyDataUrl.split(";")[0].split(":")[1];

      // Original image
      const originalDataUrl = cvModalIssue.imagePreview || "";
      const originalBase64 = originalDataUrl.split(",")[1];
      const originalMime = originalDataUrl.split(";")[0].split(":")[1] || "image/jpeg";

      const geminiResult = await compareImagesForVerification(
        originalBase64, originalMime,
        verifyBase64, verifyMime,
        cvModalIssue.category
      );

      const accepted = geminiResult.verified && geminiResult.confidence === "High";

      if (accepted) {
        // Write verification to Firestore
        const docRef = doc(db, "issues", cvModalIssue.docId);
        const newVerification = {
          verifierName: currentUserName,
          verifierEmail: currentUserEmail,
          timestamp: new Date().toISOString(),
          confidence: geminiResult.confidence,
          reason: geminiResult.reason,
        };

        const currentVerifications = cvModalIssue.verifications || [];
        const newCount = currentVerifications.length + 1;

        const updates = {
          verifications: arrayUnion(newVerification),
          verificationCount: newCount,
        };

        // Auto-escalate when threshold reached
        if (newCount >= 3) {
          updates.communityVerified = true;
          updates.severity = "Critical";
        }

        await updateDoc(docRef, updates);

        setCvResult({ accepted: true, reason: geminiResult.reason, confidence: geminiResult.confidence });
      } else {
        setCvResult({
          accepted: false,
          reason: geminiResult.reason || "The uploaded photo does not match the original issue location or category.",
          confidence: geminiResult.confidence,
        });
      }
    } catch (err) {
      console.error("Community verification error:", err);
      setCvError(err.message || "Failed to compare images. Please try again.");
    } finally {
      setCvLoading(false);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────────────
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
    { label: "🛡 Community Verified", value: "CommunityVerified" },
  ];

  const getFilteredIssues = () => {
    if (selectedFilter === "All") return issues;
    if (selectedFilter === "CommunityVerified") return issues.filter(i => i.communityVerified);
    if (["Low", "Medium", "High", "Critical"].includes(selectedFilter))
      return issues.filter(i => i.severity === selectedFilter);
    if (["Pending", "In Progress", "Resolved"].includes(selectedFilter))
      return issues.filter(i => i.status === selectedFilter);
    return issues.filter(i => i.category === selectedFilter);
  };

  const getSeverityBadgeClass = (sev) => {
    const base = "rounded-full px-2.5 py-1 text-xs font-bold border ";
    switch (sev) {
      case "Low":      return base + "bg-green-500/20 text-green-400 border-green-500/30";
      case "Medium":   return base + "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "High":     return base + "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Critical": return base + "bg-red-500/20 text-red-400 border-red-500/30";
      default:         return base + "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadgeClass = (status) => {
    const base = "rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer border select-none transition duration-200 ";
    switch (status) {
      case "Pending":     return base + "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30";
      case "In Progress": return base + "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30";
      case "Resolved":    return base + "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30";
      default:            return base + "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30";
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
        {!loading && issues.filter(i => i.communityVerified).length > 0 && (
          <span className="bg-amber-500/20 text-amber-400 rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1.5 border border-amber-500/30">
            <span className="shield-pulse">🛡</span>
            {issues.filter(i => i.communityVerified).length} Verified
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
          <Link to="/report" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 shadow-lg shadow-blue-500/20">
            Report First Issue →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => {
            const verCount = issue.verificationCount || (issue.verifications || []).length;
            const isVerified = issue.communityVerified;
            const isCriticalVerified = isVerified && issue.severity === "Critical";
            const canVerify = !isOriginalReporter(issue) && !hasAlreadyVerified(issue) && issue.status !== "Resolved";

            return (
              <motion.div
                key={issue.docId || issue.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                onClick={() => {
                  setSelectedIssue(issue);
                  setVerifyError("");
                  setVerifySuccess("");
                }}
                className={`rounded-2xl border overflow-hidden hover:border-blue-500/50 transition-all duration-300 flex flex-col group cursor-pointer ${t.card} ${
                  isVerified ? "community-verified-card" : ""
                } ${isCriticalVerified ? "critical-verified-glow" : ""}`}
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img src={issue.imagePreview} alt={issue.category} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className={`absolute top-3 right-3 shadow-md ${getSeverityBadgeClass(issue.severity)}`}>{issue.severity}</span>
                  <span className={`absolute top-3 left-3 ${t.bg}/80 backdrop-blur ${t.text} text-xs px-2.5 py-1.5 rounded-lg border ${t.border} font-semibold`}>{issue.category}</span>

                  {/* Community Verified overlay badge */}
                  {isVerified && (
                    <div className="absolute bottom-3 left-3 verify-count-badge">
                      <CommunityVerifiedBadge count={verCount} />
                    </div>
                  )}
                  {!isVerified && verCount > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 rounded-full px-2 py-0.5">
                      <span className="text-blue-400 text-[10px] font-bold">👥 {verCount} verif.</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider">{issue.department}</div>
                    <h3 className={`text-sm mt-2 font-medium line-clamp-2 leading-relaxed ${t.text}`}>{issue.description}</h3>
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

                    {/* Verified-by list on card (original reporter only sees this) */}
                    {isOriginalReporter(issue) && verCount > 0 && (
                      <div className="mt-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 verify-fade-up">
                        <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">Verified by community</p>
                        <div className="flex flex-col gap-1">
                          {(issue.verifications || []).slice(0, 3).map((v, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-green-400 text-xs">✔</span>
                              <span className="text-[#9CA3AF] text-[11px] font-medium">{v.verifierName}</span>
                            </div>
                          ))}
                        </div>
                        {verCount > 3 && <p className="text-[#6B7280] text-[10px] mt-1">+{verCount - 3} more</p>}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className={`mt-5 pt-4 border-t ${t.border} flex items-center justify-between gap-2 flex-wrap`}>
                    <div className="flex items-center gap-1">
                      <span
                        title="Click to cycle status"
                        onClick={(e) => { e.stopPropagation(); cycleStatus(issue.docId || issue.id, issue.status); }}
                        className={getStatusBadgeClass(issue.status)}
                      >
                        {issue.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${t.muted} text-xs font-medium`}>{issue.date}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpvote(issue.docId || issue.id, issue.upvotes); }}
                        className={`hover:bg-opacity-80 border font-semibold px-3 py-1.5 rounded-lg text-xs transition duration-200 flex items-center gap-1.5 cursor-pointer ${t.surface2} ${t.border} ${t.text}`}
                      >
                        <span>👍</span>
                        <span>{issue.upvotes || 0}</span>
                      </button>

                      {/* Verify button — only for non-reporters who haven't verified */}
                      {canVerify && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={(e) => openCvModal(issue, e)}
                          className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer"
                        >
                          <span className="shield-pulse" style={{ animation: 'none', display: 'inline' }}>🛡</span> Verify
                        </motion.button>
                      )}
                      {hasAlreadyVerified(issue) && (
                        <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-lg">
                          ✔ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Community Verify Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {cvModalIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? 'bg-[#0A0F1E]/85' : 'bg-[#EEF2FF]/85'}`}
            onClick={closeCvModal}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`border rounded-3xl w-full max-w-lg shadow-2xl relative ${t.surface} ${t.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-5 border-b ${t.border}`}>
                <div className="flex items-center gap-2.5">
                  <span className="shield-pulse text-xl">🛡</span>
                  <div>
                    <h2 className={`text-lg font-black ${t.text}`}>Community Verification</h2>
                    <p className={`${t.muted} text-xs mt-0.5`}>Upload a fresh photo of this issue</p>
                  </div>
                </div>
                <button
                  onClick={closeCvModal}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${t.surface2} border ${t.border} ${t.muted} hover:${t.text} transition cursor-pointer`}
                >✕</button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Original photo */}
                <div>
                  <p className={`${t.muted} text-xs font-semibold uppercase tracking-wider mb-2`}>Original Report</p>
                  <div className="flex gap-3 items-start">
                    <img src={cvModalIssue.imagePreview} alt="" className={`w-24 h-20 object-cover rounded-xl border ${t.border} flex-shrink-0`} />
                    <div>
                      <span className="text-blue-400 text-xs font-bold">{cvModalIssue.category}</span>
                      <p className={`${t.text} text-sm font-medium mt-1 line-clamp-2`}>{cvModalIssue.description}</p>
                      <p className={`${t.muted} text-xs mt-1`}>📍 {cvModalIssue.location}</p>
                    </div>
                  </div>
                </div>

                {/* Upload area */}
                {!cvResult && (
                  <div>
                    <p className={`${t.muted} text-xs font-semibold uppercase tracking-wider mb-2`}>Your Verification Photo</p>
                    {!cvPhotoPreview ? (
                      <label
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed ${t.border} rounded-2xl p-8 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200`}
                        htmlFor="cv-photo-input"
                      >
                        <span className="text-4xl">📷</span>
                        <div className="text-center">
                          <p className={`${t.text} font-semibold text-sm`}>Upload fresh photo</p>
                          <p className={`${t.muted} text-xs mt-1`}>Take a new photo at the same location to verify this issue still exists</p>
                        </div>
                        <input
                          id="cv-photo-input"
                          ref={cvFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCvPhotoSelect}
                        />
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 max-h-52">
                          <img src={cvPhotoPreview} alt="Verification" className="w-full h-52 object-cover" />
                          <button
                            onClick={() => { setCvPhotoFile(null); setCvPhotoPreview(null); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80 transition cursor-pointer"
                          >✕</button>
                        </div>
                        <p className="text-emerald-400 text-xs font-semibold text-center">Photo selected ✓</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Result */}
                {cvResult && cvResult.accepted && <VerifySuccess reason={cvResult.reason} />}
                {cvResult && !cvResult.accepted && (
                  <div className="verify-fade-up bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center space-y-2">
                    <span className="text-3xl">❌</span>
                    <p className="text-red-400 font-bold text-sm">Verification Rejected</p>
                    <p className={`${t.muted} text-xs leading-relaxed`}>{cvResult.reason}</p>
                    <p className="text-[#6B7280] text-[10px]">Confidence: {cvResult.confidence}</p>
                    <button
                      onClick={() => { setCvResult(null); setCvPhotoFile(null); setCvPhotoPreview(null); }}
                      className="mt-2 text-xs text-blue-400 underline cursor-pointer hover:text-blue-300 transition"
                    >Try again with a different photo</button>
                  </div>
                )}

                {cvError && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 font-medium">{cvError}</p>
                )}
              </div>

              {/* Footer */}
              <div className={`flex justify-between items-center px-6 py-4 border-t ${t.border} ${t.surface}`}>
                <button onClick={closeCvModal} className={`font-semibold px-5 py-2 rounded-xl text-sm cursor-pointer ${t.surface2} hover:bg-opacity-80 ${t.muted} border ${t.border} transition`}>
                  {cvResult?.accepted ? "Close" : "Cancel"}
                </button>
                {!cvResult && cvPhotoPreview && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCommunityVerify}
                    disabled={cvLoading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer"
                  >
                    {cvLoading ? (
                      <>
                        <div className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                        <span>Gemini Analyzing...</span>
                      </>
                    ) : (
                      <><span>🤖</span> Verify with AI</>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail Modal (existing + community section added) ─────────────── */}
      {selectedIssue && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-fade-in ${isDark ? 'bg-[#0A0F1E]/85' : 'bg-[#EEF2FF]/85'}`}>
          <div className={`border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative animate-scale-in ${t.surface} ${t.border} ${selectedIssue.communityVerified ? 'community-verified-card' : ''}`}>

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
                {selectedIssue.communityVerified && (
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 rounded-full px-3 py-1">
                    <span className="shield-pulse text-sm">🛡</span>
                    <span className="text-amber-400 text-xs font-black">Community Verified</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setSelectedIssue(null); setVerifyError(""); setVerifySuccess(""); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${t.muted} hover:${t.text} ${t.surface2} hover:bg-opacity-85 border ${t.border}`}
              >✕</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">

              {/* Left Column */}
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
                  {[
                    { icon: "📍", label: "Location", value: selectedIssue.location },
                    { icon: "👤", label: "Reporter", value: selectedIssue.reporter || "Anonymous" },
                    { icon: "📅", label: "Reported Date", value: selectedIssue.date },
                    { icon: "👍", label: "Upvotes", value: selectedIssue.upvotes || 0 },
                  ].map(info => (
                    <div key={info.label} className={`flex items-center gap-2 text-sm ${t.muted}`}>
                      <span className="text-lg">{info.icon}</span>
                      <span className={`font-semibold ${t.text}`}>{info.label}:</span>
                      <span>{info.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-2">
                  <h4 className="text-blue-400 font-semibold text-sm flex items-center gap-1.5">
                    <span>💡</span> AI Recommended Action Plan
                  </h4>
                  <p className={`${isDark ? 'text-gray-300' : 'text-[#475569]'} text-sm leading-relaxed`}>{selectedIssue.suggested_action}</p>
                </div>

                {/* Community Verification Section — always visible in modal */}
                <div className={`rounded-2xl border p-5 ${
                  selectedIssue.communityVerified
                    ? 'bg-amber-500/8 border-amber-500/30'
                    : `${t.surface2}/40 ${t.border}`
                }`}>
                  <h4 className={`font-bold text-sm flex items-center gap-2 mb-3 ${selectedIssue.communityVerified ? 'text-amber-400' : t.text}`}>
                    <span className={selectedIssue.communityVerified ? 'shield-pulse' : ''}>🛡</span>
                    Community Verification
                    {(selectedIssue.verificationCount || 0) > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        selectedIssue.communityVerified
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {selectedIssue.verificationCount || (selectedIssue.verifications || []).length} confirmed
                      </span>
                    )}
                  </h4>

                  {(selectedIssue.verifications || []).length === 0 ? (
                    <p className={`${t.muted} text-xs`}>No community verifications yet. Be the first to verify this issue!</p>
                  ) : (
                    <div className="space-y-2.5">
                      {(selectedIssue.verifications || []).map((v, i) => (
                        <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${t.surface2}/50 border ${t.border} verify-fade-up`}
                          style={{ animationDelay: `${i * 80}ms` }}>
                          <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path className="checkmark-path" d="M1.5 5.5L4 8L8.5 2" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`${t.text} text-xs font-bold`}>{v.verifierName}</span>
                              <span className={`${t.muted} text-[10px]`}>
                                {new Date(v.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                v.confidence === 'High' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>{v.confidence}</span>
                            </div>
                            {v.reason && <p className={`${t.muted} text-[11px] mt-0.5 leading-relaxed line-clamp-2`}>{v.reason}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedIssue.communityVerified && (
                    <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <span className="shield-pulse text-base">🛡</span>
                      <p className="text-amber-400 text-xs font-bold">
                        {selectedIssue.verificationCount || (selectedIssue.verifications || []).length} Independent Citizens Confirmed — Priority escalated to Critical
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Timeline */}
              <div className="space-y-6">
                <h3 className={`font-bold text-lg tracking-tight mb-4 ${t.text}`}>Resolution Timeline</h3>
                <div className={`relative border-l-2 ${t.border} ml-4 pl-6 space-y-8`}>

                  {/* Stage 1 */}
                  <div className="relative">
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

                  {/* Stage 2 */}
                  <div className="relative">
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
                      {selectedIssue.inProgressImage ? (
                        <div className="mt-3 space-y-2">
                          <div className={`relative rounded-xl overflow-hidden border ${t.border} max-w-[240px]`}>
                            <img src={selectedIssue.inProgressImage} alt="Work started" className="w-full h-32 object-cover" />
                          </div>
                          <p className={`${t.muted} text-xs`}>Started: {selectedIssue.inProgressDate}</p>
                          {selectedIssue.inProgressReason && (
                            <p className="text-blue-400/90 text-xs italic bg-blue-500/5 p-2 rounded-lg border border-blue-500/10 max-w-[280px]">🤖 {selectedIssue.inProgressReason}</p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3">
                          {selectedIssue.status === "Pending" ? (
                            <div className="space-y-3">
                              <p className={`${t.muted} text-xs`}>Municipal work started? Upload progress/construction photos to verify.</p>
                              <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition duration-200 shadow-md shadow-blue-500/10">
                                📁 Upload Progress Photo
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProgressImageUpload(e, "inProgress")} disabled={verifyLoading} />
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

                  {/* Stage 3 */}
                  <div className="relative">
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
                      {selectedIssue.resolvedImage ? (
                        <div className="mt-3 space-y-2">
                          <div className={`relative rounded-xl overflow-hidden border ${t.border} max-w-[240px]`}>
                            <img src={selectedIssue.resolvedImage} alt="Work completed" className="w-full h-32 object-cover" />
                          </div>
                          <p className={`${t.muted} text-xs`}>Completed: {selectedIssue.resolvedDate}</p>
                          {selectedIssue.resolvedReason && (
                            <p className="text-green-400/90 text-xs italic bg-green-500/5 p-2 rounded-lg border border-green-500/10 max-w-[280px]">🤖 {selectedIssue.resolvedReason}</p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3">
                          {selectedIssue.status === "In Progress" ? (
                            <div className="space-y-3">
                              <p className={`${t.muted} text-xs`}>Municipal work completed? Upload final photo of the repaired area to resolve.</p>
                              <label className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition duration-200 shadow-md shadow-green-500/10">
                                📁 Upload Completion Photo
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProgressImageUpload(e, "resolved")} disabled={verifyLoading} />
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
            <div className={`flex justify-between items-center px-6 py-4 border-t ${t.border} ${t.surface}`}>
              {/* Verify button in modal (non-reporters only) */}
              {!isOriginalReporter(selectedIssue) && !hasAlreadyVerified(selectedIssue) && selectedIssue.status !== "Resolved" && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => { setSelectedIssue(null); openCvModal(selectedIssue, e); }}
                  className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-400 font-bold text-sm px-5 py-2 rounded-xl transition cursor-pointer"
                >
                  <span className="shield-pulse" style={{ animation: 'none', display: 'inline' }}>🛡</span> Verify This Issue
                </motion.button>
              )}
              {hasAlreadyVerified(selectedIssue) && (
                <span className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
                  ✔ You Verified This
                </span>
              )}
              <button
                onClick={() => { setSelectedIssue(null); setVerifyError(""); setVerifySuccess(""); }}
                className={`font-semibold px-5 py-2 rounded-xl transition text-sm cursor-pointer ${t.surface2} hover:bg-opacity-80 ${t.muted} hover:${t.text} border ${t.border} ml-auto`}
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
