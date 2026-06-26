import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc, arrayUnion, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { verifyInProgressImage, verifyResolvedImage, analyzeWorkPhoto } from "../lib/gemini";
import { sendStatusNotification, createInAppNotification } from "../lib/notifications";
import IssueMap from "../components/IssueMap";
import { useTheme } from "../context/ThemeContext";

export default function OfficerDashboard() {
  const { userProfile } = useAuth();
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

  const bgPrimary = t.bg;
  const bgSurface = t.surface;
  const bgSurface2 = t.surface2;
  const bgSidebar = t.sidebar;
  const borderTheme = t.border;
  const borderSidebar = t.border;
  const textTheme = t.text;
  const textMuted = t.muted;
  const textSubtle = isDark ? "text-[#6B7280]" : "text-[#475569]";

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

  // Chat States
  const [allChats, setAllChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [officerChatMessage, setOfficerChatMessage] = useState("");

  const messagesEndRef = useRef(null);

  // Live clock
  const [liveTime, setLiveTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allChats, selectedChat]);

  useEffect(() => {
    const chatsCollection = collection(db, "chats");
    const unsubscribe = onSnapshot(chatsCollection, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      // Filter where messages array is not empty
      const active = list.filter((chat) => chat.messages && chat.messages.length > 0);
      setAllChats(active);
    }, (error) => {
      console.error("Error listening to chats:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSendOfficerMessage = async (e) => {
    e.preventDefault();
    if (!officerChatMessage.trim() || !selectedChat) return;

    const messageId = Date.now();
    const timestamp = new Date().toISOString();
    const newMessage = {
      id: messageId,
      text: officerChatMessage,
      senderEmail: userProfile?.email || "officer@example.com",
      senderRole: "officer",
      timestamp: timestamp,
    };

    const chatDocRef = doc(db, "chats", String(selectedChat.issueId));

    try {
      await updateDoc(chatDocRef, {
        messages: arrayUnion(newMessage),
      });

      // Find the issue to get category
      const chatIssue = issues.find(i => String(i.id) === String(selectedChat.issueId));
      const category = chatIssue ? chatIssue.category : "issue";

      createInAppNotification(
        selectedChat.issueId,
        `New message from department regarding your ${category} issue`,
        "message"
      );

      setOfficerChatMessage("");
    } catch (err) {
      console.error("Failed to send officer chat message:", err);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          docId: doc.id,
          ...doc.data(),
        }));
        // Sort: newest first locally to avoid index requirement
        data.sort((a, b) => {
          const valA = typeof a.id === 'number' ? a.id : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const valB = typeof b.id === 'number' ? b.id : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return valB - valA;
        });
        setIssues(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const officerDepartment = userProfile?.department || "BMC";

  // Filter issues by officer's department - REMOVED department filter to show ALL issues
  const assignedIssues = issues;

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
    { id: "messages", label: "Messages" },
    { id: "submit", label: "Submit Review" },
    { id: "map", label: "Issue Map" },
  ];

  return (
    <div className={`min-h-screen ${bgPrimary} ${textTheme} flex relative transition-colors duration-300`}>
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 bg-green-600 border border-green-500 text-white px-5 py-3 rounded-xl shadow-2xl z-50 text-sm font-semibold animate-pulse">
          {toastMsg}
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 w-64 h-screen ${bgSidebar} border-r ${borderSidebar} pt-20 flex flex-col z-30 transition-colors duration-300`}>
        {/* App Logo */}
        <div className="text-blue-400 font-bold text-xl px-6 mb-4 mt-4">
          CivicPulse
        </div>

        {/* Officer Info */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-base shrink-0">
              {(userProfile?.name || "O")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-bold ${textTheme} truncate`}>{userProfile?.name || "Officer"}</div>
              <div className="mt-1">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                  {officerDepartment} Dept
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isMessagesTab = tab.id === "messages";
            const unreadCount = isMessagesTab
              ? allChats.filter(chat => {
                  if (!chat.messages || chat.messages.length === 0) return false;
                  const lastMsg = chat.messages[chat.messages.length - 1];
                  return lastMsg.senderRole === "citizen";
                }).length
              : 0;

            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 flex items-center justify-between gap-3 cursor-pointer rounded-r-xl mr-3 font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : `${textMuted} hover:${textTheme} hover:${bgSurface2}`
                }`}
              >
                <span>{tab.label}</span>
                {isMessagesTab && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {unreadCount}
                  </span>
                )}
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
            {activeTab === "Dashboard" && (() => {
              // Derived analytics
              const resolvedPercent = totalAssigned > 0 ? Math.round((resolvedCount / totalAssigned) * 100) : 0;
              const totalUpvotes = assignedIssues.reduce((acc, i) => acc + (i.upvotes || 0), 0);
              const categories = ['Pothole', 'Water Leak', 'Broken Streetlight', 'Garbage Dumping', 'Other'];
              const categoryCounts = categories.map(cat => ({
                name: cat,
                count: assignedIssues.filter(i =>
                  cat === 'Other'
                    ? !['Pothole','Water Leak','Broken Streetlight','Garbage Dumping'].includes(i.category)
                    : i.category === cat
                ).length
              }));
              const recentIssues = [...assignedIssues].slice(0, 5);

              return (
                <div className="max-w-6xl mx-auto animate-fadeIn">

                  {/* ── HEADER ── */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-base shrink-0">
                        {(userProfile?.name || "O")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white leading-tight">{userProfile?.name || "Officer"}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[#9CA3AF] text-sm">{officerDepartment} Department</span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-green-400 text-xs font-semibold">Live</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-semibold">
                        {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[#9CA3AF] text-xs mt-0.5">
                        {liveTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* ── STATS CARDS ── */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { icon: '📋', label: 'Total Assigned', count: totalAssigned,    color: 'bg-blue-500/20 text-blue-400',   bar: 'bg-blue-500',   pct: 100 },
                      { icon: '⏳', label: 'Pending',        count: pendingCount,      color: 'bg-gray-500/20 text-gray-400',   bar: 'bg-gray-400',   pct: totalAssigned > 0 ? (pendingCount / totalAssigned) * 100 : 0 },
                      { icon: '⚡', label: 'In Progress',    count: inProgressCount,   color: 'bg-yellow-500/20 text-yellow-400',bar: 'bg-yellow-500', pct: totalAssigned > 0 ? (inProgressCount / totalAssigned) * 100 : 0 },
                      { icon: '✅', label: 'Resolved',       count: resolvedCount,     color: 'bg-green-500/20 text-green-400', bar: 'bg-green-500',  pct: totalAssigned > 0 ? (resolvedCount / totalAssigned) * 100 : 0 },
                    ].map(({ icon, label, count, color, bar, pct }) => (
                      <div key={label} className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 hover:border-blue-500/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg shrink-0`}>{icon}</div>
                          <div className="min-w-0">
                            <div className="text-2xl font-black text-white leading-none">{count}</div>
                            <div className="text-[#9CA3AF] text-xs mt-0.5">{label}</div>
                          </div>
                        </div>
                        <div className="mt-3 bg-[#1F2937] rounded-full h-1 overflow-hidden">
                          <div className={`${bar} h-1 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── QUICK ACTIONS ── */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0">
                          <span className="block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                          <span className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm">{pendingCount} Action{pendingCount !== 1 ? 's' : ''} Required</div>
                          <div className="text-red-400/70 text-xs">Awaiting officer review</div>
                        </div>
                      </div>
                      <button onClick={() => { setActiveTab('submit'); setSubTab('Pending'); }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer shrink-0">
                        Review →
                      </button>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-base shrink-0">💬</div>
                        <div>
                          <div className="text-white font-semibold text-sm">{allChats.length} Conversation{allChats.length !== 1 ? 's' : ''}</div>
                          <div className="text-blue-400/70 text-xs">Messages from citizens</div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('messages')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer shrink-0">
                        Open →
                      </button>
                    </div>
                  </div>

                  {/* ── BOTTOM GRID: Activity + Charts ── */}
                  <div className="grid grid-cols-5 gap-4">

                    {/* RECENT ACTIVITY (col-span-3) */}
                    <div className="col-span-3 bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
                        <span className="text-base font-bold text-white">Recent Activity</span>
                        <span className="text-[#6B7280] text-xs">{recentIssues.length} issues</span>
                      </div>
                      {recentIssues.length === 0 ? (
                        <div className="px-4 py-10 text-center text-[#9CA3AF] text-sm">No activity yet.</div>
                      ) : (
                        recentIssues.map((issue, idx) => (
                          <div
                            key={issue.docId || issue.id}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-[#1F2937] transition ${
                              idx < recentIssues.length - 1 ? 'border-b border-[#1F2937]/50' : ''
                            }`}
                          >
                            {/* Status icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                              issue.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                              issue.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {issue.status === 'Resolved' ? '✅' : issue.status === 'In Progress' ? '🔄' : '⏳'}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                {issue.category} · {issue.location}
                              </div>
                              <div className="text-[#6B7280] text-xs truncate">{issue.userEmail || 'Anonymous'}</div>
                            </div>
                            {/* Status + date */}
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                issue.status === 'Resolved' ? 'bg-green-500/10 text-green-400' :
                                issue.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>{issue.status}</span>
                              <div className="text-[#6B7280] text-xs mt-1">{issue.date || '—'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* RIGHT COLUMN (col-span-2): Category Heatmap + Performance */}
                    <div className="col-span-2 flex flex-col gap-4">

                      {/* Issue Breakdown */}
                      <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4">
                        <div className="text-base font-bold text-white mb-4">Issue Breakdown</div>
                        {categoryCounts.map(({ name, count }) => (
                          <div key={name} className="flex items-center gap-3 mb-3">
                            <span className="text-[#9CA3AF] text-xs w-32 truncate shrink-0">{name}</span>
                            <div className="flex-1 bg-[#1F2937] rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-500 rounded-full h-2 transition-all duration-700"
                                style={{ width: `${totalAssigned > 0 ? (count / totalAssigned) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-white text-xs w-5 text-right shrink-0">{count}</span>
                          </div>
                        ))}
                      </div>

                      {/* Department Performance */}
                      <div className="grid grid-cols-1 gap-3">
                        {/* Avg Resolution Time */}
                        <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4">
                          <div className="text-3xl font-black text-blue-400">4.2</div>
                          <div className="text-[#9CA3AF] text-xs mt-0.5">days average</div>
                          <div className="text-[#6B7280] text-xs mt-1">Based on resolved issues</div>
                          <div className="mt-2 bg-[#1F2937] rounded-full h-1 overflow-hidden">
                            <div className="bg-blue-500 h-1 rounded-full" style={{ width: '42%' }} />
                          </div>
                        </div>

                        {/* Resolution Rate + Upvotes side by side */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4">
                            <div className="text-2xl font-black text-green-400">{resolvedPercent}%</div>
                            <div className="text-[#9CA3AF] text-xs mt-0.5">resolved</div>
                            <div className="mt-2 bg-[#1F2937] rounded-full h-1 overflow-hidden">
                              <div className="bg-green-500 h-1 rounded-full transition-all duration-700" style={{ width: `${resolvedPercent}%` }} />
                            </div>
                          </div>
                          <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4">
                            <div className="text-2xl font-black text-amber-400">{totalUpvotes}</div>
                            <div className="text-[#9CA3AF] text-xs mt-0.5">upvotes</div>
                            <div className="text-[#6B7280] text-xs mt-1">Community</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })()}


            {/* 2. ANALYZE REPORTS TAB */}
            {activeTab === "analyze" && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <div>
                  <h1 className={`text-2xl font-bold ${textTheme}`}>Analyze Reports</h1>
                  <p className={`${textMuted} text-sm mt-1`}>
                    View all reported civic issues assigned to {officerDepartment}
                  </p>
                </div>

                {/* Premium Filter Tabs */}
                <div className={`${bgSurface} rounded-2xl p-1 flex gap-1 w-fit`}>
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map((f) => (
                    <button
                      key={f}
                      className={`px-5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        f === 'All'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : `${textMuted} hover:text-white hover:${bgSurface2}`
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {assignedIssues.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center ${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center`}>
                      <h3 className={`${textTheme} font-bold text-lg`}>No issues assigned yet</h3>
                      <p className={`${textMuted} text-sm mt-1`}>
                        Issues reported for your department will appear here.
                      </p>
                    </div>
                  ) : (
                    assignedIssues.map((issue) => (
                      <div
                        key={issue.docId || issue.id}
                        className={`${bgSurface} rounded-2xl border ${borderTheme} p-5 mb-4 max-w-4xl mx-auto flex flex-col gap-4 transition-colors duration-300 ${
                          issue.severity === 'Critical' ? 'border-l-4 border-l-red-500' :
                          issue.severity === 'High' ? 'border-l-4 border-l-orange-500' :
                          issue.severity === 'Medium' ? 'border-l-4 border-l-yellow-500' :
                          'border-l-4 border-l-green-500'
                        }`}
                      >
                        {/* TOP Section */}
                        <div className="flex gap-4">
                          <img
                            src={issue.imagePreview}
                            alt=""
                            className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900`}
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
                            <p className={`${textTheme} text-sm font-medium leading-relaxed`}>
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                              <span className={textMuted}>Location: {issue.location}</span>
                              <span className={textSubtle}>
                                Reporter: {issue.userEmail || "Anonymous"}
                              </span>
                              <span className={textSubtle}>Date: {issue.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI SUMMARY BOX */}
                        <div className={`${bgSurface2} rounded-xl p-4 mt-3 border ${borderTheme}`}>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className={`text-[10px] uppercase font-bold ${textSubtle} tracking-wider`}>
                                Department
                              </div>
                              <div className="text-blue-400 text-sm font-semibold mt-1">
                                {issue.department || "BMC"}
                              </div>
                            </div>
                            <div>
                              <div className={`text-[10px] uppercase font-bold ${textSubtle} tracking-wider`}>
                                Est. Resolution
                              </div>
                              <div className="text-amber-400 text-sm font-semibold mt-1">
                                {issue.estimatedDays !== undefined && issue.estimatedDays !== null
                                  ? `${issue.estimatedDays} Days`
                                  : "Not Set"}
                              </div>
                            </div>
                            <div>
                              <div className={`text-[10px] uppercase font-bold ${textSubtle} tracking-wider`}>
                                AI Suggested Action
                              </div>
                              <div className={`${textMuted} text-xs mt-1 leading-relaxed`}>
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
                                className="border border-blue-500/50 text-blue-400 rounded-lg px-4 py-2 text-sm hover:bg-blue-500/10 transition cursor-pointer font-semibold bg-transparent"
                              >
                                {expandedIssueId === issue.docId ? "Cancel" : "Set Estimated Resolution"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Click-to-Expand Form */}
                        {expandedIssueId === issue.docId && (
                          <div className={`${bgSurface2} rounded-xl p-4 border ${borderTheme} mt-3 animate-fadeIn`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Option 1: Set Resolution Timeline */}
                              <div className={`${bgSurface} border ${borderTheme} hover:border-green-500/60 rounded-xl p-4 transition duration-200 flex flex-col justify-between`}>
                                <div className="space-y-3">
                                  <h4 className={`${textTheme} font-semibold text-sm`}>Set Resolution Timeline</h4>
                                  <p className={`${textMuted} text-xs`}>I can resolve this issue</p>
                                  <div>
                                    <label className={`${textMuted} text-[10px] uppercase font-bold block mb-1`}>
                                      Estimated days to resolve
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={estDays}
                                      onChange={(e) => setEstDays(e.target.value)}
                                      className={`${bgPrimary} border ${borderTheme} rounded-lg px-3 py-2 ${textTheme} w-24 text-sm focus:border-green-500 focus:outline-none`}
                                      placeholder="e.g. 5"
                                    />
                                  </div>
                                  <div>
                                    <label className={`${textMuted} text-[10px] uppercase font-bold block mb-1`}>
                                      Resolution plan
                                    </label>
                                    <textarea
                                      value={resolutionPlan}
                                      onChange={(e) => setResolutionPlan(e.target.value)}
                                      placeholder="Describe how you plan to resolve this..."
                                      className={`${bgPrimary} border ${borderTheme} rounded-lg px-3 py-2 ${textTheme} w-full text-sm resize-none focus:border-green-500 focus:outline-none`}
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
                              <div className={`${bgSurface} border ${borderTheme} hover:border-red-500/60 rounded-xl p-4 transition duration-200 flex flex-col justify-between`}>
                                <div className="space-y-3">
                                  <h4 className={`${textTheme} font-semibold text-sm`}>Cannot Resolve Now</h4>
                                  <p className={`${textMuted} text-xs`}>I cannot resolve this right now</p>
                                  <div>
                                    <label className={`${textMuted} text-[10px] uppercase font-bold block mb-1`}>
                                      Reason
                                    </label>
                                    <select
                                      value={cannotResolveReason}
                                      onChange={(e) => setCannotResolveReason(e.target.value)}
                                      className={`${bgPrimary} border ${borderTheme} rounded-lg px-3 py-2 ${textTheme} w-full text-sm focus:border-red-500 focus:outline-none cursor-pointer`}
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
                                    <label className={`${textMuted} text-[10px] uppercase font-bold block mb-1`}>
                                      Additional details
                                    </label>
                                    <textarea
                                      value={cannotResolveDetails}
                                      onChange={(e) => setCannotResolveDetails(e.target.value)}
                                      placeholder="Provide reasons, dependencies or delay details..."
                                      className={`${bgPrimary} border ${borderTheme} rounded-lg px-3 py-2 ${textTheme} w-full text-sm resize-none focus:border-red-500 focus:outline-none`}
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
              <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <div>
                  <h1 className={`text-2xl font-bold ${textTheme}`}>Submit Review</h1>
                  <p className={`${textMuted} text-sm mt-1`}>
                    Review work progress and verify issue resolution for {officerDepartment}
                  </p>
                </div>

                {/* Sub-tabs header */}
                <div className={`flex border-b ${borderTheme} gap-2`}>
                  {[
                    { name: "Pending", count: pendingCount, color: "bg-red-500" },
                    { name: "In Progress", count: inProgressCount, color: "bg-yellow-500" },
                    { name: "Resolved", count: resolvedCount, color: "bg-green-500" },
                  ].map(({ name: tabName, count, color }) => {
                    const isActive = subTab === tabName;
                    return (
                      <button
                        key={tabName}
                        onClick={() => setSubTab(tabName)}
                        className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold cursor-pointer border-b-2 transition duration-200 ${
                          isActive
                            ? "border-blue-500 text-white"
                            : `border-transparent ${textMuted} hover:text-white`
                        }`}
                      >
                        {tabName}
                        <span className={`${color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tab content */}
                <div className="space-y-6 mt-4">
                  {subTab === "Pending" && (
                    <div className="space-y-4">
                      {assignedIssues.filter((i) => i.status === "Pending").length === 0 ? (
                        <div className={`${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center ${textMuted}`}>
                          No pending issues.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "Pending")
                          .map((issue) => (
                            <div
                              key={issue.docId || issue.id}
                              className={`${bgSurface} rounded-2xl border ${borderTheme} p-5 mb-4 max-w-4xl mx-auto`}
                            >
                              {/* TOP details */}
                              <div className="flex gap-4">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900`}
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
                                  <p className={`${textTheme} text-sm font-medium leading-relaxed`}>
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs flex-wrap">
                                    <span className={textMuted}>Location: {issue.location}</span>
                                    <span className={textSubtle}>
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                    <span className={textSubtle}>Date: {issue.date}</span>
                                  </div>
                                </div>
                              </div>

                              {/* STEP 1 SECTION */}
                              <div className={`mt-4 ${bgSurface2} rounded-xl p-4 border ${borderTheme} space-y-3`}>
                                <div>
                                  <h3 className={`${textTheme} font-semibold text-sm`}>
                                    Step 1: Upload Work Started Photo
                                  </h3>
                                  <p className={`${textMuted} text-xs mt-1`}>
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
                                  <span className={`${textMuted} text-xs`}>
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
                        <div className={`${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center ${textMuted}`}>
                          No in-progress issues.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "In Progress")
                          .map((issue) => (
                            <div
                              key={issue.docId || issue.id}
                              className={`${bgSurface} rounded-2xl border ${borderTheme} p-5 mb-4 max-w-4xl mx-auto`}
                            >
                              {/* TOP details */}
                              <div className="flex gap-4">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900`}
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
                                  <p className={`${textTheme} text-sm font-medium leading-relaxed`}>
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs flex-wrap">
                                    <span className={textMuted}>Location: {issue.location}</span>
                                    <span className={textSubtle}>
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                    <span className={textSubtle}>Date: {issue.date}</span>
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
                                  <div className={`font-semibold text-xs ${textTheme}`}>
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
                              <div className={`mt-4 ${bgSurface2} rounded-xl p-4 border ${borderTheme} space-y-3`}>
                                <div>
                                  <h3 className={`${textTheme} font-semibold text-sm`}>
                                    Step 2: Upload Completion Photo
                                  </h3>
                                  <p className={`${textMuted} text-xs mt-1`}>
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
                                  <span className={`${textMuted} text-xs`}>
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
                        <div className={`${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center ${textMuted}`}>
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
                                  className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900`}
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
                                  <p className={`${textTheme} text-sm font-medium leading-relaxed`}>
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs flex-wrap">
                                    <span className={textMuted}>Location: {issue.location}</span>
                                    <span className={textSubtle}>
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                    <span className={textSubtle}>Date: {issue.date}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Before & After section */}
                              <div className="mt-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">Before &amp; After</div>
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Left: Before (Work Started) */}
                                  <div className={`rounded-xl p-3 border-2 border-yellow-500/30 flex flex-col gap-2 ${isDark ? 'bg-[#0A0F1E]/30' : 'bg-[#F8FAFC]'}`}>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                      <span className="text-xs font-bold text-yellow-400">Before</span>
                                    </div>
                                    {issue.workPhotos?.[0] ? (
                                      <img
                                        src={issue.workPhotos[0]}
                                        alt="Work Started Proof"
                                        className={`w-full h-36 object-cover rounded-xl border ${borderTheme} bg-gray-900`}
                                      />
                                    ) : (
                                      <div className="w-full h-36 bg-gray-900 rounded-xl border border-[#374151]/30 flex items-center justify-center text-xs text-gray-500">
                                        No Image
                                      </div>
                                    )}
                                    {issue.workStartedNote && (
                                      <div className={`text-xs ${textMuted} leading-relaxed italic`}>
                                        "{issue.workStartedNote}"
                                      </div>
                                    )}
                                  </div>

                                  {/* Right: After (Completed) */}
                                  <div className={`rounded-xl p-3 border-2 border-green-500/30 flex flex-col gap-2 ${isDark ? 'bg-[#0A0F1E]/30' : 'bg-[#F8FAFC]'}`}>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                      <span className="text-xs font-bold text-green-400">After</span>
                                    </div>
                                    {issue.workPhotos?.[1] ? (
                                      <img
                                        src={issue.workPhotos[1]}
                                        alt="Completion Proof"
                                        className={`w-full h-36 object-cover rounded-xl border ${borderTheme} bg-gray-900`}
                                      />
                                    ) : (
                                      <div className="w-full h-36 bg-gray-900 rounded-xl border border-[#374151]/30 flex items-center justify-center text-xs text-gray-500">
                                        No Image
                                      </div>
                                    )}
                                    {issue.completionNote && (
                                      <div className={`text-xs ${textMuted} leading-relaxed italic`}>
                                        "{issue.completionNote}"
                                      </div>
                                    )}
                                  </div>
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

            {/* 4. MESSAGES TAB */}
            {activeTab === "messages" && (
              <div className="max-w-6xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Department Messages</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">
                    Direct real-time chat with citizens regarding reported complaints
                  </p>
                </div>

                <div className="bg-[#111827] border border-[#374151] rounded-2xl overflow-hidden flex h-[540px]">
                  {/* LEFT PANEL */}
                  <div className="w-1/3 border-r border-[#374151] flex flex-col h-full bg-[#0D1117]/50">
                    <div className="p-4 border-b border-[#374151] flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Active Chats</span>
                      {allChats.length > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {allChats.length}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {allChats.length === 0 ? (
                        <div className="p-8 text-center text-[#9CA3AF] text-sm">
                          No active chats.
                        </div>
                      ) : (
                        allChats.map((chat) => {
                          const lastMsg = chat.messages[chat.messages.length - 1];
                          const isUnread = lastMsg && lastMsg.senderRole === "citizen";
                          const chatIssue = issues.find(i => String(i.id) === String(chat.issueId));
                          const category = chatIssue ? chatIssue.category : "Issue";
                          const isSelected = selectedChat?.docId === chat.docId;

                          return (
                            <div
                              key={chat.docId}
                              onClick={() => setSelectedChat(chat)}
                              className={`rounded-xl p-3 mb-2 cursor-pointer transition border ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-transparent bg-[#1F2937] hover:border-blue-500/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="bg-blue-500/10 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  {category}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {isUnread && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  )}
                                  {lastMsg && (
                                    <span className="text-[#6B7280] text-[9px]">
                                      {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-[10px] text-[#9CA3AF] truncate">
                                {chat.citizenEmail}
                              </div>
                              {lastMsg && (
                                <div className="text-xs text-white truncate mt-1 line-clamp-1">
                                  {lastMsg.text}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANEL */}
                  <div className="w-2/3 flex flex-col h-full bg-[#0A0F1E]/20">
                    {!selectedChat ? (
                      <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">
                        Select a chat to communicate with the citizen
                      </div>
                    ) : (
                      <>
                        {/* Chat Header */}
                        <div className="bg-[#1F2937] px-6 py-3 border-b border-[#374151] flex items-center justify-between">
                          <div>
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase">
                              {(() => {
                                const chatIssue = issues.find(i => String(i.id) === String(selectedChat.issueId));
                                return chatIssue ? chatIssue.category : "Issue";
                              })()}
                            </span>
                            <span className="text-[#9CA3AF] text-xs ml-3">
                              {(() => {
                                const chatIssue = issues.find(i => String(i.id) === String(selectedChat.issueId));
                                return chatIssue ? `Location: ${chatIssue.location}` : "";
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {(() => {
                              const chatIssue = issues.find(i => String(i.id) === String(selectedChat.issueId));
                              return chatIssue && chatIssue.department ? (
                                <span className="bg-purple-500/10 text-purple-400 text-[9px] px-2 py-0.5 rounded-md border border-purple-500/20 font-bold uppercase">
                                  🏢 {chatIssue.department}
                                </span>
                              ) : null;
                            })()}
                            <span className="text-[#6B7280] text-[10px] truncate max-w-[200px]">
                              {selectedChat.citizenEmail}
                            </span>
                          </div>
                        </div>

                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto p-6 space-y-4 flex flex-col">
                          {(() => {
                            const currentChat = allChats.find(c => c.docId === selectedChat.docId) || selectedChat;
                            return currentChat.messages?.map((msg) => {
                              const isOfficer = msg.senderRole === "officer";
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col ${isOfficer ? "items-end" : "items-start"}`}
                                >
                                  <div
                                    className={`max-w-xs rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                                      isOfficer
                                        ? "bg-blue-600 text-white rounded-br-sm ml-auto"
                                        : "bg-[#1F2937] text-white rounded-bl-sm border border-[#374151]/50"
                                    }`}
                                  >
                                    {msg.text}
                                  </div>
                                  <span className="text-xs text-[#6B7280] mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendOfficerMessage} className="p-4 border-t border-[#374151] bg-[#0A0F1E]/50 flex gap-3 mt-auto">
                          <input
                            type="text"
                            placeholder="Type your reply..."
                            value={officerChatMessage}
                            onChange={(e) => setOfficerChatMessage(e.target.value)}
                            className="flex-1 bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                          />
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition text-sm cursor-pointer shadow-md shadow-blue-500/10"
                          >
                            Send
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "map" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Issue Map</h2>
                  <p className="text-[#9CA3AF] mb-6">All civic issues reported across Mumbai</p>
                </div>

                <IssueMap issues={issues} height="500px" />

                {/* Legend */}
                <div className="flex gap-6 mt-4">
                  {[['Critical','#EF4444'],['High','#F97316'],['Medium','#F59E0B'],['Low','#10B981']].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div style={{ background: color }} className="w-3 h-3 rounded-full" />
                      <span className="text-[#9CA3AF] text-xs">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
