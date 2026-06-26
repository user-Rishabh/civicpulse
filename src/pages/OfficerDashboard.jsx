import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function OfficerDashboard() {
  const { userProfile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [activeFilter, setActiveFilter] = useState("All");
  const [notes, setNotes] = useState({});
  const [estResolutionTimes, setEstResolutionTimes] = useState({});
  const [warnings, setWarnings] = useState({});

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

  const handleUploadPhoto = (docId, file, existingPhotos = []) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const updatedPhotos = [...existingPhotos, base64Data];
        await updateDoc(doc(db, "issues", docId), {
          workPhotos: updatedPhotos,
        });
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
      } catch (err) {
        console.error("Failed to upload progress photo:", err);
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
    { id: "Submit Review", label: "Submit Review", icon: "✅" }
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

            {/* 2. ANALYZE REPORTS TAB */}
            {activeTab === "analyze" && (
              <div className="space-y-6">
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
                        {/* TOP ROW */}
                        <div className="flex gap-4">
                          <img
                            src={issue.imagePreview}
                            alt=""
                            className="w-28 h-28 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                {issue.category}
                              </span>
                              <span className={getSeverityBadgeClass(issue.severity)}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-white text-sm mt-1">{issue.description}</p>
                            <div className="text-xs text-[#9CA3AF]">📍 {issue.location}</div>
                            <div className="text-xs text-[#6B7280]">👤 Reporter: {issue.userEmail || "Anonymous"}</div>
                            <div className="text-xs text-[#6B7280]">📅 Reported: {issue.date}</div>
                          </div>
                        </div>

                        {/* STATUS DROPDOWN */}
                        <div className="mt-3">
                          <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">Status</label>
                          <select
                            value={issue.status}
                            onChange={(e) => handleStatusChange(issue.docId, e.target.value, issue.workPhotos || [])}
                            className={`bg-[#1F2937] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition cursor-pointer w-full md:w-48 ${getStatusBorderClass(
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

                        {/* ESTIMATED TIME INPUT */}
                        <div className="mt-3">
                          <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">⏱️ Set Estimated Resolution Time</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="e.g. 7"
                              value={estResolutionTimes[issue.docId] !== undefined ? estResolutionTimes[issue.docId] : (issue.estimatedDays || "")}
                              onChange={(e) => handleEstimatedDaysChange(issue.docId, e.target.value)}
                              className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-2 text-white w-32 text-sm focus:border-blue-500 focus:outline-none transition"
                            />
                            <span className="text-[#9CA3AF] text-sm">days</span>
                            <button
                              onClick={() => handleUpdateEstimatedDays(issue.docId)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer h-[38px] flex items-center justify-center"
                            >
                              Update
                            </button>
                          </div>
                        </div>

                        {/* OFFICER NOTE */}
                        <div className="mt-3">
                          <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">📋 Department Updates</label>
                          {issue.officerNote && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-blue-300 text-xs mb-2 leading-relaxed font-medium">
                              {issue.officerNote}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <textarea
                              placeholder="Add update note for citizen..."
                              value={notes[issue.docId] || ""}
                              onChange={(e) => handleNoteChange(issue.docId, e.target.value)}
                              rows={2}
                              className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-2 text-white text-sm w-full focus:border-blue-500 focus:outline-none transition resize-none leading-relaxed"
                            />
                            <button
                              onClick={() => handlePostNote(issue.docId)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition duration-200 shrink-0 cursor-pointer w-full sm:w-auto h-[38px] flex items-center justify-center"
                            >
                              Post Update
                            </button>
                          </div>
                        </div>

                        {/* WORK PHOTO UPLOAD */}
                        <div className="mt-3">
                          <label className="text-[#9CA3AF] text-xs font-semibold block mb-1">📸 Upload Work Progress Photo</label>
                          
                          {/* Hidden File Input */}
                          <input
                            type="file"
                            id={`file-upload-${issue.docId}`}
                            accept="image/*"
                            onChange={(e) => handleUploadPhoto(issue.docId, e.target.files[0], issue.workPhotos || [])}
                            className="hidden"
                          />

                          {/* Custom Upload Area */}
                          <div
                            onClick={() => document.getElementById(`file-upload-${issue.docId}`).click()}
                            className="border-dashed border border-[#374151] hover:border-blue-500/50 rounded-xl p-4 text-center cursor-pointer bg-[#1F2937]/30 transition duration-200"
                          >
                            <span className="text-[#9CA3AF] text-sm">Click to upload work photo</span>
                          </div>

                          {/* Thumbnail Gallery */}
                          {issue.workPhotos && issue.workPhotos.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {issue.workPhotos.map((photo, idx) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt=""
                                  className="w-20 h-20 object-cover rounded-lg border border-[#374151] bg-gray-900"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* PRIORITY FLAG */}
                        {issue.severity !== "Critical" && (
                          <div className="mt-3 pt-1">
                            <button
                              onClick={() => handleMarkCritical(issue.docId)}
                              className="border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg px-4 py-2 text-sm font-semibold transition cursor-pointer"
                            >
                              🚨 Mark as Critical Priority
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. SUBMIT REVIEW TAB */}
            {activeTab === "Submit Review" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Submit Review</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">Submit audit reports or review notes for higher municipal authorities</p>
                </div>

                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-8 shadow-2xl">
                  {reviewSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl p-4 mb-6 font-medium text-center">
                      ✅ Review submitted successfully!
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    <div>
                      <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                        Review Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="e.g. Ward 4 Pothole Repair Audit"
                        className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                        Department
                      </label>
                      <select
                        value={reviewDept}
                        onChange={(e) => setReviewDept(e.target.value)}
                        className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm cursor-pointer"
                      >
                        <option value="BMC">BMC (Brihanmumbai Municipal Corporation)</option>
                        <option value="MSEDCL">MSEDCL (Electricity Board)</option>
                        <option value="NMMC">NMMC (Navi Mumbai Municipal Corp.)</option>
                        <option value="PWD">PWD (Public Works Department)</option>
                        <option value="Traffic Police">Traffic Police</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                        Review Details / Notes
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={reviewDesc}
                        onChange={(e) => setReviewDesc(e.target.value)}
                        placeholder="Write detailed assessment reports or audit logs here..."
                        className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition duration-200 text-sm shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
