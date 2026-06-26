import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import Report from "./Report";

export default function CitizenDashboard() {
  const { user, userProfile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Mock message state
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "system", text: "Welcome to CivicPulse Support. How can we help you today?", time: "09:00 AM" },
    { sender: "user", text: "I wanted to check the status of my streetlight complaint.", time: "09:02 AM" },
    { sender: "system", text: "Our municipal team is currently looking into it. You will receive an update note on your dashboard as soon as work starts.", time: "09:03 AM" }
  ]);

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
        console.error("Firestore error in citizen dashboard:", error);
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
      console.error("Failed to upvote:", e);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMsg = {
      sender: "user",
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, newMsg]);
    setChatMessage("");

    // Simulate reply
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        sender: "system",
        text: "Thank you for your message. An officer from the respective department will respond shortly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // Filter user's specific issues
  const myIssues = issues.filter((i) => i.userId === user?.uid);

  // Statistics
  const totalCount = myIssues.length;
  const resolvedCount = myIssues.filter((i) => i.status === "Resolved").length;
  const inProgressCount = myIssues.filter((i) => i.status === "In Progress").length;
  const totalUpvotes = myIssues.reduce((sum, issue) => sum + (issue.upvotes || 0), 0);

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
    { id: "Dashboard", label: "Dashboard", icon: "📊" },
    { id: "Report an Issue", label: "Report an Issue", icon: "🚨" },
    { id: "Track My Reports", label: "Track My Reports", icon: "📍" },
    { id: "Send Message", label: "Send Message", icon: "💬" }
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
            <span className="text-[#9CA3AF] text-sm font-medium">Loading your space...</span>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD TAB */}
            {activeTab === "Dashboard" && (
              <div className="space-y-8">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Welcome back, {userProfile?.name || "Citizen"} 👋
                  </h1>
                  <p className="text-[#9CA3AF] mt-2 text-sm">
                    Track your reported civic issues and community activity
                  </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* My Reports */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-blue-500/20 transition duration-200">
                    <span className="text-2xl">📋</span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-blue-400">{totalCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">My Reports</div>
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

                  {/* In Progress */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-yellow-500/20 transition duration-200">
                    <span className="text-2xl">⏳</span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-yellow-400">{inProgressCount}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">In Progress</div>
                    </div>
                  </div>

                  {/* Upvotes Given */}
                  <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between hover:border-purple-500/20 transition duration-200">
                    <span className="text-2xl">👍</span>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-purple-400">{totalUpvotes}</div>
                      <div className="text-[#9CA3AF] text-xs font-semibold mt-1">Upvotes Given</div>
                    </div>
                  </div>
                </div>

                {/* Community Feed & Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Community Feed</h2>
                    <div className="space-y-4">
                      {issues.slice(0, 5).map((issue) => (
                        <div
                          key={issue.docId || issue.id}
                          className="bg-[#0A0F1E]/50 rounded-xl p-3 flex items-center justify-between gap-4 border border-[#374151]/30"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={issue.imagePreview}
                              alt=""
                              className="w-12 h-12 object-cover rounded-lg shrink-0 border border-[#374151]/50 bg-gray-900"
                            />
                            <div className="min-w-0">
                              <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-500/20">
                                {issue.category}
                              </span>
                              <div className="text-xs text-[#9CA3AF] mt-1 truncate max-w-[150px]">
                                📍 {issue.location}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUpvote(issue.docId || issue.id, issue.upvotes)}
                            className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white hover:text-blue-400 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition duration-200 flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>👍</span>
                            <span>{issue.upvotes || 0}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Link to="/feed" className="text-blue-400 hover:text-blue-300 text-xs font-semibold">
                        View Full Feed →
                      </Link>
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Need to report something?</h2>
                      <p className="text-[#9CA3AF] text-sm leading-relaxed">
                        You can easily file a complaint directly within the workspace. Click below or select the "Report an Issue" tab to open the reporting portal.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("Report an Issue")}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200 text-sm shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      Report an Issue →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REPORT AN ISSUE TAB */}
            {activeTab === "Report an Issue" && (
              <div className="-mt-8">
                <Report />
              </div>
            )}

            {/* 3. TRACK MY REPORTS TAB */}
            {activeTab === "Track My Reports" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Track My Reports</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">Monitor real-time progress on issues submitted by you</p>
                </div>

                {myIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center bg-[#111827] border border-[#374151] rounded-2xl p-16 text-center">
                    <span className="text-5xl mb-3">📢</span>
                    <h3 className="text-white font-bold text-lg">No issues reported yet</h3>
                    <p className="text-[#9CA3AF] text-sm mt-1">
                      Start by reporting your first civic issue
                    </p>
                    <button
                      onClick={() => setActiveTab("Report an Issue")}
                      className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 text-sm shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      Report an Issue →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myIssues.map((issue) => (
                      <div
                        key={issue.docId || issue.id}
                        className="bg-[#111827] rounded-2xl border border-[#374151] p-4 flex flex-col justify-between hover:border-blue-500/30 transition duration-200"
                      >
                        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                          <div className="flex gap-4 items-start">
                            <img
                              src={issue.imagePreview}
                              alt=""
                              className="w-24 h-24 object-cover rounded-xl shrink-0 border border-[#374151]/50 bg-gray-900"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-bold uppercase tracking-wider">
                                  {issue.category}
                                </span>
                                <span className={getSeverityBadgeClass(issue.severity)}>
                                  {issue.severity}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-sm text-white font-medium">{issue.description}</p>
                              <div className="text-xs text-[#9CA3AF] flex items-center gap-1 mt-1">
                                <span>📍</span>
                                <span className="truncate max-w-[200px] sm:max-w-xs">{issue.location}</span>
                              </div>
                              <div className="text-xs text-[#6B7280]">Reported on {issue.date}</div>
                            </div>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 self-center md:self-start bg-[#0A0F1E]/50 px-4 py-3 rounded-xl border border-[#374151]/40 shrink-0">
                            <div className="flex flex-col items-center px-1">
                              <div className="w-4.5 h-4.5 rounded-full bg-green-500 flex items-center justify-center text-white text-[9px] font-bold">
                                ✓
                              </div>
                              <span className="text-[9px] font-bold text-green-400 mt-1">Reported</span>
                            </div>
                            
                            <div className="w-6 h-0.5 bg-green-500"></div>

                            <div className="flex flex-col items-center px-1">
                              <div
                                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                                  issue.status === "In Progress" || issue.status === "Resolved"
                                    ? "bg-green-500"
                                    : "bg-[#1F2937] border border-[#374151]"
                                }`}
                              >
                                {issue.status === "In Progress" || issue.status === "Resolved" ? "✓" : "2"}
                              </div>
                              <span
                                className={`text-[9px] font-bold mt-1 ${
                                  issue.status === "In Progress" || issue.status === "Resolved"
                                    ? "text-green-400"
                                    : "text-[#6B7280]"
                                }`}
                              >
                                In Progress
                              </span>
                            </div>

                            <div
                              className={`w-6 h-0.5 ${
                                issue.status === "Resolved" ? "bg-green-500" : "bg-[#1F2937]"
                              }`}
                            ></div>

                            <div className="flex flex-col items-center px-1">
                              <div
                                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                                  issue.status === "Resolved"
                                    ? "bg-green-500"
                                    : "bg-[#1F2937] border border-[#374151]"
                                }`}
                              >
                                {issue.status === "Resolved" ? "✓" : "3"}
                              </div>
                              <span
                                className={`text-[9px] font-bold mt-1 ${
                                  issue.status === "Resolved" ? "text-green-400" : "text-[#6B7280]"
                                }`}
                              >
                                Resolved
                              </span>
                            </div>
                          </div>
                        </div>

                        {issue.officerNote && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3 text-blue-300 text-xs leading-relaxed font-medium">
                            📋 Department Update: {issue.officerNote}
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-[#374151]/50 flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-semibold">
                            ⏳ Est. Resolution: {issue.estimated_resolution_days || 7} days
                          </span>
                          <div className="flex items-center gap-1 text-[#9CA3AF] font-medium">
                            <span>👍 {issue.upvotes || 0} Upvotes</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SEND MESSAGE TAB */}
            {activeTab === "Send Message" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Send Message</h1>
                  <p className="text-[#9CA3AF] text-sm mt-1">Direct support chat with municipal operators</p>
                </div>

                <div className="bg-[#111827] border border-[#374151] rounded-2xl overflow-hidden flex flex-col h-[500px]">
                  {/* Chat Header */}
                  <div className="bg-[#1F2937] px-6 py-4 border-b border-[#374151] flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-white font-semibold text-sm">Operator Chat Status: Online</span>
                  </div>

                  {/* Chat Body */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col justify-end">
                    {chatHistory.map((msg, index) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div
                          key={index}
                          className={`max-w-[70%] rounded-2xl p-4 text-sm leading-relaxed ${
                            isUser
                              ? "bg-blue-600 text-white self-end rounded-tr-none"
                              : "bg-[#1F2937] text-gray-200 self-start rounded-tl-none border border-[#374151]/50"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span className="text-[10px] text-gray-400 mt-2 block text-right">{msg.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-[#374151] bg-[#0A0F1E]/50 flex gap-3">
                    <input
                      type="text"
                      placeholder="Type your message here..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition text-sm shadow-md shadow-blue-500/10 cursor-pointer shrink-0"
                    >
                      Send
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
