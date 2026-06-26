import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { verifyInProgressImage, verifyResolvedImage, analyzeWorkPhoto } from "../lib/gemini";
import { sendStatusNotification, createInAppNotification } from "../lib/notifications";

export default function OfficerDashboard() {
  const { userProfile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [activeFilter, setActiveFilter] = useState("All");
  const [notes, setNotes] = useState({});
  const [estResolutionTimes, setEstResolutionTimes] = useState({});
  const [warnings, setWarnings] = useState({});
  const [verifyLoading, setVerifyLoading] = useState({});
  const [verifyError, setVerifyError] = useState({});
  const [verifySuccess, setVerifySuccess] = useState({});
  const [submitLoading, setSubmitLoading] = useState({});
  const [submitError, setSubmitError] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState({});

  // Review submission state
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDept, setReviewDept] = useState("BMC");
  const [reviewDesc, setReviewDesc] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const issuesCollection = collection(db, "issues");
    const unsubscribe = onSnapshot(
      issuesCollection,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
        }));

        // Sort: newest first
        list.sort((a, b) => b.id - a.id);
        setIssues(list);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error in officer dashboard:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter issues by officer's department
  const officerDepartment = userProfile?.department || "BMC";
  const assignedIssues = issues.filter(
    (issue) => issue.department === officerDepartment
  );

  // Statistics
  const totalAssigned = assignedIssues.length;
  const pendingCount = assignedIssues.filter((i) => i.status === "Pending").length;
  const inProgressCount = assignedIssues.filter((i) => i.status === "In Progress").length;
  const resolvedCount = assignedIssues.filter((i) => i.status === "Resolved").length;

  // Filter by tab in Analyze Reports
  const getFilteredIssues = () => {
    switch (activeFilter) {
      case "Pending":
        return issues.filter((i) => i.status === "Pending");
      case "In Progress":
        return issues.filter((i) => i.status === "In Progress");
      case "Resolved":
        return issues.filter((i) => i.status === "Resolved");
      case "Critical":
        return issues.filter((i) => i.severity === "Critical");
      default:
        return issues;
    }
  };

  const filteredIssues = getFilteredIssues();

  const handleStatusChange = async (docId, newStatus, currentPhotos = []) => {
    if (!docId) return;
    setWarnings((prev) => ({ ...prev, [docId]: "" })); // Reset warning

    if (newStatus === "In Progress" && currentPhotos.length < 1) {
      setWarnings((prev) => ({ ...prev, [docId]: "Please upload work photo proof first" }));
      return;
    }
    if (newStatus === "Resolved" && currentPhotos.length < 2) {
      setWarnings((prev) => ({ ...prev, [docId]: "Please upload work photo proof first" }));
      return;
    }

    try {
      await updateDoc(doc(db, "issues", docId), { status: newStatus });
      // Update in localStorage
      const stored = localStorage.getItem("civicpulse_issues");
      if (stored) {
        const issuesList = JSON.parse(stored);
        const index = issuesList.findIndex(
          (i) => i.docId === docId || String(i.id) === String(docId)
        );
        if (index !== -1) {
          issuesList[index].status = newStatus;
          localStorage.setItem("civicpulse_issues", JSON.stringify(issuesList));
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateEstimatedDays = async (docId) => {
    const days = estResolutionTimes[docId];
    if (days === undefined || days === "") return;
    try {
      await updateDoc(doc(db, "issues", docId), { estimatedDays: Number(days) });
      const stored = localStorage.getItem("civicpulse_issues");
      if (stored) {
        const issuesList = JSON.parse(stored);
        const index = issuesList.findIndex(
          (i) => i.docId === docId || String(i.id) === String(docId)
        );
        if (index !== -1) {
          issuesList[index].estimatedDays = Number(days);
          localStorage.setItem("civicpulse_issues", JSON.stringify(issuesList));
        }
      }
      alert("Estimated resolution time updated!");
    } catch (err) {
      console.error("Failed to update estimated resolution days:", err);
    }
  };

  const handleUploadPhoto = (docId, file, existingPhotos = [], category = "Other") => {
    if (!file) return;
    setVerifyLoading((prev) => ({ ...prev, [docId]: true }));
    setVerifyError((prev) => ({ ...prev, [docId]: "" }));
    setVerifySuccess((prev) => ({ ...prev, [docId]: "" }));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      try {
        const mimeType = dataUrl.split(";")[0].split(":")[1];
        const base64Data = dataUrl.split(",")[1];

        let result;
        if (existingPhotos.length === 0) {
          result = await verifyInProgressImage(base64Data, mimeType, category);
        } else {
          result = await verifyResolvedImage(base64Data, mimeType, category);
        }

        if (result && result.is_verified) {
          const updatedPhotos = [...existingPhotos, dataUrl];
          await updateDoc(doc(db, "issues", docId), {
            workPhotos: updatedPhotos,
          });

          setVerifySuccess((prev) => ({
            ...prev,
            [docId]: result.reason || "Gemini Approved! Photo uploaded.",
          }));

          const stored = localStorage.getItem("civicpulse_issues");
          if (stored) {
            const issuesList = JSON.parse(stored);
            const index = issuesList.findIndex(
              (i) => i.docId === docId || String(i.id) === String(docId)
            );
            if (index !== -1) {
              issuesList[index].workPhotos = updatedPhotos;
              localStorage.setItem("civicpulse_issues", JSON.stringify(issuesList));
            }
          }
        } else {
          setVerifyError((prev) => ({
            ...prev,
            [docId]: result?.reason || "AI Verification failed.",
          }));
        }
      } catch (err) {
        console.error("Failed to upload progress photo:", err);
        setVerifyError((prev) => ({
          ...prev,
          [docId]: err.message || "Failed to process image.",
        }));
      } finally {
        setVerifyLoading((prev) => ({ ...prev, [docId]: false }));
      }
    };
  };

  const handleEstimatedDaysChange = (docId, val) => {
    setEstResolutionTimes((prev) => ({ ...prev, [docId]: val }));
  };

  const handleMarkCritical = async (docId) => {
    if (!docId) return;
    try {
      await updateDoc(doc(db, "issues", docId), { severity: "Critical" });
      const stored = localStorage.getItem("civicpulse_issues");
      if (stored) {
        const issuesList = JSON.parse(stored);
        const index = issuesList.findIndex(
          (i) => i.docId === docId || String(i.id) === String(docId)
        );
        if (index !== -1) {
          issuesList[index].severity = "Critical";
          localStorage.setItem("civicpulse_issues", JSON.stringify(issuesList));
        }
      }
    } catch (err) {
      console.error("Failed to mark critical:", err);
    }
  };

  const handleNoteChange = (docId, text) => {
    setNotes((prev) => ({ ...prev, [docId]: text }));
  };

  const handlePostNote = async (docId) => {
    const noteText = notes[docId] || "";
    if (!noteText.trim()) return;

    try {
      await updateDoc(doc(db, "issues", docId), { officerNote: noteText });
      setNotes((prev) => ({ ...prev, [docId]: "" })); // Clear note box
      const stored = localStorage.getItem("civicpulse_issues");
      if (stored) {
        const issuesList = JSON.parse(stored);
        const index = issuesList.findIndex(
          (i) => i.docId === docId || String(i.id) === String(docId)
        );
        if (index !== -1) {
          issuesList[index].officerNote = noteText;
          localStorage.setItem("civicpulse_issues", JSON.stringify(issuesList));
        }
      }
    } catch (err) {
      console.error("Failed to post note:", err);
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewDesc.trim()) return;

    // Simulate review submission
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setReviewTitle("");
      setReviewDesc("");
    }, 3000);
  };

  const handleUploadWorkStarted = (issue, file) => {
    if (!file || !issue.docId) return;
    const docId = issue.docId;
    setSubmitLoading((p) => ({ ...p, [docId]: true }));
    setSubmitError((p) => ({ ...p, [docId]: "" }));
    setSubmitSuccess((p) => ({ ...p, [docId]: "" }));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      try {
        const mimeType = dataUrl.split(";")[0].split(":")[1];
        const base64Data = dataUrl.split(",")[1];
        const result = await analyzeWorkPhoto(base64Data, mimeType, issue.category, "work_started");

        if (result && result.is_valid_proof) {
          const updatedPhotos = [...(issue.workPhotos || []), dataUrl];
          await updateDoc(doc(db, "issues", docId), {
            status: "In Progress",
            workPhotos: updatedPhotos,
            workStartedNote: result.observation,
          });
          createInAppNotification(
            issue.id,
            `Your ${issue.category} issue at ${issue.location} is now In Progress!`,
            "progress"
          );
          await sendStatusNotification({
            citizenEmail: issue.userEmail,
            citizenName: issue.reporter,
            location: issue.location,
            status: "In Progress",
            officerNote: result.observation,
            category: issue.category,
          });
          setSubmitSuccess((p) => ({ ...p, [docId]: "✅ Gemini verified! Issue marked as In Progress" }));
        } else {
          setSubmitError((p) => ({
            ...p,
            [docId]: result?.observation || "❌ Gemini could not verify work proof. Please upload a clearer photo showing active work.",
          }));
        }
      } catch (err) {
        console.error("Work started upload error:", err);
        setSubmitError((p) => ({ ...p, [docId]: err.message || "Upload failed." }));
      } finally {
        setSubmitLoading((p) => ({ ...p, [docId]: false }));
      }
    };
  };

  const handleUploadWorkCompleted = (issue, file) => {
    if (!file || !issue.docId) return;
    const docId = issue.docId;
    setSubmitLoading((p) => ({ ...p, [docId]: true }));
    setSubmitError((p) => ({ ...p, [docId]: "" }));
    setSubmitSuccess((p) => ({ ...p, [docId]: "" }));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      try {
        const mimeType = dataUrl.split(";")[0].split(":")[1];
        const base64Data = dataUrl.split(",")[1];
        const result = await analyzeWorkPhoto(base64Data, mimeType, issue.category, "work_completed");

        if (result && result.is_valid_proof) {
          const updatedPhotos = [...(issue.workPhotos || []), dataUrl];
          await updateDoc(doc(db, "issues", docId), {
            status: "Resolved",
            workPhotos: updatedPhotos,
            completionNote: result.observation,
            resolvedDate: new Date().toISOString().split("T")[0],
          });
          createInAppNotification(
            issue.id,
            `Great news! Your ${issue.category} issue at ${issue.location} has been RESOLVED! 🎉`,
            "resolved"
          );
          await sendStatusNotification({
            citizenEmail: issue.userEmail,
            citizenName: issue.reporter,
            location: issue.location,
            status: "Resolved",
            officerNote: result.observation,
            category: issue.category,
          });
          setSubmitSuccess((p) => ({ ...p, [docId]: "✅ Gemini verified completion! Issue marked as Resolved 🎉" }));
        } else {
          setSubmitError((p) => ({
            ...p,
            [docId]: result?.observation || "❌ Could not verify completion. Please upload photo of the fixed location.",
          }));
        }
      } catch (err) {
        console.error("Work completed upload error:", err);
        setSubmitError((p) => ({ ...p, [docId]: err.message || "Upload failed." }));
      } finally {
        setSubmitLoading((p) => ({ ...p, [docId]: false }));
      }
    };
  };

  const getStatusBorderClass = (status) => {
    switch (status) {
      case "Pending":
        return "border-gray-500";
      case "In Progress":
        return "border-yellow-500";
      case "Resolved":
        return "border-green-500";
      default:
        return "border-[#374151]";
    }
  };

  const getSeverityBadgeClass = (sev) => {
    const base = "rounded-md px-2.5 py-1 text-[10px] font-bold border inline-block ";
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

  const tabs = [
    { id: "Dashboard", label: "Dashboard", icon: "📊" },
    { id: "analyze", label: "Analyze Reports", icon: "📋" },
    { id: "submit", label: "Submit Review", icon: "✅" }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-[#0D1117] border-r border-[#374151] pt-20 flex flex-col z-30">
        {/* App Logo */}
        <div className="text-blue-400 font-bold text-xl px-6 mb-8 mt-4">
          ⚡ CivicPulse
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 flex items-center gap-3 cursor-pointer rounded-r-xl mr-3 font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 pt-20 px-8 pb-20 min-w-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
            <span className="text-[#9CA3AF] text-sm font-medium">Loading officer control panel...</span>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD TAB */}
            {activeTab === "Dashboard" && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                      Officer Panel 🏛️
                    </h1>
                    <p className="text-[#9CA3AF] mt-1 text-sm">
                      {userProfile?.name || "Officer"} — {officerDepartment} Department
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
                    <span className="text-green-400">Live Updates</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Assigned */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-blue-500/20 transition duration-200">
                    <span className="text-2xl">📋</span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-blue-400">{totalAssigned}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">Total Assigned</div>
                    </div>
                  </div>

                  {/* Pending Action */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-red-500/20 transition duration-200">
                    <span className="text-2xl">⚠️</span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-red-400">{pendingCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">Pending Action</div>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-yellow-500/20 transition duration-200">
                    <span className="text-2xl">⚙️</span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-yellow-400">{inProgressCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">In Progress</div>
                    </div>
                  </div>

                  {/* Resolved */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-green-500/20 transition duration-200">
                    <span className="text-2xl">✅</span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-green-400">{resolvedCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">Resolved</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Shortcut Card */}
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Manage Assigned Incidents</h2>
                    <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-xl">
                      Access the full list of complaints lodged under the {officerDepartment} department. Check details, write update notes, mark priority, and update resolution statuses in real time.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("analyze")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 text-sm shadow-md shadow-blue-500/10 cursor-pointer shrink-0"
                  >
                    Analyze Reports →
                  </button>
                </div>
              </div>
            )}

            {activeTab === "analyze" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Analyze Assigned Reports</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">View, track, and update all issues assigned to {officerDepartment}</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 flex-wrap">
                  {["All", "Pending", "In Progress", "Resolved", "Critical"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`text-xs font-semibold transition duration-200 cursor-pointer ${
                        activeFilter === tab
                          ? "bg-blue-600 text-white rounded-lg px-4 py-2 shadow-md shadow-blue-500/10"
                          : "bg-[#111827] border border-[#374151] text-[#9CA3AF] hover:text-white rounded-lg px-4 py-2 hover:border-gray-500"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Issues List */}
                <div className="space-y-4">
                  {filteredIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-[#111827] border border-[#374151] rounded-2xl p-16 text-center">
                      <span className="text-5xl mb-4">🗃️</span>
                      <h3 className="text-white font-bold text-lg">No issues assigned yet</h3>
                      <p className="text-[#9CA3AF] text-sm mt-1">
                        Issues reported by citizens will appear here
                      </p>
                    </div>
                  ) : (
                    filteredIssues.map((issue) => (
                      <div
                        key={issue.docId || issue.id}
                        className="bg-[#111827] rounded-2xl border border-[#374151] p-5 mb-5 hover:border-blue-500/20 transition duration-200"
                      >
                        {/* TOP ROW: image (w-24 h-24) + details side by side */}
                        <div className="flex gap-4">
                          <img
                            src={issue.imagePreview}
                            alt=""
                            className="w-24 h-24 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                  {issue.category}
                                </span>
                                <span className={getSeverityBadgeClass(issue.severity)}>
                                  {issue.severity}
                                </span>
                              </div>
                              {/* Mark Critical button: smaller, right aligned */}
                              {issue.severity !== "Critical" && (
                                <button
                                  onClick={() => handleMarkCritical(issue.docId)}
                                  className="border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
                                >
                                  🚨 Mark Critical
                                </button>
                              )}
                            </div>
                            <p className="text-white text-sm font-medium leading-relaxed">{issue.description}</p>
                            <div className="flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                              <span>📍 {issue.location}</span>
                              <span className="text-[#6B7280]">👤 Reporter: {issue.userEmail || "Anonymous"}</span>
                              <span className="text-[#6B7280]">📅 {issue.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* 2 column grid for controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-[#374151]/30">
                          {/* LEFT col: Status dropdown + Estimated days */}
                          <div className="space-y-4">
                            <div>
                              <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">Status</label>
                              <select
                                value={issue.status}
                                onChange={(e) => handleStatusChange(issue.docId, e.target.value, issue.workPhotos || [])}
                                className={`bg-[#1F2937] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition cursor-pointer w-full ${getStatusBorderClass(
                                  issue.status
                                )}`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                              {warnings[issue.docId] && (
                                <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ {warnings[issue.docId]}</p>
                              )}
                            </div>

                            <div>
                              <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">⏱️ Set Estimated Resolution Time</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="e.g. 7"
                                  value={estResolutionTimes[issue.docId] !== undefined ? estResolutionTimes[issue.docId] : (issue.estimatedDays || "")}
                                  onChange={(e) => handleEstimatedDaysChange(issue.docId, e.target.value)}
                                  className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-2 text-white w-28 text-sm focus:border-blue-500 focus:outline-none transition"
                                />
                                <span className="text-[#9CA3AF] text-xs">days</span>
                                <button
                                  onClick={() => handleUpdateEstimatedDays(issue.docId)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer h-[36px] flex items-center justify-center shrink-0"
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT col: Officer note textarea + Post Update button */}
                          <div className="flex flex-col justify-between">
                            <div>
                              <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">📋 Department Updates</label>
                              {issue.officerNote && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-blue-300 text-xs mb-2 leading-relaxed font-medium">
                                  {issue.officerNote}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <textarea
                                placeholder="Add update note for citizen..."
                                value={notes[issue.docId] || ""}
                                onChange={(e) => handleNoteChange(issue.docId, e.target.value)}
                                rows={2}
                                className="bg-[#1F2937] border border-[#374151] rounded-xl px-3 py-2 text-white text-sm w-full focus:border-blue-500 focus:outline-none transition resize-none leading-relaxed"
                              />
                              <button
                                onClick={() => handlePostNote(issue.docId)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer w-full h-[36px] flex items-center justify-center"
                              >
                                Post Update
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* WORK PHOTO UPLOAD: full width below, smaller dashed area p-3 */}
                        <div className="mt-4 pt-4 border-t border-[#374151]/30">
                          <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">📸 Upload Work Progress Photo</label>
                          
                          {/* Hidden File Input */}
                          <input
                            type="file"
                            id={`file-upload-${issue.docId}`}
                            accept="image/*"
                            onChange={(e) => handleUploadPhoto(issue.docId, e.target.files[0], issue.workPhotos || [], issue.category)}
                            className="hidden"
                          />

                          {/* Custom Upload Area: smaller dashed area p-3 */}
                          <div
                            onClick={() => !verifyLoading[issue.docId] && document.getElementById(`file-upload-${issue.docId}`).click()}
                            className={`border-dashed border border-[#374151] hover:border-blue-500/50 rounded-xl p-3 text-center bg-[#1F2937]/30 transition duration-200 ${
                              verifyLoading[issue.docId] ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                            }`}
                          >
                            <span className="text-[#9CA3AF] text-xs">
                              {verifyLoading[issue.docId] ? "Verifying..." : "Click to upload work photo"}
                            </span>
                          </div>

                          {/* Gemini Verification States */}
                          {verifyLoading[issue.docId] && (
                            <div className="text-blue-400 text-xs font-semibold animate-pulse mt-2 text-center">
                              ✨ Gemini AI verifying photo...
                            </div>
                          )}
                          {verifyError[issue.docId] && (
                            <div className="text-red-400 text-xs font-semibold mt-2 text-center">
                              ❌ Gemini Refused: {verifyError[issue.docId]}
                            </div>
                          )}
                          {verifySuccess[issue.docId] && (
                            <div className="text-green-400 text-xs font-semibold mt-2 text-center">
                              ✅ Gemini Approved: {verifySuccess[issue.docId]}
                            </div>
                          )}

                          {/* Thumbnail Gallery: w-16 h-16 */}
                          {issue.workPhotos && issue.workPhotos.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {issue.workPhotos.map((photo, idx) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt=""
                                  className="w-16 h-16 object-cover rounded-lg border border-[#374151] bg-gray-900"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. SUBMIT REVIEW TAB */}
            {activeTab === "submit" && (
              <div className="max-w-4xl mx-auto space-y-10">
                <div>
                  <h1 className="text-2xl font-bold text-white">Submit Work Review</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">Upload proof photos to update issue progress — verified by Gemini AI</p>
                </div>

                {/* ====== SECTION 1: PENDING ISSUES ====== */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-white">⏳ Pending Issues</h2>
                    <span className="bg-gray-500/20 text-gray-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      {issues.filter(i => i.status === "Pending").length}
                    </span>
                  </div>
                  {issues.filter(i => i.status === "Pending").length === 0 ? (
                    <div className="bg-[#111827] border border-[#374151] rounded-2xl p-8 text-center text-[#9CA3AF] text-sm">
                      No pending issues
                    </div>
                  ) : (
                    issues.filter(i => i.status === "Pending").map(issue => (
                      <div key={issue.docId} className="bg-[#111827] rounded-2xl border border-[#374151] p-5 mb-4">
                        <div className="flex gap-4">
                          <img src={issue.imagePreview} alt="" className="w-24 h-24 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">{issue.category}</span>
                              <span className={getSeverityBadgeClass(issue.severity)}>{issue.severity}</span>
                              <span className="bg-gray-500/10 text-gray-400 text-[10px] px-2 py-0.5 rounded-md border border-gray-500/20 font-bold uppercase">Pending</span>
                            </div>
                            <p className="text-white text-sm mt-1 leading-relaxed">{issue.description}</p>
                            <p className="text-xs text-[#9CA3AF] mt-1">📍 {issue.location}</p>
                            <p className="text-xs text-[#6B7280] mt-0.5">👤 {issue.userEmail || "Anonymous"}</p>
                          </div>
                        </div>

                        {/* UPLOAD WORK STARTED */}
                        <div className="mt-4 pt-4 border-t border-[#374151]/30">
                          <p className="text-sm text-[#9CA3AF] mb-2">📸 Upload Work Started Photo</p>
                          <input
                            type="file"
                            id={`pending-upload-${issue.docId}`}
                            accept="image/*"
                            onChange={e => handleUploadWorkStarted(issue, e.target.files[0])}
                            className="hidden"
                          />
                          <div
                            onClick={() => !submitLoading[issue.docId] && document.getElementById(`pending-upload-${issue.docId}`).click()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center transition duration-200 ${submitLoading[issue.docId] ? "border-blue-500/50 cursor-not-allowed opacity-60" : "border-[#374151] hover:border-blue-500 cursor-pointer"}`}
                          >
                            <p className="text-xs text-[#9CA3AF]">
                              {submitLoading[issue.docId] ? "🤖 Gemini is verifying work proof..." : "Upload photo showing work has begun"}
                            </p>
                          </div>
                          {submitLoading[issue.docId] && (
                            <p className="text-blue-400 text-xs font-semibold animate-pulse mt-2">🤖 Gemini is verifying work proof...</p>
                          )}
                          {submitSuccess[issue.docId] && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-2 text-green-400 text-xs font-semibold">
                              {submitSuccess[issue.docId]}
                            </div>
                          )}
                          {submitError[issue.docId] && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2 text-red-400 text-xs font-semibold">
                              ❌ {submitError[issue.docId]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ====== SECTION 2: IN PROGRESS ISSUES ====== */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-yellow-400">🔄 In Progress</h2>
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      {issues.filter(i => i.status === "In Progress").length}
                    </span>
                  </div>
                  {issues.filter(i => i.status === "In Progress").length === 0 ? (
                    <div className="bg-[#111827] border border-[#374151] rounded-2xl p-8 text-center text-[#9CA3AF] text-sm">
                      No in-progress issues
                    </div>
                  ) : (
                    issues.filter(i => i.status === "In Progress").map(issue => (
                      <div key={issue.docId} className="bg-[#111827] rounded-2xl border border-yellow-500/20 p-5 mb-4">
                        <div className="flex gap-4">
                          <img src={issue.imagePreview} alt="" className="w-24 h-24 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">{issue.category}</span>
                              <span className="bg-yellow-500/10 text-yellow-400 text-[10px] px-2 py-0.5 rounded-md border border-yellow-500/20 font-bold uppercase">In Progress</span>
                            </div>
                            <p className="text-white text-sm mt-1 leading-relaxed">{issue.description}</p>
                            <p className="text-xs text-[#9CA3AF] mt-1">📍 {issue.location}</p>
                          </div>
                        </div>

                        {/* SHOW WORK STARTED PHOTO & NOTE */}
                        {issue.workPhotos && issue.workPhotos.length > 0 && (
                          <div className="mt-4 flex items-start gap-3">
                            <img src={issue.workPhotos[0]} alt="Work started" className="w-20 h-20 rounded-lg object-cover border border-yellow-500/30 shrink-0" />
                            {issue.workStartedNote && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-blue-300 text-xs leading-relaxed flex-1">
                                🤖 Gemini: {issue.workStartedNote}
                              </div>
                            )}
                          </div>
                        )}

                        {/* COMPLETION UPLOAD */}
                        <div className="mt-4 pt-4 border-t border-[#374151]/30">
                          <p className="text-sm text-[#9CA3AF] mb-2">📸 Upload Completion Photo (same location)</p>
                          <input
                            type="file"
                            id={`inprogress-upload-${issue.docId}`}
                            accept="image/*"
                            onChange={e => handleUploadWorkCompleted(issue, e.target.files[0])}
                            className="hidden"
                          />
                          <div
                            onClick={() => !submitLoading[issue.docId] && document.getElementById(`inprogress-upload-${issue.docId}`).click()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center transition duration-200 ${submitLoading[issue.docId] ? "border-blue-500/50 cursor-not-allowed opacity-60" : "border-[#374151] hover:border-green-500 cursor-pointer"}`}
                          >
                            <p className="text-xs text-[#9CA3AF]">
                              {submitLoading[issue.docId] ? "🤖 Gemini is verifying completion..." : "Upload a photo showing the issue is fully resolved"}
                            </p>
                          </div>
                          {submitLoading[issue.docId] && (
                            <p className="text-blue-400 text-xs font-semibold animate-pulse mt-2">🤖 Gemini is verifying completion...</p>
                          )}
                          {submitSuccess[issue.docId] && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-2 text-green-400 text-xs font-semibold">
                              {submitSuccess[issue.docId]}
                            </div>
                          )}
                          {submitError[issue.docId] && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2 text-red-400 text-xs font-semibold">
                              ❌ {submitError[issue.docId]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ====== SECTION 3: RESOLVED ISSUES ====== */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-green-400">✅ Resolved Issues</h2>
                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      {issues.filter(i => i.status === "Resolved").length}
                    </span>
                  </div>
                  {issues.filter(i => i.status === "Resolved").length === 0 ? (
                    <div className="bg-[#111827] border border-[#374151] rounded-2xl p-8 text-center text-[#9CA3AF] text-sm">
                      No resolved issues yet
                    </div>
                  ) : (
                    issues.filter(i => i.status === "Resolved").map(issue => (
                      <div key={issue.docId} className="bg-green-500/5 rounded-2xl border border-green-500/20 p-5 mb-4">
                        <div className="flex gap-4">
                          <img src={issue.imagePreview} alt="" className="w-20 h-20 object-cover rounded-xl shrink-0 border border-green-500/20 bg-gray-900" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">{issue.category}</span>
                              <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-md border border-green-500/20 font-bold uppercase">Resolved</span>
                            </div>
                            <p className="text-white text-sm mt-1">{issue.description}</p>
                            <p className="text-xs text-[#9CA3AF] mt-1">📍 {issue.location}</p>
                            {issue.resolvedDate && (
                              <p className="text-green-400 text-sm mt-2 font-semibold">✅ Resolved on {issue.resolvedDate}</p>
                            )}
                          </div>
                        </div>

                        {/* BEFORE / AFTER PHOTOS */}
                        {issue.workPhotos && issue.workPhotos.length >= 2 && (
                          <div className="mt-4 pt-4 border-t border-green-500/20 flex gap-4">
                            <div className="flex-1">
                              <p className="text-[#9CA3AF] text-xs font-semibold mb-1">Work Started</p>
                              <img src={issue.workPhotos[0]} alt="Work started" className="w-full h-32 object-cover rounded-lg border border-yellow-500/20" />
                              {issue.workStartedNote && (
                                <p className="text-blue-300 text-xs mt-1 italic">🤖 {issue.workStartedNote}</p>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-[#9CA3AF] text-xs font-semibold mb-1">Completed</p>
                              <img src={issue.workPhotos[1]} alt="Completed" className="w-full h-32 object-cover rounded-lg border border-green-500/20" />
                              {issue.completionNote && (
                                <p className="text-green-300 text-xs mt-1 italic">🤖 {issue.completionNote}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
