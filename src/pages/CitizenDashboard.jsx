import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, where, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import Report from "./Report";
import { generateSupportReply } from "../lib/gemini";
import IssueMap from "../components/IssueMap";
import { useTheme } from "../context/ThemeContext";

export default function CitizenDashboard() {
  const { user, userProfile, logout } = useAuth();
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
  const [communityFilter, setCommunityFilter] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [mapFilter, setMapFilter] = useState("all");

  // Notification bell state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('civicpulse_notifications') || '[]'); } catch { return []; }
  });

  // Real-time Chat States
  const [selectedChatIssue, setSelectedChatIssue] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, geminiLoading]);

  useEffect(() => {
    if (!selectedChatIssue?.id) {
      setChatMessages([]);
      return;
    }
    const chatDocRef = doc(db, "chats", String(selectedChatIssue.id));
    const unsubscribe = onSnapshot(chatDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setChatMessages(snapshot.data().messages || []);
      } else {
        setChatMessages([]);
      }
    }, (error) => {
      console.error("Error listening to chat messages:", error);
    });
    return () => unsubscribe();
  }, [selectedChatIssue]);

  useEffect(() => {
    const q = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        docId: doc.id,
        ...doc.data()
      }));
      // Sort: newest first locally
      data.sort((a, b) => {
        const valA = typeof a.id === 'number' ? a.id : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const valB = typeof b.id === 'number' ? b.id : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return valB - valA;
      });
      setIssues(data);
      setLoading(false);
    }, (error) => {
      console.error('Firestore error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const allIssues = issues;
  const myIssues = issues.filter(i => i.userId === user?.uid || i.userEmail === user?.email);

  const filteredMapIssues = mapFilter === 'mine' 
    ? allIssues.filter(i => i.userId === user?.uid || i.userEmail === user?.email)
    : mapFilter === 'critical'
    ? allIssues.filter(i => i.severity === 'Critical')
    : mapFilter === 'pending'
    ? allIssues.filter(i => i.status === 'Pending')
    : allIssues;

  const handleUpvote = async (docId, currentUpvotes) => {
    // Optimistic update for issues
    setIssues((prev) =>
      prev.map((i) =>
        i.docId === docId || String(i.id) === String(docId)
          ? { ...i, upvotes: (i.upvotes || 0) + 1 }
          : i
      )
    );
    // Optimistic update for selectedIssue in modal
    setSelectedIssue((prev) => {
      if (prev && (prev.docId === docId || String(prev.id) === String(docId))) {
        return { ...prev, upvotes: (prev.upvotes || 0) + 1 };
      }
      return prev;
    });

    try {
      const docRef = doc(db, "issues", docId);
      await updateDoc(docRef, {
        upvotes: (currentUpvotes || 0) + 1,
      });
    } catch (e) {
      console.error("Failed to upvote:", e);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    const userMsgText = chatMessage.trim();
    if (!userMsgText || !selectedChatIssue) return;

    const messageId = Date.now();
    const timestamp = new Date().toISOString();
    const newMessage = {
      id: messageId,
      text: userMsgText,
      senderEmail: user?.email || "citizen@example.com",
      senderRole: "citizen",
      timestamp: timestamp,
    };

    const chatDocId = String(selectedChatIssue.id);
    const chatDocRef = doc(db, "chats", chatDocId);

    try {
      const chatDocSnap = await getDoc(chatDocRef);
      if (chatDocSnap.exists()) {
        await updateDoc(chatDocRef, {
          messages: arrayUnion(newMessage),
        });
      } else {
        await setDoc(chatDocRef, {
          issueId: selectedChatIssue.id,
          citizenEmail: user?.email || "citizen@example.com",
          officerEmail: selectedChatIssue.department || "",
          messages: [newMessage],
        });
      }
      setChatMessage("");
    } catch (err) {
      console.error("Failed to send chat message:", err);
      return;
    }

    // Trigger Gemini AI support response
    setGeminiLoading(true);
    try {
      const history = [...chatMessages, newMessage];
      const aiReplyText = await generateSupportReply({
        userProfile,
        issue: selectedChatIssue,
        chatHistory: history,
        userMessage: userMsgText,
      });

      const aiMessage = {
        id: Date.now(),
        text: aiReplyText,
        senderEmail: "gemini-support@civicpulse.gov",
        senderRole: "officer", // acts as department/officer response
        timestamp: new Date().toISOString(),
      };

      await updateDoc(chatDocRef, {
        messages: arrayUnion(aiMessage),
      });
    } catch (aiErr) {
      console.error("Gemini support reply failed:", aiErr);
    } finally {
      setGeminiLoading(false);
    }
  };

  // Statistics
  const totalCount = myIssues.length;
  const resolvedCount = myIssues.filter((i) => i.status === "Resolved").length;
  const inProgressCount = myIssues.filter((i) => i.status === "In Progress").length;
  const totalUpvotes = myIssues.reduce((sum, issue) => sum + (issue.upvotes || 0), 0);

  const getLeaderboard = (issuesList) => {
    const counts = {};
    issuesList.forEach(i => {
      const email = i.userEmail;
      if (email) {
        counts[email] = (counts[email] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const leaderboard = getLeaderboard(issues);

  const truncateEmail = (email) => {
    if (!email) return "";
    const parts = email.split("@");
    if (parts.length < 2) return email.length > 15 ? email.slice(0, 12) + "..." : email;
    const [local, domain] = parts;
    const truncatedLocal = local.length > 4 ? local.slice(0, 4) + "..." : local;
    return `${truncatedLocal}@${domain}`;
  };

  const getSeverityBadgeClass = (sev) => {
    const base = "rounded-md px-2 py-0.5 text-[10px] font-bold border inline-block ";
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
    { id: "Dashboard", label: "Dashboard", icon: "⊞" },
    { id: "Report an Issue", label: "Report an Issue", icon: "+" },
    { id: "track", label: "Track My Reports", icon: "◎" },
    { id: "Send Message", label: "Send Message", icon: "✉" },
    { id: "community", label: "Community Feed", icon: "❖" },
    { id: "map", label: "Issue Map", icon: "🗺️" }
  ];

  const getFilteredCommunityIssues = () => {
    const activeIssues = allIssues.filter((i) => i.status !== "Resolved");
    if (communityFilter === "All") {
      return activeIssues;
    }
    if (communityFilter === "Pending") {
      return activeIssues.filter((i) => i.status === communityFilter);
    }
    return activeIssues.filter((i) => i.category === communityFilter);
  };

  const filteredCommunityIssues = getFilteredCommunityIssues();

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = userProfile?.name || "Citizen";
    const firstName = name.split(" ")[0];
    if (hr < 12) return `Good morning, ${firstName}!`;
    if (hr < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const myIssueIdsForChat = new Set(myIssues.map(i => String(i.id)));
  const hasUnreadMessages = notifications.some(
    (n) => myIssueIdsForChat.has(String(n.issueId)) && !n.read && n.type === "message"
  );

  return (
    <div className={`min-h-screen ${bgPrimary} ${textTheme} flex transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`w-64 ${bgSidebar} border-r ${borderSidebar} h-screen fixed left-0 top-0 pt-20 flex flex-col z-30 transition-colors duration-300`}>
        
        {/* TOP: User profile section */}
        <div className={`px-4 pb-6 border-b ${borderSidebar} mt-2`}>
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto">
            {(userProfile?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          {/* Name */}
          <div className={`${textTheme} font-semibold text-sm text-center mt-3`}>
            {userProfile?.name || "User"}
          </div>
          {/* Email */}
          <div className={`${textMuted} text-xs text-center mt-1 truncate px-2`} title={user?.email}>
            {user?.email}
          </div>
          {/* Role badge */}
          <div className="flex justify-center mt-2">
            <span className="bg-blue-500/10 text-blue-400 text-xs rounded-full px-3 py-1 font-medium mx-auto">
              Citizen
            </span>
          </div>
        </div>

        {/* NAV ITEMS */}
        <nav className="mt-6 px-3 flex-1 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isSendMessage = tab.id === "Send Message";
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm font-medium ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : `${textMuted} hover:${textTheme} hover:${bgSurface2}`
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="flex-1">{tab.label}</span>
                {isSendMessage && hasUnreadMessages && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </nav>

        {/* BOTTOM of sidebar */}
        <div className="mt-auto px-3 pb-6">
          <div className={`border-t ${borderSidebar} pt-4`}>
            <button
              onClick={logout}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${textMuted} hover:text-red-400 hover:bg-red-500/5 w-full transition text-sm font-medium bg-transparent border-none outline-none text-left cursor-pointer`}
            >
              <span className="text-base">⎋</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 pt-20 px-8 pb-20 min-w-0 relative">
        {/* NOTIFICATION BELL */}
        {(() => {
          const myIssueIds = new Set(myIssues.map(i => String(i.id)));
          const myNotifs = notifications.filter(n => myIssueIds.has(String(n.issueId)));
          const unreadCount = myNotifs.filter(n => !n.read).length;
          const markAllRead = () => {
            const updated = notifications.map(n =>
              myIssueIds.has(String(n.issueId)) ? { ...n, read: true } : n
            );
            setNotifications(updated);
            localStorage.setItem('civicpulse_notifications', JSON.stringify(updated));
          };
          const markOneRead = (id) => {
            const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
            setNotifications(updated);
            localStorage.setItem('civicpulse_notifications', JSON.stringify(updated));
            setNotifOpen(false);
            setActiveTab('track');
          };
          return (
            <div className="fixed top-20 right-8 z-50">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className={`relative w-10 h-10 flex items-center justify-center rounded-xl hover:border-blue-500/50 transition cursor-pointer ${bgSurface} ${borderTheme} ${textTheme}`}
              >
                <span className="text-lg">&#x1F514;</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-2xl shadow-black/50 ${bgSurface} ${borderTheme}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-bold text-sm ${textTheme}`}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-blue-400 text-xs font-semibold hover:text-blue-300 cursor-pointer">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {myNotifs.length === 0 ? (
                      <p className={`text-xs text-center py-4 ${textMuted}`}>No notifications yet</p>
                    ) : (
                      myNotifs.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markOneRead(notif.id)}
                          className={`rounded-xl p-3 cursor-pointer transition ${bgSurface2} ${isDark ? 'hover:bg-[#374151]/50' : 'hover:bg-[#E2E8F0]/50'} ${
                            !notif.read ? 'border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <p className={`text-xs leading-relaxed ${textTheme}`}>{notif.message}</p>
                          <p className={`text-[10px] mt-1 ${textSubtle}`}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
            <span className="text-[#9CA3AF] text-sm font-medium">Loading your space...</span>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD TAB */}
            {activeTab === "Dashboard" && (
              <div className="space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className={`text-3xl font-black ${textTheme}`}>
                      {getGreeting()}
                    </h1>
                    <p className={`${textMuted} text-sm mt-1`}>
                      {getFormattedDate()}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("Report an Issue")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition duration-200 cursor-pointer"
                  >
                    + Report New Issue
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-5">
                  {/* My Reports */}
                  <div className={`${bgSurface} rounded-2xl p-6 border ${borderTheme} hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl shadow-inner">
                        📋
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">{totalCount}</div>
                        <div className={`${textMuted} text-sm mt-1`}>My Reports</div>
                      </div>
                    </div>
                    <div className={`w-full ${bgSurface2} h-1.5 rounded-full mt-5 overflow-hidden`}>
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${totalCount > 0 ? 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className={`${bgSurface} rounded-2xl p-6 border ${borderTheme} hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5 transition-all flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xl shadow-inner">
                        ⚡
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">{inProgressCount}</div>
                        <div className={`${textMuted} text-sm mt-1`}>In Progress</div>
                      </div>
                    </div>
                    <div className={`w-full ${bgSurface2} h-1.5 rounded-full mt-5 overflow-hidden`}>
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Resolved */}
                  <div className={`${bgSurface} rounded-2xl p-6 border ${borderTheme} hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center text-xl shadow-inner">
                        ✅
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">{resolvedCount}</div>
                        <div className={`${textMuted} text-sm mt-1`}>Resolved</div>
                      </div>
                    </div>
                    <div className={`w-full ${bgSurface2} h-1.5 rounded-full mt-5 overflow-hidden`}>
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Your Achievements Section */}
                {(() => {
                  const getBadges = (issues, totalUpvotesVal) => {
                    const count = issues.length;
                    const resolved = issues.filter(i => i.status === 'Resolved').length;
                    
                    return [
                      {
                        id: 'first_report',
                        icon: '🌱',
                        name: 'First Reporter',
                        desc: 'Submit your first civic issue',
                        earned: count >= 1,
                        color: 'green'
                      },
                      {
                        id: 'active_citizen',
                        icon: '⭐',
                        name: 'Active Citizen', 
                        desc: 'Report 3 or more issues',
                        earned: count >= 3,
                        color: 'yellow'
                      },
                      {
                        id: 'community_hero',
                        icon: '🏆',
                        name: 'Community Hero',
                        desc: 'Report 5 or more issues',
                        earned: count >= 5,
                        color: 'amber'
                      },
                      {
                        id: 'problem_solver',
                        icon: '✅',
                        name: 'Problem Solver',
                        desc: 'Get 1 issue resolved',
                        earned: resolved >= 1,
                        color: 'blue'
                      },
                      {
                        id: 'influencer',
                        icon: '🔥',
                        name: 'City Influencer',
                        desc: 'Receive 10+ total upvotes',
                        earned: totalUpvotesVal >= 10,
                        color: 'red'
                      },
                      {
                        id: 'champion',
                        icon: '👑',
                        name: 'City Champion',
                        desc: 'Report 10+ issues and get 5+ resolved',
                        earned: count >= 10 && resolved >= 5,
                        color: 'purple'
                      }
                    ];
                  };

                  const computedTotalUpvotes = myIssues.reduce((sum, i) => sum + (i.upvotes || 0), 0);
                  const badges = getBadges(myIssues, computedTotalUpvotes);
                  const earnedCount = badges.filter(b => b.earned).length;

                  const badgeColors = {
                    green: {
                      earned: "bg-green-500/10 border border-green-500/30 text-green-400",
                      text: "text-green-400"
                    },
                    yellow: {
                      earned: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400",
                      text: "text-yellow-400"
                    },
                    amber: {
                      earned: "bg-amber-500/10 border border-amber-500/30 text-amber-400",
                      text: "text-amber-400"
                    },
                    blue: {
                      earned: "bg-blue-500/10 border border-blue-500/30 text-blue-400",
                      text: "text-blue-400"
                    },
                    red: {
                      earned: "bg-red-500/10 border border-red-500/30 text-red-400",
                      text: "text-red-400"
                    },
                    purple: {
                      earned: "bg-purple-500/10 border border-purple-500/30 text-purple-400",
                      text: "text-purple-400"
                    }
                  };

                  return (
                    <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 mt-4">
                      <div className="text-base font-bold text-white">Your Achievements</div>
                      <div className="text-[#9CA3AF] text-xs mt-1">Earn badges by actively reporting civic issues</div>
                      <div className="text-blue-400 text-xs mt-1">{earnedCount}/{badges.length} badges earned</div>

                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {badges.map(b => {
                          const colors = badgeColors[b.color] || badgeColors.blue;
                          return (
                            <div
                              key={b.id}
                              className={b.earned
                                ? `${colors.earned} rounded-xl p-4 text-center`
                                : "bg-[#1F2937] border border-[#374151] rounded-xl p-4 text-center opacity-40 grayscale"
                              }
                            >
                              <div
                                className="text-3xl mb-2"
                                style={{ filter: b.earned ? 'none' : 'grayscale(100%)' }}
                              >
                                {b.icon}
                              </div>
                              <div className="text-white text-xs font-bold">{b.name}</div>
                              <div className="text-[#9CA3AF] text-xs mt-1">{b.desc}</div>
                              {b.earned ? (
                                <div className={`${colors.text} text-xs mt-2 font-semibold`}>✓ Earned</div>
                              ) : (
                                <div className="text-[#6B7280] text-xs mt-2">Locked</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* My Recent Reports & Need to report something? Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`${bgSurface} border ${borderTheme} rounded-2xl p-6`}>
                    <h2 className={`text-xl font-bold ${textTheme} mb-4`}>My Recent Reports</h2>
                    
                    {myIssues.length === 0 ? (
                      <p className={`${textMuted} text-sm`}>You haven't reported any issues yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {myIssues.slice(0, 3).map((issue) => (
                          <div
                            key={issue.docId || issue.id}
                            onClick={() => setActiveTab('track')}
                            className={`flex items-center gap-3 p-3 rounded-xl hover:${bgSurface2} transition cursor-pointer group`}
                          >
                            <img
                              src={issue.imagePreview}
                              alt=""
                              className={`w-14 h-14 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-500/20">
                                  {issue.category}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border ${
                                  issue.status === "Resolved"
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : issue.status === "In Progress"
                                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                }`}>
                                  {issue.status}
                                </span>
                              </div>
                              <div className="text-[#9CA3AF] text-xs mt-1 truncate">
                                📍 {issue.location}
                              </div>
                            </div>
                            <span className="text-[#6B7280] group-hover:text-blue-400 transition text-sm shrink-0">→</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <button
                        onClick={() => setActiveTab("track")}
                        className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer"
                      >
                        View All My Reports &rarr;
                      </button>
                    </div>
                  </div>

                  <div className={`${bgSurface} border ${borderTheme} rounded-2xl p-6 flex flex-col justify-between`}>
                    <div>
                      <h2 className={`text-xl font-bold ${textTheme} mb-2`}>Need to report something?</h2>
                      <p className={`${textMuted} text-sm leading-relaxed`}>
                        You can easily file a complaint directly within the workspace. Click below or select the "Report an Issue" tab to open the reporting portal.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("Report an Issue")}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200 text-sm shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      Report an Issue &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REPORT AN ISSUE TAB */}
            {activeTab === "Report an Issue" && (
              <div className="-mt-8">
                <Report onViewReports={() => setActiveTab("track")} />
              </div>
            )}

            {/* 3. TRACK MY REPORTS TAB */}
            {activeTab === "track" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className={`text-2xl font-bold ${textTheme}`}>Track My Reports</h1>
                </div>

                {myIssues.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center ${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center`}>
                    <span className="text-5xl mb-3"></span>
                    <h3 className={`${textTheme} font-bold text-lg`}>You haven't reported any issues yet</h3>
                    <button
                      onClick={() => setActiveTab("Report an Issue")}
                      className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 text-sm shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      Report an Issue &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myIssues.map((issue) => (
                      <div
                        key={issue.docId || issue.id}
                        className={`${bgSurface} rounded-2xl border ${borderTheme} p-6 mb-6 transition-colors duration-300 ${
                          issue.status === 'Resolved'
                            ? 'border-l-4 border-l-green-500'
                            : issue.status === 'In Progress'
                            ? 'border-l-4 border-l-yellow-500'
                            : 'border-l-4 border-l-gray-500'
                        }`}
                      >
                        {/* TOP SECTION */}
                        <div className="flex gap-4">
                          <img
                            src={issue.imagePreview}
                            alt=""
                            className={`w-32 h-32 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                {issue.category}
                              </span>
                              <span className={getSeverityBadgeClass(issue.severity)}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className={`${textTheme} text-sm mt-2`}>{issue.description}</p>
                            <div className={`text-xs ${textMuted} mt-1`}>Location: {issue.location}</div>
                            <div className={`text-xs ${textSubtle} mt-1`}>Date: Reported: {issue.date}</div>
                          </div>
                        </div>

                        {/* PROGRESS TRACKER */}
                        <div className={`mt-4 flex items-center w-full max-w-xl px-6 py-4 rounded-xl border transition-colors duration-300 ${
                          isDark ? "bg-[#0A0F1E]/40 border-[#374151]/30" : "bg-[#F8FAFC] border-[#E2E8F0]"
                        }`}>
                          {/* Step 1 */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/20 text-lg">
                              ✓
                            </div>
                            <span className="text-xs font-semibold text-green-400 mt-2">Reported</span>
                          </div>

                          {/* Line 1 */}
                          <div className={`flex-1 h-0.5 mx-3 relative overflow-hidden ${
                            issue.status === "In Progress" || issue.status === "Resolved"
                              ? "bg-yellow-500"
                              : (isDark ? "bg-[#374151]" : "bg-[#E2E8F0]")
                          }`}>
                            {issue.status === "In Progress" && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_linear_infinite]" />
                            )}
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300 text-lg ${
                              issue.status === "In Progress" || issue.status === "Resolved"
                                ? "bg-yellow-500 shadow-lg shadow-yellow-500/20"
                                : (isDark ? "bg-[#1F2937] border border-[#374151] text-[#9CA3AF]" : "bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B]")
                            }`}>
                              {issue.status === "In Progress" || issue.status === "Resolved" ? "✓" : "2"}
                            </div>
                            <span className={`text-xs font-semibold mt-2 ${
                              issue.status === "In Progress" || issue.status === "Resolved" ? "text-yellow-400" : textMuted
                            }`}>
                              In Progress
                            </span>
                          </div>

                          {/* Line 2 */}
                          <div className={`flex-1 h-0.5 mx-3 ${
                            issue.status === "Resolved"
                              ? "bg-green-500"
                              : (isDark ? "bg-[#374151]" : "bg-[#E2E8F0]")
                          }`} />

                          {/* Step 3 */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300 text-lg ${
                              issue.status === "Resolved"
                                ? "bg-green-500 shadow-lg shadow-green-500/20"
                                : (isDark ? "bg-[#1F2937] border border-[#374151] text-[#9CA3AF]" : "bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B]")
                            }`}>
                              {issue.status === "Resolved" ? "✓" : "3"}
                            </div>
                            <span className={`text-xs font-semibold mt-2 ${
                              issue.status === "Resolved" ? "text-green-400" : textMuted
                            }`}>
                              Resolved
                            </span>
                          </div>
                        </div>

                        {/* OFFICER UPDATE BOX */}
                        {issue.officerNote ? (
                          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <div className="text-blue-400 font-semibold text-sm mb-1">🏢 Department Update</div>
                            <div className="text-white text-sm leading-relaxed">{issue.officerNote}</div>
                            <div className={`text-xs mt-2 ${textSubtle}`}>Updated by Municipal Officer</div>
                          </div>
                        ) : (
                          <div className={`mt-4 ${bgSurface2} rounded-xl p-4 border ${borderTheme}`}>
                            <div className={`${textMuted} text-sm`}>Awaiting department response...</div>
                          </div>
                        )}

                        {/* WORK PROOF PHOTOS */}
                        {issue.workPhotos && issue.workPhotos.length > 0 && (
                          <div className="mt-4">
                            <div className={`text-sm ${textMuted} mb-2`}>Work Progress Photos</div>
                            <div className="flex gap-2 flex-wrap">
                              {issue.workPhotos.map((photoUrl, idx) => (
                                <img
                                  key={idx}
                                  src={photoUrl}
                                  alt={`Work progress ${idx + 1}`}
                                  className={`w-24 h-24 object-cover rounded-lg border ${borderTheme} bg-gray-900`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* EST. RESOLUTION */}
                        {(issue.estimatedDays !== undefined && issue.estimatedDays !== null) && (
                          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 inline-flex items-center gap-2">
                            <span className="text-amber-400 text-sm">Estimated Resolution: {issue.estimatedDays} days</span>
                          </div>
                        )}

                        {/* RESOLVED CELEBRATION BANNER */}
                        {issue.status === 'Resolved' && (
                          <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <p className="text-green-400 font-bold text-sm">This issue has been resolved! Thank you for making your city better.</p>
                            {issue.workPhotos && issue.workPhotos[1] && (
                              <div className="mt-3">
                                <p className={`text-xs mb-1 font-semibold ${textMuted}`}>Completion Proof Photo</p>
                                <img
                                  src={issue.workPhotos[1]}
                                  alt="Resolved"
                                  className="w-full max-w-xs h-36 object-cover rounded-xl border border-green-500/30"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SEND MESSAGE TAB */}
            {activeTab === "Send Message" && (
              <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                <div>
                  <h1 className={`text-2xl font-bold ${textTheme}`}>Send Message</h1>
                  <p className={`${textMuted} text-sm mt-1`}>Direct support chat with municipal operators</p>
                </div>

                <div className={`${bgSurface} border ${borderTheme} rounded-2xl overflow-hidden flex h-[500px]`}>
                  {/* LEFT PANEL */}
                  <div className={`w-1/3 border-r ${borderTheme} flex flex-col h-full ${isDark ? 'bg-[#0D1117]/50' : 'bg-[#F8FAFC]/50'}`}>
                    <div className={`p-4 border-b ${borderTheme}`}>
                      <h2 className={`text-sm ${textMuted} mb-3 font-semibold`}>
                        My Issues
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {myIssues.length === 0 ? (
                        <div className={`p-8 text-center ${textMuted} text-sm`}>
                          You haven't reported any issues yet.
                        </div>
                      ) : (
                        myIssues.map((issue) => {
                          const isSelected = selectedChatIssue?.id === issue.id;
                          return (
                            <div
                              key={issue.id}
                              onClick={() => setSelectedChatIssue(issue)}
                              className={`mx-2 mb-2 rounded-xl p-3 cursor-pointer transition border ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : `border-transparent ${bgSurface2} hover:border-blue-500/50`
                              } flex items-center gap-3`}
                            >
                              <img
                                src={issue.imagePreview}
                                alt=""
                                className={`w-10 h-10 object-cover rounded-lg border ${borderTheme} bg-gray-900 shrink-0`}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="bg-blue-500/10 text-blue-400 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  {issue.category}
                                </span>
                                <div className={`text-xs ${textMuted} truncate mt-1`}>
                                  {issue.location}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANEL */}
                  <div className={`w-2/3 flex flex-col h-full ${isDark ? 'bg-[#0A0F1E]/20' : 'bg-[#F8FAFC]/20'}`}>
                    {!selectedChatIssue ? (
                      <div className={`flex-1 flex items-center justify-center ${textMuted} text-sm`}>
                        Select an issue to chat with the department
                      </div>
                    ) : (
                      <>
                        {/* Chat Header */}
                        <div className={`${bgSurface2} px-6 py-4 border-b ${borderTheme} flex items-center justify-between`}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase">
                              {selectedChatIssue.category}
                            </span>
                            <span className={`${textMuted} text-xs`}>
                              📍 {selectedChatIssue.location}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold uppercase ${
                              selectedChatIssue.status === 'Resolved'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : selectedChatIssue.status === 'In Progress'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                              {selectedChatIssue.status}
                            </span>
                          </div>
                          {selectedChatIssue.department && (
                            <span className="bg-purple-500/10 text-purple-400 text-[9px] px-2 py-0.5 rounded-md border border-purple-500/20 font-bold uppercase">
                              🏢 {selectedChatIssue.department}
                            </span>
                          )}
                        </div>

                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto p-6 space-y-4 flex flex-col">
                          {chatMessages.length === 0 ? (
                            <div className={`text-center text-xs ${textMuted} py-8`}>
                              No messages yet. Send a message to start communicating.
                            </div>
                          ) : (
                            chatMessages.map((msg) => {
                              const isUser = msg.senderRole === "citizen";
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                                >
                                  <div
                                    className={`max-w-xs rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                                      isUser
                                        ? "bg-blue-600 text-white rounded-br-sm ml-auto"
                                        : (isDark ? "bg-[#1F2937] text-white rounded-bl-sm border border-[#374151]/50" : "bg-[#F1F5F9] text-[#0F172A] rounded-bl-sm border border-[#E2E8F0]/50")
                                    }`}
                                  >
                                    {msg.text}
                                  </div>
                                  <span className={`text-xs ${textSubtle} mt-1`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              );
                            })
                          )}
                          {geminiLoading && (
                            <div className="flex flex-col items-start animate-pulse">
                              <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm leading-relaxed ${isDark ? 'bg-[#1F2937] text-[#9CA3AF] border-[#374151]/50' : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]/50'} rounded-bl-sm border flex items-center gap-2`}>
                                <div className="animate-spin border-2 border-blue-400 border-t-transparent rounded-full w-3.5 h-3.5 shrink-0"></div>
                                <span>Gemini is thinking...</span>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendChatMessage} className={`p-4 border-t ${borderTheme} ${isDark ? 'bg-[#0A0F1E]/50' : 'bg-[#F8FAFC]/50'} flex gap-3 mt-auto`}>
                          <input
                            type="text"
                            placeholder="Type your message here..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className={`flex-1 bg-[#1F2937] border border-[#374151] rounded-2xl px-4 py-3 ${textTheme} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-sm`}
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

            {activeTab === "community" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className={`text-2xl font-bold ${textTheme}`}>Community Issues Feed</h1>
                  <p className={`${textMuted} text-sm mt-1`}>See what your neighbors are reporting</p>
                </div>

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-bold text-white mb-3">Top Contributors This Week</div>
                    {leaderboard.map((contrib, index) => {
                      const rankStyles = [
                        { badge: "bg-yellow-500 text-black", emoji: "🥇" },
                        { badge: "bg-gray-400 text-black", emoji: "🥈" },
                        { badge: "bg-amber-600 text-white", emoji: "🥉" }
                      ];
                      const style = rankStyles[index] || { badge: "bg-gray-700 text-white", emoji: `${index + 1}` };
                      return (
                        <div key={contrib.email} className="flex items-center gap-3 bg-[#1F2937] rounded-xl p-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${style.badge}`}>
                            {style.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white text-sm font-semibold truncate">{truncateEmail(contrib.email)}</div>
                            <div className="text-[#9CA3AF] text-xs">{contrib.count} reports</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Filter Bar */}
                <div className="flex gap-3 flex-wrap mt-4">
                  {["All", "Pothole", "Water Leak", "Broken Streetlight", "Garbage Dumping", "Pending"].map((filter) => {
                    const isActive = communityFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setCommunityFilter(filter)}
                        className={
                          isActive
                            ? "bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition cursor-pointer shadow-md shadow-blue-500/10"
                            : `${bgSurface} border ${borderTheme} ${textMuted} hover:text-white rounded-lg px-4 py-2 text-sm transition cursor-pointer`
                        }
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>

                {/* Issues Grid */}
                {filteredCommunityIssues.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center ${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center mt-6`}>
                    <span className="text-5xl mb-3"></span>
                    <h3 className={`${textTheme} font-bold text-lg`}>No community issues yet</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {filteredCommunityIssues.map((issue) => (
                      <div
                        key={issue.docId || issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className={`${bgSurface} rounded-2xl border ${borderTheme} overflow-hidden hover:border-blue-500/50 transition flex flex-col justify-between cursor-pointer`}
                      >
                        {/* Card Image */}
                        <img
                          src={issue.imagePreview}
                          alt=""
                          className={`h-36 w-full object-cover bg-gray-900 border-b ${isDark ? 'border-[#374151]/50' : 'border-[#E2E8F0]/50'}`}
                        />

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                {issue.category}
                              </span>
                              <span className={getSeverityBadgeClass(issue.severity)}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className={`${textTheme} text-sm line-clamp-2 mt-1 font-medium leading-relaxed`}>
                              {issue.description}
                            </p>
                            <div className={`text-xs ${textMuted} mt-2 flex items-center gap-1`}>
                              <span>Location:</span>
                              <span className="truncate">{issue.location}</span>
                            </div>
                          </div>

                          <div className={`mt-4 pt-3 border-t ${isDark ? 'border-[#374151]/50' : 'border-[#E2E8F0]/50'}`}>
                            {/* Bottom Row */}
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase ${
                                issue.status === "Resolved"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : issue.status === "In Progress"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                              }`}>
                                {issue.status}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpvote(issue.docId || issue.id, issue.upvotes);
                                }}
                                className={`border ${borderTheme} ${bgSurface2} px-2.5 py-1 rounded-lg ${textMuted} text-xs font-semibold flex items-center gap-1.5 hover:border-blue-500 hover:text-blue-400 transition cursor-pointer`}
                              >
                                &#x1F44D; {issue.upvotes || 0}
                              </button>
                            </div>
                            <div className={`text-xs ${textSubtle} mt-2`}>
                              Reported on {issue.date}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Click to Expand Modal */}
                {selectedIssue && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50">
                    <div className={`${bgSurface} rounded-2xl border ${borderTheme} p-6 max-w-lg w-full mx-4 flex flex-col gap-4 overflow-y-auto max-h-[90vh]`}>
                      {/* Full image */}
                      {selectedIssue.imagePreview && (
                        <img
                          src={selectedIssue.imagePreview}
                          alt=""
                          className={`w-full h-56 object-cover rounded-xl bg-gray-900 border ${isDark ? 'border-[#374151]/50' : 'border-[#E2E8F0]/50'}`}
                        />
                      )}

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                          {selectedIssue.category}
                        </span>
                        <span className={getSeverityBadgeClass(selectedIssue.severity)}>
                          {selectedIssue.severity}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase ${
                          selectedIssue.status === "Resolved"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : selectedIssue.status === "In Progress"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}>
                          {selectedIssue.status}
                        </span>
                        {selectedIssue.department && (
                          <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5 rounded-md border border-purple-500/20 font-bold uppercase tracking-wider">
                            {selectedIssue.department}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className={`text-xs ${textMuted} font-bold uppercase tracking-wider`}>Description</h4>
                        <p className={`${textTheme} text-sm mt-1 leading-relaxed whitespace-pre-wrap`}>{selectedIssue.description}</p>
                      </div>

                      {/* Location */}
                      <div className={`text-xs ${textMuted} flex items-center gap-1 font-medium`}>
                        <span>Location:</span>
                        <span className={textTheme}>{selectedIssue.location}</span>
                      </div>

                      {/* Suggested Action */}
                      {selectedIssue.suggested_action && (
                        <div className="text-sm text-blue-400 font-medium">
                          Action: {selectedIssue.suggested_action}
                        </div>
                      )}

                      {/* Officer Note */}
                      {selectedIssue.officerNote && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="text-xs font-semibold text-blue-400">Department Update</div>
                          <p className={`text-xs mt-1 leading-relaxed ${textTheme}`}>{selectedIssue.officerNote}</p>
                        </div>
                      )}

                      {/* Footer Controls */}
                      <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-[#374151]/50' : 'border-[#E2E8F0]/50'}`}>
                        <button
                          onClick={() => handleUpvote(selectedIssue.docId || selectedIssue.id, selectedIssue.upvotes)}
                          className={`border ${borderTheme} ${bgSurface2} px-4 py-2 rounded-xl ${textMuted} text-sm font-semibold flex items-center gap-1.5 hover:border-blue-500 hover:text-blue-400 transition cursor-pointer`}
                        >
                          <span>&#x1F44D; Upvote</span>
                          <span>{selectedIssue.upvotes || 0}</span>
                        </button>

                        <button
                          onClick={() => setSelectedIssue(null)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "map" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className={`text-2xl font-bold ${textTheme} mb-2`}>Issue Map</h2>
                  <p className={`${textMuted} mb-6`}>All civic issues reported across Mumbai</p>
                </div>
                
                {/* Filter buttons */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {['all','mine','critical','pending'].map(f => (
                    <button
                      key={f}
                      onClick={() => setMapFilter(f)}
                      className={`px-4 py-2 rounded-lg text-sm capitalize transition cursor-pointer ${
                        mapFilter === f 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                          : `${bgSurface} border ${borderTheme} ${textMuted} hover:text-white`
                      }`}
                    >
                      {f === 'all' ? 'All Issues' : f === 'mine' ? 'My Issues' : f === 'critical' ? 'Critical' : 'Pending'}
                    </button>
                  ))}
                </div>

                <IssueMap issues={filteredMapIssues} height="500px" />

                {/* Legend */}
                <div className="flex gap-6 mt-4">
                  {[['Critical','#EF4444'],['High','#F97316'],['Medium','#F59E0B'],['Low','#10B981']].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div style={{ background: color }} className="w-3 h-3 rounded-full" />
                      <span className={`${textMuted} text-xs`}>{label}</span>
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
