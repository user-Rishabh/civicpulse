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
  const [activeTab, setActiveTab] = useState("Dashboard"); // Defaults to Dashboard
  const [subTab, setSubTab] = useState("Pending"); // Defaults to Pending
  const [submitLoading, setSubmitLoading] = useState({});
  const [submitError, setSubmitError] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState({});

  // Expandable Section & Planning States
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [estDays, setEstDays] = useState("");
  const [resolutionPlan, setResolutionPlan] = useState("");
  const [cannotResolveReason, setCannotResolveReason] = useState("Budget Constraints");
  const [cannotResolveDetails, setCannotResolveDetails] = useState("");
  const [toastMsg, setToastMsg] = useState("");

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

  const officerDepartment = userProfile?.department || "BMC";

  // Filter issues by officer's department
  const assignedIssues = issues.filter(
    (issue) => issue.department === officerDepartment
  );

  const totalAssigned = assignedIssues.length;
  const pendingCount = assignedIssues.filter((i) => i.status === "Pending").length;
  const inProgressCount = assignedIssues.filter((i) => i.status === "In Progress").length;
  const resolvedCount = assignedIssues.filter((i) => i.status === "Resolved").length;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleToggleExpand = (issueId) => {
    if (expandedIssueId === issueId) {
      setExpandedIssueId(null);
    } else {
      setExpandedIssueId(issueId);
      setEstDays("");
      setResolutionPlan("");
      setCannotResolveReason("Budget Constraints");
      setCannotResolveDetails("");
    }
  };

  const handleConfirmResolution = async (issue) => {
    if (!estDays || !resolutionPlan.trim()) {
      alert("Please fill in both estimated days and resolution plan.");
      return;
    }
    const docId = issue.docId;
    const estimatedDays = estDays;
    try {
      await updateDoc(doc(db, "issues", docId), {
        estimatedDays: Number(estimatedDays),
        resolutionPlan: resolutionPlan,
      });

      // Notification
      createInAppNotification(
        issue.id,
        `Officer has set ${estimatedDays} days for resolution of your ${issue.category} issue`,
        "progress"
      );

      await sendStatusNotification({
        citizenEmail: issue.userEmail,
        citizenName: issue.reporterName || 'Citizen',
        location: issue.location,
        status: 'Resolution Planned',
        officerNote: `Officer has reviewed your ${issue.category} issue. Estimated resolution time: ${estimatedDays} days. Plan: ${resolutionPlan}`,
        category: issue.category
      });

      showToast("Citizen notified!");
      setExpandedIssueId(null); // Collapse section
    } catch (e) {
      console.error("Failed to set resolution:", e);
      alert("Error: " + e.message);
    }
  };

  const handleCannotResolve = async (issue) => {
    if (!cannotResolveDetails.trim()) {
      alert("Please fill in the additional details.");
      return;
    }
    const docId = issue.docId;
    const selectedReason = cannotResolveReason;
    try {
      await updateDoc(doc(db, "issues", docId), {
        cannotResolveReason: selectedReason,
        cannotResolveDetails: cannotResolveDetails,
      });

      // Notification
      createInAppNotification(
        issue.id,
        `Update on your ${issue.category} issue: ${selectedReason}`,
        "delayed"
      );

      await sendStatusNotification({
        citizenEmail: issue.userEmail,
        citizenName: issue.reporterName || 'Citizen',
        location: issue.location,
        status: 'Delayed',
        officerNote: `Unfortunately your ${issue.category} issue cannot be resolved right now. Reason: ${selectedReason}. Details: ${cannotResolveDetails}`,
        category: issue.category
      });

      showToast("Citizen notified!");
      setExpandedIssueId(null); // Collapse section
    } catch (e) {
      console.error("Failed to submit cannot resolve status:", e);
      alert("Error: " + e.message);
    }
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
        const workAnalysis = await analyzeWorkPhoto(base64Data, mimeType, issue.category, "work_started");

        if (workAnalysis && workAnalysis.is_valid_proof) {
          const updatedPhotos = [dataUrl];
          await updateDoc(doc(db, "issues", docId), {
            status: "In Progress",
            workPhotos: updatedPhotos,
            workStartedNote: workAnalysis.observation,
          });
          createInAppNotification(
            issue.id,
            `Your ${issue.category} issue at ${issue.location} is now In Progress!`,
            "progress"
          );
          await sendStatusNotification({
            citizenEmail: issue.userEmail,
            citizenName: issue.reporterName || 'Citizen',
            location: issue.location,
            status: 'In Progress',
            officerNote: `Work has begun on your ${issue.category} issue. Gemini verified: ${workAnalysis.observation}`,
            category: issue.category
          });
          setSubmitSuccess((p) => ({ ...p, [docId]: "Gemini Verified! Issue moved to In Progress" }));

          // Auto move card to In Progress subtab after 2 seconds
          setTimeout(() => {
            setSubTab("In Progress");
            setSubmitSuccess((p) => ({ ...p, [docId]: "" }));
          }, 2000);
        } else {
          setSubmitError((p) => ({
            ...p,
            [docId]: workAnalysis?.observation || "Gemini could not verify. Please upload clearer work photo.",
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
        const workAnalysis = await analyzeWorkPhoto(base64Data, mimeType, issue.category, "work_completed");

        if (workAnalysis && workAnalysis.is_valid_proof) {
          const updatedPhotos = [issue.workPhotos?.[0] || "", dataUrl];
          await updateDoc(doc(db, "issues", docId), {
            status: "Resolved",
            workPhotos: updatedPhotos,
            completionNote: workAnalysis.observation,
            resolvedDate: new Date().toISOString().split("T")[0],
          });
          createInAppNotification(
            issue.id,
            `Great news! Your ${issue.category} issue at ${issue.location} has been RESOLVED!`,
            "resolved"
          );
          await sendStatusNotification({
            citizenEmail: issue.userEmail,
            citizenName: issue.reporterName || 'Citizen', 
            location: issue.location,
            status: 'Resolved',
            officerNote: `Your ${issue.category} issue has been fully resolved! Gemini verified: ${workAnalysis.observation}`,
            category: issue.category
          });
          setSubmitSuccess((p) => ({ ...p, [docId]: "Gemini Verified Completion! Issue marked as Resolved" }));

          // Auto move card to Resolved subtab after 2 seconds
          setTimeout(() => {
            setSubTab("Resolved");
            setSubmitSuccess((p) => ({ ...p, [docId]: "" }));
          }, 2000);
        } else {
          setSubmitError((p) => ({
            ...p,
            [docId]: workAnalysis?.observation || "Gemini could not verify completion. Please upload photo showing the fixed location.",
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
    { id: "Dashboard", label: "Dashboard" },
    { id: "analyze", label: "Analyze Reports" },
    { id: "submit", label: "Submit Review" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] flex relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 bg-green-600 border border-green-500 text-white px-5 py-3 rounded-xl shadow-2xl z-50 text-sm font-semibold animate-pulse">
          {toastMsg}
        </div>
      )}

      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-[#0D1117] border-r border-[#374151] pt-20 flex flex-col z-30">
        {/* App Logo */}
        <div className="text-blue-400 font-bold text-xl px-6 mb-8 mt-4">
          CivicPulse
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
              <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Officer Control Panel
                  </h1>
                  <p className="text-[#9CA3AF] mt-1 text-sm">
                    Welcome back, {userProfile?.name || "Officer"} - {officerDepartment} Department
                  </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Assigned */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-blue-500/20 transition duration-200">
                    <span className="text-2xl"></span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-blue-400">{totalAssigned}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">Total Assigned</div>
                    </div>
                  </div>

                  {/* Pending Action */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-red-500/20 transition duration-200">
                    <span className="text-2xl"></span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-red-400">{pendingCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">Pending Action</div>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-yellow-500/20 transition duration-200">
                    <span className="text-2xl"></span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-yellow-400">{inProgressCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">In Progress</div>
                    </div>
                  </div>

                  {/* Resolved */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-green-500/20 transition duration-200">
                    <span className="text-2xl"></span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-green-400">{resolvedCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">Resolved</div>
                    </div>
                  </div>
                </div>

                {/* Shortcut Card */}
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Manage Assigned Incidents</h2>
                    <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-xl">
                      Access the full list of complaints lodged under the {officerDepartment} department. Check details, write update notes, and manage resolutions.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("analyze")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 text-sm shadow-md shadow-blue-500/10 cursor-pointer shrink-0"
                  >
                    Analyze Reports &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* 2. ANALYZE REPORTS TAB */}
            {activeTab === "analyze" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Analyze Reports</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">
                    View all reported civic issues assigned to {officerDepartment}
                  </p>
                </div>

                <div className="space-y-4">
                  {assignedIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-[#111827] border border-[#374151] rounded-2xl p-16 text-center">
                      <h3 className="text-white font-bold text-lg">No issues assigned yet</h3>
                      <p className="text-[#9CA3AF] text-sm mt-1">
                        Issues reported for your department will appear here.
                      </p>
                    </div>
                  ) : (
                    assignedIssues.map((issue) => (
                      <div
                        key={issue.docId || issue.id}
                        className="bg-[#111827] rounded-2xl border border-[#374151] p-5 mb-4 max-w-4xl mx-auto flex flex-col gap-4"
                      >
                        {/* TOP Section */}
                        <div className="flex gap-4">
                          <img
                            src={issue.imagePreview}
                            alt=""
                            className="w-28 h-28 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                {issue.category}
                              </span>
                              <span className={getSeverityBadgeClass(issue.severity)}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-white text-sm font-medium leading-relaxed">
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                              <span>Location: {issue.location}</span>
                              <span className="text-[#6B7280]">
                                Reporter: {issue.userEmail || "Anonymous"}
                              </span>
                              <span className="text-[#6B7280]">Date: {issue.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI SUMMARY BOX */}
                        <div className="bg-[#1F2937] rounded-xl p-4 mt-3 border border-[#374151]">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider">
                                Department
                              </div>
                              <div className="text-blue-400 text-sm font-semibold mt-1">
                                {issue.department || "BMC"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider">
                                Est. Resolution
                              </div>
                              <div className="text-amber-400 text-sm font-semibold mt-1">
                                {issue.estimatedDays !== undefined && issue.estimatedDays !== null
                                  ? `${issue.estimatedDays} Days`
                                  : "Not Set"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider">
                                AI Suggested Action
                              </div>
                              <div className="text-[#9CA3AF] text-xs mt-1 leading-relaxed">
                                {issue.suggested_action || "None"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Row */}
                        <div className="flex justify-between items-center mt-2">
                          {/* Current Status read-only badge */}
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                              issue.status === "Resolved"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : issue.status === "In Progress"
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                            }`}
                          >
                            {issue.status}
                          </span>

                          {/* Action Button or Conditional Badges */}
                          <div>
                            {issue.estimatedDays !== undefined && issue.estimatedDays !== null ? (
                              <span className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider">
                                Resolution set: {issue.estimatedDays} days
                              </span>
                            ) : issue.cannotResolveReason ? (
                              <span className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider">
                                Delayed: {issue.cannotResolveReason}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleExpand(issue.docId)}
                                className="border border-blue-500/50 text-blue-400 rounded-lg px-4 py-2 text-sm hover:bg-blue-500/10 transition cursor-pointer font-semibold"
                              >
                                {expandedIssueId === issue.docId ? "Cancel" : "Set Estimated Resolution"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Click-to-Expand Form */}
                        {expandedIssueId === issue.docId && (
                          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] mt-3 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Option 1: Set Resolution Timeline */}
                              <div className="bg-[#111827] border border-[#374151] hover:border-green-500/60 rounded-xl p-4 transition duration-200 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <h4 className="text-white font-semibold text-sm">Set Resolution Timeline</h4>
                                  <p className="text-[#9CA3AF] text-xs">I can resolve this issue</p>
                                  <div>
                                    <label className="text-[#9CA3AF] text-[10px] uppercase font-bold block mb-1">
                                      Estimated days to resolve
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={estDays}
                                      onChange={(e) => setEstDays(e.target.value)}
                                      className="bg-[#0A0F1E] border border-[#374151] rounded-lg px-3 py-2 text-white w-24 text-sm focus:border-green-500 focus:outline-none"
                                      placeholder="e.g. 5"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[#9CA3AF] text-[10px] uppercase font-bold block mb-1">
                                      Resolution plan
                                    </label>
                                    <textarea
                                      value={resolutionPlan}
                                      onChange={(e) => setResolutionPlan(e.target.value)}
                                      placeholder="Describe how you plan to resolve this..."
                                      className="bg-[#0A0F1E] border border-[#374151] rounded-lg px-3 py-2 text-white w-full text-sm resize-none focus:border-green-500 focus:outline-none"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleConfirmResolution(issue)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg px-4 py-2 mt-3 cursor-pointer transition w-full"
                                >
                                  Confirm & Notify Citizen
                                </button>
                              </div>

                              {/* Option 2: Cannot Resolve Now */}
                              <div className="bg-[#111827] border border-[#374151] hover:border-red-500/60 rounded-xl p-4 transition duration-200 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <h4 className="text-white font-semibold text-sm">Cannot Resolve Now</h4>
                                  <p className="text-[#9CA3AF] text-xs">I cannot resolve this right now</p>
                                  <div>
                                    <label className="text-[#9CA3AF] text-[10px] uppercase font-bold block mb-1">
                                      Reason
                                    </label>
                                    <select
                                      value={cannotResolveReason}
                                      onChange={(e) => setCannotResolveReason(e.target.value)}
                                      className="bg-[#0A0F1E] border border-[#374151] rounded-lg px-3 py-2 text-white w-full text-sm focus:border-red-500 focus:outline-none cursor-pointer"
                                    >
                                      <option value="Budget Constraints">Budget Constraints</option>
                                      <option value="Requires Higher Authority Approval">
                                        Requires Higher Authority Approval
                                      </option>
                                      <option value="Waiting for Materials">Waiting for Materials</option>
                                      <option value="Jurisdiction Issue">Jurisdiction Issue</option>
                                      <option value="Natural Disaster/Emergency">
                                        Natural Disaster/Emergency
                                      </option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[#9CA3AF] text-[10px] uppercase font-bold block mb-1">
                                      Additional details
                                    </label>
                                    <textarea
                                      value={cannotResolveDetails}
                                      onChange={(e) => setCannotResolveDetails(e.target.value)}
                                      placeholder="Provide reasons, dependencies or delay details..."
                                      className="bg-[#0A0F1E] border border-[#374151] rounded-lg px-3 py-2 text-white w-full text-sm resize-none focus:border-red-500 focus:outline-none"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCannotResolve(issue)}
                                  className="bg-red-600/80 hover:bg-red-700 text-white text-xs font-semibold rounded-lg px-4 py-2 mt-3 cursor-pointer transition w-full"
                                >
                                  Submit & Notify Citizen
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. SUBMIT REVIEW TAB */}
            {activeTab === "submit" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Submit Review</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">
                    Review work progress and verify issue resolution for {officerDepartment}
                  </p>
                </div>

                {/* Sub-tabs header */}
                <div className="flex border-b border-[#374151] gap-6">
                  {["Pending", "In Progress", "Resolved"].map((tabName) => {
                    const isActive = subTab === tabName;
                    return (
                      <button
                        key={tabName}
                        onClick={() => setSubTab(tabName)}
                        className={`py-3 px-1 text-sm font-semibold cursor-pointer border-b-2 transition duration-200 ${
                          isActive
                            ? "border-blue-500 text-white"
                            : "border-transparent text-[#9CA3AF] hover:text-white"
                        }`}
                      >
                        {tabName}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tab content */}
                <div className="space-y-6 mt-4">
                  {subTab === "Pending" && (
                    <div className="space-y-4">
                      {assignedIssues.filter((i) => i.status === "Pending").length === 0 ? (
                        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-16 text-center text-[#9CA3AF]">
                          No pending issues.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "Pending")
                          .map((issue) => (
                            <div
                              key={issue.docId || issue.id}
                              className="bg-[#111827] rounded-2xl border border-[#374151] p-5 mb-4 max-w-4xl mx-auto"
                            >
                              {/* TOP details */}
                              <div className="flex gap-4">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className="w-28 h-28 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900"
                                />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                      {issue.category}
                                    </span>
                                    <span className={getSeverityBadgeClass(issue.severity)}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className="text-white text-sm font-medium leading-relaxed">
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                                    <span>Location: {issue.location}</span>
                                    <span className="text-[#6B7280]">
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                    <span className="text-[#6B7280]">Date: {issue.date}</span>
                                  </div>
                                </div>
                              </div>

                              {/* STEP 1 SECTION */}
                              <div className="mt-4 bg-[#1F2937] rounded-xl p-4 border border-[#374151] space-y-3">
                                <div>
                                  <h3 className="text-white font-semibold text-sm">
                                    Step 1: Upload Work Started Photo
                                  </h3>
                                  <p className="text-[#9CA3AF] text-xs mt-1">
                                    Upload a photo showing work has begun at the location
                                  </p>
                                </div>

                                {/* Dashed upload area */}
                                <input
                                  type="file"
                                  id={`file-upload-started-${issue.docId}`}
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleUploadWorkStarted(issue, e.target.files[0])
                                  }
                                  className="hidden"
                                />
                                <div
                                  onClick={() =>
                                    !submitLoading[issue.docId] &&
                                    document
                                      .getElementById(`file-upload-started-${issue.docId}`)
                                      .click()
                                  }
                                  className={`border-dashed border border-[#374151] hover:border-blue-500/50 rounded-xl p-4 text-center bg-[#1F2937]/30 transition duration-200 ${
                                    submitLoading[issue.docId]
                                      ? "cursor-not-allowed opacity-50"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  <span className="text-[#9CA3AF] text-xs">
                                    {submitLoading[issue.docId]
                                      ? "Uploading..."
                                      : "Click to upload progress photo"}
                                  </span>
                                </div>

                                {/* Gemini Loading Spinner */}
                                {submitLoading[issue.docId] && (
                                  <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-semibold animate-pulse py-2">
                                    <div className="animate-spin border-2 border-blue-400 border-t-transparent rounded-full w-4 h-4"></div>
                                    <span>Gemini is analyzing...</span>
                                  </div>
                                )}

                                {/* Error & Success States */}
                                {submitError[issue.docId] && (
                                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    Gemini could not verify. Please upload clearer work photo.
                                  </div>
                                )}
                                {submitSuccess[issue.docId] && (
                                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    Gemini Verified! Issue moved to In Progress
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {subTab === "In Progress" && (
                    <div className="space-y-4">
                      {assignedIssues.filter((i) => i.status === "In Progress").length === 0 ? (
                        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-16 text-center text-[#9CA3AF]">
                          No in-progress issues.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "In Progress")
                          .map((issue) => (
                            <div
                              key={issue.docId || issue.id}
                              className="bg-[#111827] rounded-2xl border border-[#374151] p-5 mb-4 max-w-4xl mx-auto"
                            >
                              {/* TOP details */}
                              <div className="flex gap-4">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className="w-28 h-28 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900"
                                />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                      {issue.category}
                                    </span>
                                    <span className={getSeverityBadgeClass(issue.severity)}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className="text-white text-sm font-medium leading-relaxed">
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                                    <span>Location: {issue.location}</span>
                                    <span className="text-[#6B7280]">
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                    <span className="text-[#6B7280]">Date: {issue.date}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Show Step 1 completed */}
                              <div className="mt-4 bg-green-500/10 rounded-xl p-3 border border-green-500/20 flex gap-4 items-start">
                                {issue.workPhotos?.[0] && (
                                  <img
                                    src={issue.workPhotos[0]}
                                    alt="Work Started"
                                    className="w-16 h-16 object-cover rounded-lg border border-green-500/20 shrink-0 bg-gray-900"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="text-white font-semibold text-xs">
                                    Step 1 Complete - Work Started Photo Verified by Gemini
                                  </div>
                                  {issue.workStartedNote && (
                                    <div className="text-green-400 text-xs mt-1 leading-relaxed">
                                      "{issue.workStartedNote}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* STEP 2 SECTION */}
                              <div className="mt-4 bg-[#1F2937] rounded-xl p-4 border border-[#374151] space-y-3">
                                <div>
                                  <h3 className="text-white font-semibold text-sm">
                                    Step 2: Upload Completion Photo
                                  </h3>
                                  <p className="text-[#9CA3AF] text-xs mt-1">
                                    Upload photo of the SAME location showing issue is fully
                                    resolved
                                  </p>
                                </div>

                                {/* Dashed upload area */}
                                <input
                                  type="file"
                                  id={`file-upload-completed-${issue.docId}`}
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleUploadWorkCompleted(issue, e.target.files[0])
                                  }
                                  className="hidden"
                                />
                                <div
                                  onClick={() =>
                                    !submitLoading[issue.docId] &&
                                    document
                                      .getElementById(`file-upload-completed-${issue.docId}`)
                                      .click()
                                  }
                                  className={`border-dashed border border-[#374151] hover:border-blue-500/50 rounded-xl p-4 text-center bg-[#1F2937]/30 transition duration-200 ${
                                    submitLoading[issue.docId]
                                      ? "cursor-not-allowed opacity-50"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  <span className="text-[#9CA3AF] text-xs">
                                    {submitLoading[issue.docId]
                                      ? "Uploading..."
                                      : "Click to upload completion photo"}
                                  </span>
                                </div>

                                {/* Gemini Loading Spinner */}
                                {submitLoading[issue.docId] && (
                                  <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-semibold animate-pulse py-2">
                                    <div className="animate-spin border-2 border-blue-400 border-t-transparent rounded-full w-4 h-4"></div>
                                    <span>Gemini is verifying completion...</span>
                                  </div>
                                )}

                                {/* Error & Success States */}
                                {submitError[issue.docId] && (
                                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    Gemini could not verify completion. Please upload photo
                                    showing the fixed location.
                                  </div>
                                )}
                                {submitSuccess[issue.docId] && (
                                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    Gemini Verified Completion! Issue marked as Resolved
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {subTab === "Resolved" && (
                    <div className="space-y-4">
                      {assignedIssues.filter((i) => i.status === "Resolved").length === 0 ? (
                        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-16 text-center text-[#9CA3AF]">
                          No resolved issues yet.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "Resolved")
                          .map((issue) => (
                            <div
                              key={issue.docId || issue.id}
                              className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 mb-4 max-w-4xl mx-auto flex flex-col gap-4"
                            >
                              {/* TOP details */}
                              <div className="flex gap-4">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className="w-28 h-28 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900"
                                />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                      {issue.category}
                                    </span>
                                    <span className={getSeverityBadgeClass(issue.severity)}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className="text-white text-sm font-medium leading-relaxed">
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                                    <span>Location: {issue.location}</span>
                                    <span className="text-[#6B7280]">
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                    <span className="text-[#6B7280]">Date: {issue.date}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Before & After section */}
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                {/* Left: Work Started */}
                                <div className="bg-[#0A0F1E]/30 rounded-xl p-3 border border-[#374151]/50 flex flex-col gap-2">
                                  <div className="text-xs font-semibold text-[#9CA3AF]">
                                    Work Started
                                  </div>
                                  {issue.workPhotos?.[0] ? (
                                    <img
                                      src={issue.workPhotos[0]}
                                      alt="Work Started Proof"
                                      className="w-full h-32 object-cover rounded-xl border border-[#374151]/50 bg-gray-900"
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-gray-900 rounded-xl border border-[#374151]/30 flex items-center justify-center text-xs text-gray-500">
                                      No Image
                                    </div>
                                  )}
                                  {issue.workStartedNote && (
                                    <div className="text-xs text-[#9CA3AF] leading-relaxed italic">
                                      "{issue.workStartedNote}"
                                    </div>
                                  )}
                                </div>

                                {/* Right: Completed */}
                                <div className="bg-[#0A0F1E]/30 rounded-xl p-3 border border-[#374151]/50 flex flex-col gap-2">
                                  <div className="text-xs font-semibold text-[#9CA3AF]">
                                    Completed
                                  </div>
                                  {issue.workPhotos?.[1] ? (
                                    <img
                                      src={issue.workPhotos[1]}
                                      alt="Completion Proof"
                                      className="w-full h-32 object-cover rounded-xl border border-[#374151]/50 bg-gray-900"
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-gray-900 rounded-xl border border-[#374151]/30 flex items-center justify-center text-xs text-gray-500">
                                      No Image
                                    </div>
                                  )}
                                  {issue.completionNote && (
                                    <div className="text-xs text-[#9CA3AF] leading-relaxed italic">
                                      "{issue.completionNote}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Resolved on Date */}
                              {issue.resolvedDate && (
                                <div className="text-green-400 text-sm mt-3 font-semibold">
                                  Resolved on {issue.resolvedDate}
                                </div>
                              )}

                              {/* Issue Successfully Resolved banner */}
                              <div className="bg-green-500/10 text-green-400 rounded-lg p-2 text-center text-xs font-bold border border-green-500/20">
                                Issue Successfully Resolved
                              </div>
                            </div>
                          ))
                      )}
                    </div>
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
