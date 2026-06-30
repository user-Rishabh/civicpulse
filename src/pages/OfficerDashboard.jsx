import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc, arrayUnion, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { verifyInProgressImage, verifyResolvedImage, analyzeWorkPhoto } from "../lib/gemini";
import { sendStatusNotification, createInAppNotification } from "../lib/notifications";
import IssueMap from "../components/IssueMap";
import { useTheme } from "../context/ThemeContext";
import CityHealthScore from "../components/CityHealthScore";
import { motion, AnimatePresence } from "framer-motion";

// Particles for backdrop
function Particles() {
  const [items, setItems] = useState([]);
  const { isDark } = useTheme();

  useEffect(() => {
    setItems(
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 3
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: isDark ? "rgba(6, 182, 212, 0.3)" : "rgba(37, 99, 235, 0.2)",
            boxShadow: isDark ? "0 0 6px rgba(6, 182, 212, 0.5)" : "0 0 6px rgba(37, 99, 235, 0.25)"
          }}
        />
      ))}
    </div>
  );
}

// AI Neural Network Backdrop
function AINetwork() {
  const { isDark } = useTheme();
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.045] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="200" r="4" fill="#3b82f6" />
      <circle cx="300" cy="150" r="4.5" fill="#06b6d4" className="animate-ping" />
      <circle cx="500" cy="280" r="4.5" fill="#10b981" />
      <circle cx="700" cy="180" r="5" fill="#3b82f6" />
      <circle cx="900" cy="320" r="4" fill="#06b6d4" />
      
      <line x1="100" y1="200" x2="300" y2="150" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />
      <line x1="300" y1="150" x2="500" y2="280" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />
      <line x1="500" y1="280" x2="700" y2="180" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />
      <line x1="700" y1="180" x2="900" y2="320" stroke={isDark ? "#64748b" : "#cbd5e1"} strokeWidth="1" />

      <motion.circle
        cx="100" cy="200" r="3" fill={isDark ? "#67e8f9" : "#2563eb"}
        animate={{
          cx: [100, 300, 500, 700, 900],
          cy: [200, 150, 280, 180, 320]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

// Curved data flow path guides
function DataFlowParticles() {
  const { isDark } = useTheme();
  return (
    <svg className="absolute top-[25%] left-0 w-full h-[50%] opacity-[0.035] pointer-events-none z-0" viewBox="0 0 1000 400">
      <path id="curve-path-1" d="M -50,200 C 250,50 450,350 1050,200" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <motion.circle r="3.5" fill={isDark ? "#3b82f6" : "#2563eb"} style={{ offsetPath: "path('M -50,200 C 250,50 450,350 1050,200')" }}>
        <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" />
      </motion.circle>
      <motion.circle r="3" fill={isDark ? "#10b981" : "#14b8a6"} style={{ offsetPath: "path('M -50,200 C 250,50 450,350 1050,200')" }}>
        <animateMotion dur="15s" repeatCount="indefinite" begin="4s" rotate="auto" />
      </motion.circle>
    </svg>
  );
}

// 10-Layer AI Smart City Background Component
function LivingCityBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const transitionConfig = { duration: 0.9, ease: "easeInOut" };

  return (
    <motion.div 
      animate={{
        backgroundColor: isDark ? "#030712" : "#FFFFFF"
      }}
      transition={transitionConfig}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0"
    >
      {!isMobile && (
        <motion.div 
          animate={{ opacity: isDark ? 0.15 : 0.08 }}
          transition={transitionConfig}
          className="absolute inset-0 filter blur-[90px] z-0"
        >
          <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-600/35 animate-blob-1" />
          <div className="absolute bottom-[20%] right-[15%] w-[45vw] h-[45vw] rounded-full bg-purple-600/25 animate-blob-2" />
          <div className="absolute top-[45%] left-[45%] w-[35vw] h-[35vw] rounded-full bg-cyan-600/30 animate-blob-1" />
        </motion.div>
      )}

      <motion.div 
        animate={{
          opacity: isDark ? 0.06 : 0.045
        }}
        transition={transitionConfig}
        className={`absolute inset-0 z-0 ${isDark ? "hex-grid-bg" : "light-hex-grid"}`} 
      />

      <AINetwork />
      <DataFlowParticles />
      <Particles />

      <motion.div 
        animate={{ opacity: isDark ? 0.06 : 0.09 }}
        transition={transitionConfig}
        className="absolute inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-[50%] -left-[20%] w-[150%] h-[200%] bg-gradient-to-tr from-transparent via-cyan-500/30 to-transparent pointer-events-none animate-ray transform -rotate-12" />
      </motion.div>

      {!isMobile && (
        <div 
          className="absolute inset-0 z-[1] transition-opacity duration-300"
          style={{
            background: isDark
              ? `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, transparent 40%, rgba(3, 7, 18, 0.45) 85%)`
              : `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.03) 0%, transparent 60%)`
          }}
        />
      )}
    </motion.div>
  );
}

// 3D Card Hover Tilt Wrapper
function PremiumGlowCard({ children, className = "", hoverTilt = true }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useTheme();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const xVal = e.clientX - rect.left - width / 2;
    const yVal = e.clientY - rect.top - height / 2;

    const rotX = hoverTilt ? -(yVal / (height / 2)) * 10 : 0;
    const rotY = hoverTilt ? (xVal / (width / 2)) * 10 : 0;

    setRotateX(rotX);
    setRotateY(rotY);
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        y: isHovered ? -8 : 0,
        backgroundColor: isDark ? "rgba(17, 24, 39, 0.4)" : "rgba(255, 255, 255, 0.8)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(226, 232, 240, 0.8)",
        boxShadow: isDark 
          ? (isHovered ? "0 10px 40px rgba(59, 130, 246, 0.12)" : "0 4px 30px rgba(0, 0, 0, 0.4)") 
          : (isHovered ? "0 15px 35px rgba(37, 99, 235, 0.06)" : "0 8px 30px rgba(0, 0, 0, 0.03)")
      }}
      transition={{ 
        rotateX: { type: "spring", stiffness: 350, damping: 22 },
        rotateY: { type: "spring", stiffness: 350, damping: 22 },
        backgroundColor: { duration: 0.9, ease: "easeInOut" },
        borderColor: { duration: 0.9, ease: "easeInOut" },
        boxShadow: { duration: 0.9, ease: "easeInOut" }
      }}
      style={{ transformStyle: "preserve-3d" }}
      className={`premium-glow-card group relative p-6 flex flex-col justify-between border backdrop-blur-md rounded-2xl ${className}`}
    >
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: isDark 
            ? `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, rgba(37, 99, 235, 0.2), transparent 80%)`
            : `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, rgba(37, 99, 235, 0.08), transparent 80%)`
        }}
      />
      <div style={{ transform: "translateZ(25px)" }} className="w-full flex flex-col justify-between relative z-20">
        {children}
      </div>
    </motion.div>
  );
}

// CountUp Animation
function CountUp({ to, duration = 1.4 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (to === 0) {
      setCount(0);
      return;
    }
    const steps = 40;
    const inc = to / steps;
    let cur = 0;
    const delay = (duration * 1000) / steps;
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, to);
      setCount(Math.round(cur));
      if (cur >= to) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [to, duration]);

  return <span>{count}</span>;
}

// Custom Cursor Glow
function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const { isDark } = useTheme();

  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <div
      className="pointer-events-none fixed z-[9999] mix-blend-screen"
      style={{
        left: pos.x - 150,
        top: pos.y - 150,
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)",
        transition: "left 0.08s linear, top 0.08s linear"
      }}
    />
  );
}

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
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const toggleExplanation = (issueId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

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

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ docId: docSnap.id, ...docSnap.data() }));
      const officerNotifs = list.filter(n => n.userEmail === "officer");
      setNotifications(officerNotifs);
    }, (error) => {
      console.error("Failed to load officer notifications:", error);
    });
    return () => unsubscribe();
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

  const officerDepartment = userProfile?.department || "PWD";

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
  
  const getTimelineEvents = (createdAtStr) => {
    const baseTime = createdAtStr ? new Date(createdAtStr) : new Date();
    if (isNaN(baseTime.getTime())) return [];
    
    const formatTime = (date) => {
      const hrs = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${hrs}:${mins}`;
    };

    const t0 = new Date(baseTime.getTime());
    const t1 = new Date(baseTime.getTime() + 60000); // +1 min
    const t2 = new Date(baseTime.getTime() + 60000); // +1 min
    const t3 = new Date(baseTime.getTime() + 120000); // +2 min
    const t4 = new Date(baseTime.getTime() + 180000); // +3 min

    return [
      { time: formatTime(t0), label: 'Report Submitted', icon: '📝', color: 'text-blue-400 bg-blue-500/10 border border-blue-500/20' },
      { time: formatTime(t1), label: 'AI Classified Issue', icon: '🤖', color: 'text-purple-400 bg-purple-500/10 border border-purple-500/20' },
      { time: formatTime(t2), label: 'Department Assigned', icon: '🏢', color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
      { time: formatTime(t3), label: 'Priority Calculated', icon: '⚡', color: 'text-red-400 bg-red-500/10 border border-red-500/20' },
      { time: formatTime(t4), label: 'Officer Notified', icon: '🔔', color: 'text-green-400 bg-green-400/10 border border-green-400/20' },
    ];
  };

  const tabs = [
    { id: "Dashboard", label: "Dashboard" },
    { id: "priority", label: "AI Priority" },
    { id: "analyze", label: "Analyze Reports" },
    { id: "messages", label: "Messages" },
    { id: "submit", label: "Submit Review" },
    { id: "map", label: "Issue Map" },
  ];

  const tabIcons = {
    Dashboard: "⊞",
    priority: "🔥",
    analyze: "🔍",
    messages: "✉",
    submit: "✓",
    map: "🗺️",
  };

  // ── Officer AI Priority Agent ───────────────────────────────────────────
  const computeAIPriority = (issue, allIssues) => {
    const severity = issue.severity || 'Low';
    const status   = issue.status   || 'Pending';
    const verCount = issue.verificationCount || (issue.verifications || []).length || 0;
    const upvotes  = issue.upvotes  || 0;
    const isComVerified = issue.communityVerified || false;

    // Age in days
    let ageDays = 0;
    if (issue.date) {
      const parts = issue.date.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        ageDays = Math.max(0, Math.round((Date.now() - d.getTime()) / 86400000));
      }
    }

    // Severity weight
    const sevScore = { Critical: 40, High: 28, Medium: 16, Low: 8 }[severity] || 8;

    // Community verification bonus
    const cvScore = isComVerified ? 20 : Math.min(verCount * 5, 15);

    // Upvote score (logarithmic)
    const upvoteScore = Math.min(Math.floor(Math.log(upvotes + 1) * 5), 10);

    // Age urgency — older pending issues get higher score
    const ageScore = status === 'Pending' ? Math.min(ageDays * 2, 20) : Math.min(ageDays, 10);

    // Status penalty for already-resolved
    const statusPenalty = status === 'Resolved' ? 20 : 0;

    // Nearby sensitive location heuristic (keyword-based on location)
    const loc = (issue.location || '').toLowerCase();
    const sensitiveBonus = (loc.includes('school') || loc.includes('hospital') || loc.includes('clinic') || loc.includes('market')) ? 8 : 0;

    const score = Math.max(0, Math.min(100,
      sevScore + cvScore + upvoteScore + ageScore + sensitiveBonus - statusPenalty
    ));

    // Generate reasoning
    const reasons = [];
    if (severity === 'Critical') reasons.push('critical severity');
    if (isComVerified) reasons.push(`verified by ${verCount} citizens`);
    else if (verCount > 0) reasons.push(`${verCount} community verification${verCount > 1 ? 's' : ''}`);
    if (upvotes >= 5) reasons.push(`${upvotes} upvotes`);
    if (ageDays >= 3 && status === 'Pending') reasons.push(`${ageDays} days unresolved`);
    if (sensitiveBonus > 0) reasons.push('near sensitive location');

    const reasonText = reasons.length > 0
      ? `${severity} severity issue${reasons.length > 0 ? ' — ' + reasons.join(', ') : ''}.`
      : `${severity} severity issue awaiting resolution.`;

    const impact = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low';
    const suggestedDays = { Critical: 1, High: 3, Medium: 7, Low: 14 }[severity] || 7;

    return { score, reasoning: reasonText, impact, suggestedDays };
  };

  const rankedIssues = [...assignedIssues]
    .filter(i => i.status !== 'Resolved')
    .map(issue => ({ ...issue, _priority: computeAIPriority(issue, assignedIssues) }))
    .sort((a, b) => b._priority.score - a._priority.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{
        opacity: 1,
        y: 0,
        color: isDark ? "#F8FAFC" : "#0F172A",
        backgroundColor: isDark ? "#030712" : "#FFFFFF"
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen flex relative overflow-hidden"
    >
      {/* Subtle Noise Filter Backdrop Overlay */}
      <div className="noise-overlay" />

      {/* 10-Layer AI Smart City Background */}
      <LivingCityBackground />

      {/* Global Mouse Spotlight */}
      <CustomCursor />

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-5 right-5 bg-green-600 border border-green-500 text-white px-5 py-3 rounded-xl shadow-2xl z-50 text-sm font-semibold"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        animate={{
          backgroundColor: isDark ? "rgba(13, 17, 23, 0.9)" : "rgba(248, 250, 252, 0.95)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(226, 232, 240, 0.8)"
        }}
        transition={{ duration: 0.9 }}
        className="w-64 border-r h-screen fixed left-0 top-0 pt-20 flex flex-col z-30"
      >
        {/* App Logo */}
        <div className="text-blue-500 font-black text-xl px-6 mb-4 mt-4 tracking-wider flex items-center gap-2">
          <span>🛡️</span> CivicPulse
        </div>

        {/* Officer Info */}
        <div className={`px-4 pb-6 border-b ${borderSidebar} mt-2`}>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg"
            >
              {(userProfile?.name || "O")[0].toUpperCase()}
            </motion.div>
            <div className="min-w-0">
              <div className={`text-sm font-black ${textTheme} truncate`}>{userProfile?.name || "Officer"}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  {officerDepartment} Dept
                </span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 mt-6 px-3 space-y-1">
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
                className="relative group px-1"
              >
                <motion.div
                  whileHover={{ x: 6 }}
                  animate={{
                    backgroundColor: isActive ? "#2563eb" : "transparent"
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm font-semibold relative overflow-hidden ${
                    isActive
                      ? "text-white shadow-lg shadow-blue-500/20"
                      : `${isDark ? "text-slate-400 hover:text-white" : "text-[#475569] hover:text-[#0F172A]"} hover:bg-slate-200/50 dark:hover:bg-slate-800/50`
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite_linear]" />
                  )}

                  <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-blue-500 transition-transform duration-300 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`} />

                  <span className="text-base transition-transform duration-300 group-hover:rotate-12">
                    {tabIcons[tab.id] || "⊞"}
                  </span>
                  <span className="flex-1">{tab.label}</span>

                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </motion.div>
              </div>
            );
          })}
        </nav>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 pt-20 px-8 pb-20 min-w-0 relative z-10">
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

              const generateInsights = (issues) => {
                const categoryCount = {};
                issues.forEach(i => categoryCount[i.category] = (categoryCount[i.category] || 0) + 1);
                const topCategory = Object.entries(categoryCount).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Pothole';
                const pendingCount = issues.filter(i => i.status === 'Pending').length;
                const resolvedCount = issues.filter(i => i.status === 'Resolved').length;
                const resolutionRate = issues.length ? Math.round((resolvedCount/issues.length)*100) : 0;
                
                return [
                  {
                    icon: "📈",
                    color: "blue",
                    title: `${topCategory} is the most reported issue`,
                    desc: `${categoryCount[topCategory] || 0} reports — prioritize inspection in high-density areas`
                  },
                  {
                    icon: "⚠️", 
                    color: "red",
                    title: `${pendingCount} issues awaiting action`,
                    desc: pendingCount > 2 
                      ? "High backlog detected — consider deploying additional field teams"
                      : "Backlog under control — maintain current response rate"
                  },
                  {
                    icon: "🌧️",
                    color: "cyan",
                    title: "Monsoon season alert",
                    desc: "Historical data shows 3x increase in Pothole and Flooding reports June-September"
                  },
                  {
                    icon: "✅",
                    color: "green", 
                    title: `${resolutionRate}% resolution rate achieved`,
                    desc: resolutionRate >= 50 
                      ? "Above target — department performing well this month"
                      : "Below 50% target — escalation recommended to senior authorities"
                  }
                ];
              };

              const insights = generateInsights(assignedIssues);

              return (
                <div className="max-w-6xl mx-auto space-y-6">

                  {/* ── HEADER ── */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg shrink-0 shadow-lg shadow-blue-500/20"
                      >
                        ⚙️
                      </motion.div>
                      <div>
                        <h1 className={`text-2xl font-black ${textTheme}`}>Command Center Dashboard</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`${textMuted} text-xs font-semibold`}>{officerDepartment} Department Operations</span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-400 text-[10px] font-black uppercase tracking-wider">Operational</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      {/* Notification Bell */}
                      <div className="relative">
                        <motion.button
                          onClick={() => setNotifOpen(!notifOpen)}
                          animate={notifications.filter(n => !n.read).length > 0 ? {
                            scale: [1, 1.06, 1],
                            boxShadow: isDark
                              ? ["0 0 0 rgba(59, 130, 246, 0)", "0 0 10px rgba(59, 130, 246, 0.4)", "0 0 0 rgba(59, 130, 246, 0)"]
                              : ["0 0 0 rgba(59, 130, 246, 0)", "0 0 10px rgba(59, 130, 246, 0.25)", "0 0 0 rgba(59, 130, 246, 0)"]
                          } : {}}
                          transition={notifications.filter(n => !n.read).length > 0 ? {
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "easeInOut"
                          } : {}}
                          className={`relative w-10 h-10 flex items-center justify-center rounded-xl border transition cursor-pointer font-medium ${
                            isDark ? "bg-[#111827] border-[#374151] hover:border-blue-500/50" : "bg-white border-slate-200 hover:border-blue-500/40"
                          }`}
                        >
                          <span className="text-lg">🔔</span>
                          {notifications.filter(n => !n.read).length > 0 && (
                            <motion.span
                              key={notifications.filter(n => !n.read).length}
                              initial={{ scale: 0.5, y: -12 }}
                              animate={{ scale: 1, y: [0, -10, 0] }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow"
                            >
                              {notifications.filter(n => !n.read).length}
                            </motion.span>
                          )}
                        </motion.button>
                        <AnimatePresence>
                          {notifOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -15, scale: 0.95 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-2xl z-50 text-left border ${
                                isDark ? "bg-[#111827] border-[#374151]" : "bg-white border-slate-200"
                              }`}
                            >
                              <div className={`flex items-center justify-between mb-3 border-b pb-2 ${isDark ? "border-[#1F2937]" : "border-slate-100"}`}>
                                <span className={`font-bold text-sm ${textTheme}`}>Verification Alerts</span>
                                {notifications.filter(n => !n.read).length > 0 && (
                                  <button
                                    onClick={async () => {
                                      for (const n of notifications.filter(n => !n.read)) {
                                        await updateDoc(doc(db, "notifications", n.docId), { read: true });
                                      }
                                    }}
                                    className="text-blue-400 text-xs font-semibold hover:text-blue-300 cursor-pointer"
                                  >
                                    Mark all read
                                  </button>
                                )}
                              </div>
                              <div className="max-h-72 overflow-y-auto space-y-2">
                                {notifications.length === 0 ? (
                                  <p className={`text-xs text-center py-4 ${textMuted}`}>No notifications yet</p>
                                ) : (
                                  notifications.map(notif => (
                                    <div
                                      key={notif.docId}
                                      onClick={async () => {
                                        await updateDoc(doc(db, "notifications", notif.docId), { read: true });
                                      }}
                                      className={`rounded-xl p-3 cursor-pointer transition ${
                                        isDark ? "bg-[#1F2937] hover:bg-[#374151]/50" : "bg-slate-50 hover:bg-slate-100/70"
                                      } ${!notif.read ? 'border-l-4 border-blue-500' : ''}`}
                                    >
                                      <p className={`text-xs leading-relaxed ${textTheme}`}>{notif.message}</p>
                                      <p className={`text-[10px] mt-1 ${textSubtle}`}>
                                        {new Date(notif.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <div className={`text-sm font-black ${textTheme}`}>
                          {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className={`text-xs mt-0.5 ${textMuted}`}>
                          {liveTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <CityHealthScore />

                  {/* ── STATS CARDS ── */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { icon: '📋', label: 'Total Assigned', count: totalAssigned,    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   bar: 'bg-blue-500',   pct: 100 },
                      { icon: '⏳', label: 'Pending',        count: pendingCount,      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   bar: 'bg-amber-500',   pct: totalAssigned > 0 ? (pendingCount / totalAssigned) * 100 : 0 },
                      { icon: '⚡', label: 'In Progress',    count: inProgressCount,   color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',bar: 'bg-cyan-500', pct: totalAssigned > 0 ? (inProgressCount / totalAssigned) * 100 : 0 },
                      { icon: '✅', label: 'Resolved',       count: resolvedCount,     color: 'bg-green-500/10 text-green-400 border-green-500/20', bar: 'bg-green-500',  pct: totalAssigned > 0 ? (resolvedCount / totalAssigned) * 100 : 0 },
                    ].map(({ icon, label, count, color, bar, pct }) => (
                      <PremiumGlowCard key={label} className="p-4" hoverTilt={true}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border ${color} flex items-center justify-center text-lg shrink-0`}>{icon}</div>
                          <div className="min-w-0 text-left">
                            <div className={`text-2xl font-black ${textTheme} leading-none`}><CountUp to={count} /></div>
                            <div className={`text-xs mt-1 font-bold ${textMuted}`}>{label}</div>
                          </div>
                        </div>
                        <div className={`mt-3 rounded-full h-1 overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`${bar} h-1 rounded-full`}
                          />
                        </div>
                      </PremiumGlowCard>
                    ))}
                  </div>

                  {/* ── QUICK ACTIONS ── */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`border rounded-2xl p-4 flex items-center justify-between gap-3 text-left ${
                      isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0">
                          <span className="block w-2.5 h-2.5 bg-red-500 rounded-full" />
                          <span className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                        </div>
                        <div>
                          <div className={`font-black text-sm ${isDark ? "text-red-300" : "text-red-800"}`}>{pendingCount} Action{pendingCount !== 1 ? 's' : ''} Required</div>
                          <div className={`text-xs ${isDark ? "text-red-400/60" : "text-red-600/70"}`}>Awaiting officer review</div>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setActiveTab('submit'); setSubTab('Pending'); }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer shrink-0 shadow-lg shadow-red-500/15">
                        Review →
                      </motion.button>
                    </div>
                    <div className={`border rounded-2xl p-4 flex items-center justify-between gap-3 text-left ${
                      isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                          isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-600"
                        }`}>💬</div>
                        <div>
                          <div className={`font-black text-sm ${isDark ? "text-blue-300" : "text-blue-800"}`}>{allChats.length} Conversation{allChats.length !== 1 ? 's' : ''}</div>
                          <div className={`text-xs ${isDark ? "text-blue-400/60" : "text-blue-600/70"}`}>Messages from citizens</div>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('messages')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer shrink-0 shadow-lg shadow-blue-500/15">
                        Open →
                      </motion.button>
                    </div>
                  </div>

                  {/* ── BOTTOM GRID: Activity + Charts ── */}
                  <div className="grid grid-cols-5 gap-4">

                    {/* RECENT ACTIVITY (col-span-3) */}
                    <div className={`col-span-3 rounded-2xl border overflow-hidden ${
                      isDark ? "bg-[#111827]/80 border-white/5" : "bg-white/95 border-slate-200"
                    }`}>
                      <div className={`flex items-center justify-between px-4 py-3.5 border-b ${isDark ? "border-[#1F2937]" : "border-slate-100"}`}>
                        <span className={`text-sm font-black ${textTheme}`}>Recent Activities</span>
                        <span className={`text-xs font-bold ${textMuted}`}>{recentIssues.length} total</span>
                      </div>
                      <div className="divide-y divide-slate-800/40">
                        {recentIssues.length === 0 ? (
                          <div className={`px-4 py-10 text-center text-sm ${textMuted}`}>No activity yet.</div>
                        ) : (
                          recentIssues.map((issue, idx) => (
                            <div
                               key={issue.docId || issue.id}
                               className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-500/5 transition duration-200`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                                issue.status === 'Resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                                issue.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                              }`}>
                                {issue.status === 'Resolved' ? '✅' : issue.status === 'In Progress' ? '⚡' : '⏳'}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className={`text-sm font-bold truncate ${textTheme}`}>
                                  {issue.category} · {issue.location}
                                </div>
                                <div className={`text-xs truncate ${textSubtle}`}>{issue.userEmail || 'Anonymous'}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  issue.status === 'Resolved' ? 'bg-green-500/10 text-green-400' :
                                  issue.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>{issue.status}</span>
                                <div className={`text-[10px] font-bold ${textSubtle} mt-1`}>{issue.date || '—'}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN (col-span-2) */}
                    <div className="col-span-2 flex flex-col gap-4">
                      {/* Issue Breakdown */}
                      <div className={`rounded-2xl border p-4 text-left ${
                        isDark ? "bg-[#111827]/80 border-white/5" : "bg-white/95 border-slate-200"
                      }`}>
                        <div className={`text-sm font-black mb-4 ${textTheme}`}>Issue Breakdown</div>
                        <div className="space-y-3">
                          {categoryCounts.map(({ name, count }) => (
                            <div key={name} className="flex items-center gap-3">
                              <span className={`text-xs font-bold w-24 truncate shrink-0 ${textMuted}`}>{name}</span>
                              <div className={`flex-1 rounded-full h-1.5 overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${totalAssigned > 0 ? (count / totalAssigned) * 100 : 0}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="bg-blue-500 rounded-full h-1.5"
                                />
                              </div>
                              <span className={`text-xs font-black w-5 text-right shrink-0 ${textTheme}`}>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Predictive Insights */}
                      <div className={`rounded-2xl border p-4 text-left ${
                        isDark ? "bg-[#111827]/80 border-white/5" : "bg-white/95 border-slate-200"
                      }`}>
                        <div className={`text-sm font-black ${textTheme}`}>AI Predictive Insights</div>
                        <div className={`text-[10px] font-bold ${textMuted}`}>Based on current city trends</div>
                        <div className="mt-3 space-y-2">
                          {insights.map((insight, idx) => {
                            const colorStyle = {
                              blue: isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600",
                              red: isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600",
                              cyan: isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-cyan-50 border-cyan-200 text-cyan-600",
                              green: isDark ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-600",
                            }[insight.color] || "bg-gray-500/10 text-gray-400";

                            return (
                              <div key={idx} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${colorStyle}`}>
                                <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-black truncate">{insight.title}</div>
                                  <div className={`text-[10px] font-semibold mt-0.5 opacity-80`}>{insight.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}


            {/* ── AI PRIORITY TAB ── */}
            {activeTab === "priority" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-black ${textTheme} flex items-center gap-2`}>
                      <span>🔥</span> AI Priority Rankings
                    </h1>
                    <p className={`${textMuted} text-xs font-bold mt-1`}>
                      Issues ranked by AI score — severity, community verification, upvotes, age &amp; location
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-black uppercase tracking-wider">Agent Active</span>
                  </div>
                </div>

                {/* Community Verified summary */}
                {assignedIssues.filter(i => i.communityVerified).length > 0 && (
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isDark ? 'bg-amber-500/8 border-amber-500/25' : 'bg-amber-50 border-amber-200'}`}>
                    <span className="shield-pulse text-2xl">🛡</span>
                    <div>
                      <div className="text-amber-400 font-black text-sm">
                        {assignedIssues.filter(i => i.communityVerified).length} Community Verified Issues — Auto-escalated to Critical
                      </div>
                      <div className={`${textMuted} text-xs mt-0.5`}>These have been independently confirmed by 3+ citizens and are highest priority.</div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {rankedIssues.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center ${bgSurface} border ${borderTheme} rounded-2xl p-16 text-center`}>
                      <span className="text-5xl mb-3">🎉</span>
                      <h3 className={`${textTheme} font-bold text-lg`}>All issues resolved!</h3>
                      <p className={`${textMuted} text-sm mt-1`}>No pending or in-progress issues.</p>
                    </div>
                  ) : (
                    rankedIssues.map((issue, idx) => {
                      const p = issue._priority;
                      const verCount = issue.verificationCount || (issue.verifications || []).length || 0;
                      const verifiers = (issue.verifications || []).map(v => v.verifierName);
                      const isCritVerified = issue.communityVerified && issue.severity === 'Critical';

                      return (
                        <motion.div
                          key={issue.docId || issue.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                          className={`rounded-2xl border p-5 text-left ${
                            isCritVerified
                              ? (isDark ? 'bg-amber-500/5 border-amber-500/30 critical-verified-glow community-verified-card' : 'bg-amber-50 border-amber-300')
                              : issue.severity === 'Critical'
                              ? (isDark ? 'bg-[#111827] border-red-500/25' : 'bg-white border-red-200')
                              : (isDark ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200')
                          }`}
                        >
                          <div className="flex gap-4 items-start">
                            {/* Rank badge */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black shrink-0 priority-badge-in ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                              idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                              idx === 2 ? 'bg-orange-700/20 text-orange-600 border border-orange-700/30' :
                              isDark ? 'bg-[#1F2937] text-slate-400 border border-slate-700/50' : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>#{idx + 1}</div>

                            <img src={issue.imagePreview} alt="" className={`w-20 h-20 object-cover rounded-xl shrink-0 border ${borderTheme} hidden sm:block`} />

                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Title row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={getSeverityBadgeClass(issue.severity)}>{issue.severity}</span>
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-black uppercase tracking-wider">{issue.category}</span>
                                {issue.communityVerified && (
                                  <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 rounded-full px-2 py-0.5">
                                    <span className="shield-pulse text-xs">🛡</span>
                                    <span className="text-amber-400 text-[9px] font-black">Community Verified</span>
                                  </div>
                                )}
                              </div>

                              <p className={`${textTheme} text-sm font-semibold leading-relaxed`}>{issue.description}</p>
                              <p className={`${textMuted} text-xs`}>📍 {issue.location}</p>

                              {/* AI Metric row */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { icon: '⚡', label: 'AI Score', value: `${p.score}/100`, color: p.score >= 70 ? 'text-red-400' : p.score >= 45 ? 'text-amber-400' : 'text-blue-400' },
                                  { icon: '📈', label: 'Impact', value: p.impact, color: p.impact === 'High' ? 'text-red-400' : p.impact === 'Medium' ? 'text-amber-400' : 'text-green-400' },
                                  { icon: '👥', label: 'Verified', value: verCount > 0 ? `${verCount} citizens` : 'None', color: verCount >= 3 ? 'text-amber-400' : verCount > 0 ? 'text-blue-400' : textMuted },
                                  { icon: '⏱', label: 'Est. Fix', value: `${p.suggestedDays}d`, color: textMuted },
                                ].map(m => (
                                  <div key={m.label} className={`rounded-xl p-2.5 text-center ${isDark ? 'bg-[#1F2937]/80 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                                    <div className={`text-sm font-black ${m.color}`}>{m.icon} {m.value}</div>
                                    <div className={`text-[9px] font-bold ${textMuted} mt-0.5 uppercase tracking-wider`}>{m.label}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Why this score? Expandable section */}
                              <div className="text-left">
                                <button
                                  onClick={() => toggleExplanation(issue.id || issue.docId)}
                                  className="text-[11px] font-black text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none"
                                >
                                  <span>Why this score?</span>
                                  <motion.span
                                    animate={{ rotate: expandedExplanations[issue.id || issue.docId] ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="inline-block text-[8px]"
                                  >
                                    ▼
                                  </motion.span>
                                </button>

                                <AnimatePresence initial={false}>
                                  {expandedExplanations[issue.id || issue.docId] && (() => {
                                    // Calculations
                                    const severityPercent = { Critical: 100, High: 75, Medium: 50, Low: 25 }[issue.severity] || 25;
                                    const reportsPercent = Math.min((issue.upvotes || 0) * 15 + 10, 100);
                                    const verificationPercent = issue.communityVerified ? 100 : Math.min(verCount * 33.3, 100);
                                    
                                    const loc = (issue.location || '').toLowerCase();
                                    const isSensitiveLocation = (loc.includes('school') || loc.includes('hospital') || loc.includes('clinic') || loc.includes('market'));
                                    const locationPercent = isSensitiveLocation ? 100 : 60;
                                    
                                    const confidencePercent = issue.aiConfidence || issue.geminiConfidence || Math.min(98, Math.max(78, 85 + (issue.severity === 'Critical' ? 10 : 5) + (verCount * 2)));

                                    return (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                        animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden bg-slate-100/50 dark:bg-[#1F2937]/50 border border-slate-200/50 dark:border-white/5 rounded-xl p-3.5 space-y-2.5"
                                      >
                                        {/* Road damage severity */}
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                            <span className={textMuted}>Road damage severity</span>
                                            <span className={textTheme}>{issue.severity || 'Low'} ({severityPercent}%)</span>
                                          </div>
                                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${severityPercent}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className={`h-full rounded-full ${
                                                issue.severity === 'Critical' ? 'bg-red-500' :
                                                issue.severity === 'High' ? 'bg-orange-500' :
                                                issue.severity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                              }`}
                                            />
                                          </div>
                                        </div>

                                        {/* Citizen reports */}
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                            <span className={textMuted}>Citizen reports</span>
                                            <span className={textTheme}>{issue.upvotes || 0} upvote{issue.upvotes !== 1 ? 's' : ''} ({reportsPercent}%)</span>
                                          </div>
                                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${reportsPercent}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className="h-full rounded-full bg-blue-500"
                                            />
                                          </div>
                                        </div>

                                        {/* Community verification */}
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                            <span className={textMuted}>Community verification</span>
                                            <span className={textTheme}>
                                              {issue.communityVerified ? '🛡️ Verified' : `${verCount} confirmation${verCount !== 1 ? 's' : ''}`} ({Math.round(verificationPercent)}%)
                                            </span>
                                          </div>
                                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${verificationPercent}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className="h-full rounded-full bg-amber-500"
                                            />
                                          </div>
                                        </div>

                                        {/* Location importance */}
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                            <span className={textMuted}>Location importance</span>
                                            <span className={textTheme}>
                                              {isSensitiveLocation ? 'High Importance' : 'Standard Importance'} ({locationPercent}%)
                                            </span>
                                          </div>
                                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${locationPercent}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className="h-full rounded-full bg-emerald-500"
                                            />
                                          </div>
                                        </div>

                                        {/* Confidence percentage */}
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                            <span className={textMuted}>Confidence percentage</span>
                                            <span className={textTheme}>{confidencePercent}%</span>
                                          </div>
                                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${confidencePercent}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className="h-full rounded-full bg-cyan-500"
                                            />
                                          </div>
                                        </div>

                                        {/* AI Activity Timeline Section */}
                                        <div className="pt-3.5 border-t border-slate-200/50 dark:border-white/5">
                                          <div className={`text-[10px] font-black ${textMuted} uppercase tracking-wider mb-3`}>
                                            🤖 AI Processing Timeline
                                          </div>
                                          <motion.div
                                            variants={{
                                              hidden: { opacity: 0 },
                                              show: {
                                                opacity: 1,
                                                transition: {
                                                  staggerChildren: 0.12
                                                }
                                              }
                                            }}
                                            initial="hidden"
                                            animate="show"
                                            className="relative pl-5 space-y-4 before:absolute before:left-[9px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700"
                                          >
                                            {getTimelineEvents(issue.createdAt).map((event, idx) => (
                                              <motion.div
                                                key={idx}
                                                variants={{
                                                  hidden: { opacity: 0, x: -10 },
                                                  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
                                                }}
                                                className="flex items-center gap-3 relative text-left"
                                              >
                                                {/* Dot/Icon */}
                                                <div className={`absolute -left-5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] z-10 ${event.color}`}>
                                                  {event.icon}
                                                </div>
                                                
                                                {/* Time & Label */}
                                                <div className="flex items-baseline gap-2">
                                                  <span className={`text-[9px] font-black tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {event.time}
                                                  </span>
                                                  <span className={`text-[11px] font-bold ${textTheme}`}>
                                                    {event.label}
                                                  </span>
                                                </div>
                                              </motion.div>
                                            ))}
                                          </motion.div>
                                        </div>
                                      </motion.div>
                                    );
                                  })()}
                                </AnimatePresence>
                              </div>

                              {/* Dept + verifiers */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-700'}`}>
                                  🏢 {issue.department || 'PWD'}
                                </span>
                                {verifiers.length > 0 && (
                                  <span className={`text-[10px] font-semibold ${textMuted}`}>
                                    {verifiers.slice(0, 3).join(', ')}{verifiers.length > 3 ? ` +${verifiers.length - 3}` : ''}
                                  </span>
                                )}
                              </div>

                              {/* AI Reasoning */}
                              <div className={`ai-reasoning-text flex items-start gap-1.5 text-[11px] p-2.5 rounded-xl border ${
                                isDark ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-blue-50 border border-blue-100'
                              }`}>
                                <span className="shrink-0 mt-0.5">💡</span>
                                <span className={isDark ? 'text-blue-300/80' : 'text-blue-700'}>{p.reasoning}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 2. ANALYZE REPORTS TAB */}
            {activeTab === "analyze" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-left">
                  <h1 className={`text-2xl font-black ${textTheme}`}>Analyze Reports</h1>
                  <p className={`${textMuted} text-xs font-bold mt-1`}>
                    Verify reported civic issues assigned to {officerDepartment} department
                  </p>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 flex-wrap">
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map((f, i) => (
                    <motion.button
                      key={f}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className={`px-4 py-2 rounded-full text-xs font-black border transition cursor-pointer ${
                        f === 'All'
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                          : isDark
                          ? 'bg-[#111827] border-slate-700/60 text-slate-400 hover:border-blue-500/40 hover:text-blue-400'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {f}
                    </motion.button>
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
                    assignedIssues.map((issue, idx) => (
                      <motion.div
                        key={issue.docId || issue.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                      >
                        <PremiumGlowCard
                          className={`p-5 relative ${
                            issue.severity === 'Critical' ? 'border-l-4 border-l-red-500' :
                            issue.severity === 'High' ? 'border-l-4 border-l-orange-500' :
                            issue.severity === 'Medium' ? 'border-l-4 border-l-yellow-500' :
                            'border-l-4 border-l-green-500'
                          }`}
                        >
                        {/* TOP Section */}
                        <div className="flex gap-4 items-start text-left">
                          <img
                            src={issue.imagePreview}
                            alt=""
                            className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900 shadow-sm`}
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-black uppercase tracking-wider">
                                {issue.category}
                              </span>
                              <span className={getSeverityBadgeClass(issue.severity)}>
                                {issue.severity}
                              </span>
                              {issue.communityVerified && (
                                <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 rounded-full px-2 py-0.5">
                                  <span className="shield-pulse text-xs">🛡</span>
                                  <span className="text-amber-400 text-[9px] font-black">Verified</span>
                                  <span className="text-amber-400 text-[9px] font-black">{issue.verificationCount || (issue.verifications||[]).length}</span>
                                </div>
                              )}
                              {!issue.communityVerified && (issue.verificationCount || (issue.verifications||[]).length) > 0 && (
                                <span className="text-blue-400 text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                                  👥 {issue.verificationCount || (issue.verifications||[]).length} verif.
                                </span>
                              )}
                            </div>
                            <p className={`${textTheme} text-sm font-semibold leading-relaxed`}>
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] flex-wrap font-medium">
                              <span className={textMuted}>📍 {issue.location}</span>
                              <span className={textSubtle}>
                                Reporter: {issue.userEmail || "Anonymous"}
                              </span>
                              <span className={textSubtle}>Date: {issue.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI SUMMARY BOX */}
                        <div className={`rounded-xl p-4 mt-4 border text-left ${isDark ? "bg-[#070E1A]/60 border-cyan-500/15" : "bg-cyan-50/50 border-cyan-200"}`}>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className={`text-[9px] uppercase font-black ${textSubtle} tracking-widest`}>
                                Department
                              </div>
                              <div className="text-blue-400 text-xs font-black mt-1">
                                {issue.department || "PWD"}
                              </div>
                            </div>
                            <div>
                              <div className={`text-[9px] uppercase font-black ${textSubtle} tracking-widest`}>
                                Est. Resolution
                              </div>
                              <div className="text-amber-400 text-xs font-black mt-1">
                                {issue.estimatedDays !== undefined && issue.estimatedDays !== null
                                  ? `${issue.estimatedDays} Days`
                                  : "Not Set"}
                              </div>
                            </div>
                            <div>
                              <div className={`text-[9px] uppercase font-black ${textSubtle} tracking-widest`}>
                                AI Suggested Action
                              </div>
                              <div className={`${textMuted} text-[11px] font-semibold mt-1 leading-relaxed`}>
                                {issue.suggested_action || "None"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Row */}
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/40">
                          {/* Current Status read-only badge */}
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                              issue.status === "Resolved"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : issue.status === "In Progress"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {issue.status}
                          </span>

                          {/* Action Button or Conditional Badges */}
                          <div>
                            {issue.estimatedDays !== undefined && issue.estimatedDays !== null ? (
                              <span className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider">
                                Resolution set: {issue.estimatedDays} days
                              </span>
                            ) : issue.cannotResolveReason ? (
                              <span className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider">
                                Delayed: {issue.cannotResolveReason}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleExpand(issue.docId)}
                                className="border border-blue-500/50 text-blue-400 rounded-xl px-4 py-2 text-xs hover:bg-blue-500/10 transition cursor-pointer font-black bg-transparent"
                              >
                                {expandedIssueId === issue.docId ? "Cancel" : "Set Estimated Resolution"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Click-to-Expand Form */}
                        {expandedIssueId === issue.docId && (
                          <div className={`rounded-xl p-4 border mt-4 text-left ${isDark ? "bg-[#1C2533] border-[#374151]" : "bg-slate-50 border-slate-200"}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Option 1: Set Resolution Timeline */}
                              <div className={`border rounded-xl p-4 transition duration-200 flex flex-col justify-between ${
                                isDark ? "bg-[#111827] border-[#374151]" : "bg-white border-slate-200"
                              }`}>
                                <div className="space-y-3">
                                  <h4 className={`${textTheme} font-black text-sm`}>Set Resolution Timeline</h4>
                                  <p className={`${textMuted} text-xs font-medium`}>I can resolve this issue</p>
                                  <div>
                                    <label className={`${textMuted} text-[9px] uppercase font-black block mb-1 tracking-widest`}>
                                      Estimated days to resolve
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={estDays}
                                      onChange={(e) => setEstDays(e.target.value)}
                                      className={`border rounded-lg px-3 py-2 ${textTheme} w-24 text-xs focus:border-green-500 focus:outline-none ${
                                        isDark ? "bg-[#1F2937] border-[#374151]" : "bg-[#F8FAFC] border-slate-200"
                                      }`}
                                      placeholder="e.g. 5"
                                    />
                                  </div>
                                  <div>
                                    <label className={`${textMuted} text-[9px] uppercase font-black block mb-1 tracking-widest`}>
                                      Resolution plan
                                    </label>
                                    <textarea
                                      value={resolutionPlan}
                                      onChange={(e) => setResolutionPlan(e.target.value)}
                                      placeholder="Describe how you plan to resolve this..."
                                      className={`border rounded-lg px-3 py-2 ${textTheme} w-full text-xs resize-none focus:border-green-500 focus:outline-none ${
                                        isDark ? "bg-[#1F2937] border-[#374151]" : "bg-[#F8FAFC] border-slate-200"
                                      }`}
                                      rows={2}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleConfirmResolution(issue)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-lg px-4 py-2.5 mt-3 cursor-pointer transition w-full"
                                >
                                  Confirm &amp; Notify Citizen
                                </button>
                              </div>

                              {/* Option 2: Cannot Resolve Now */}
                              <div className={`border rounded-xl p-4 transition duration-200 flex flex-col justify-between ${
                                isDark ? "bg-[#111827] border-[#374151]" : "bg-white border-slate-200"
                              }`}>
                                <div className="space-y-3">
                                  <h4 className={`${textTheme} font-black text-sm`}>Cannot Resolve Now</h4>
                                  <p className={`${textMuted} text-xs font-medium`}>I cannot resolve this right now</p>
                                  <div>
                                    <label className={`${textMuted} text-[9px] uppercase font-black block mb-1 tracking-widest`}>
                                      Reason
                                    </label>
                                    <select
                                      value={cannotResolveReason}
                                      onChange={(e) => setCannotResolveReason(e.target.value)}
                                      className={`border rounded-lg px-3 py-2 ${textTheme} w-full text-xs focus:border-red-500 focus:outline-none cursor-pointer ${
                                        isDark ? "bg-[#1F2937] border-[#374151]" : "bg-[#F8FAFC] border-slate-200"
                                      }`}
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
                                    <label className={`${textMuted} text-[9px] uppercase font-black block mb-1 tracking-widest`}>
                                      Additional details
                                    </label>
                                    <textarea
                                      value={cannotResolveDetails}
                                      onChange={(e) => setCannotResolveDetails(e.target.value)}
                                      placeholder="Provide reasons, dependencies or delay details..."
                                      className={`border rounded-lg px-3 py-2 ${textTheme} w-full text-xs resize-none focus:border-red-500 focus:outline-none ${
                                        isDark ? "bg-[#1F2937] border-[#374151]" : "bg-[#F8FAFC] border-slate-200"
                                      }`}
                                      rows={2}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCannotResolve(issue)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg px-4 py-2.5 mt-3 cursor-pointer transition w-full"
                                >
                                  Submit &amp; Notify Citizen
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </PremiumGlowCard>
                    </motion.div>
                  ))
                  )}
                </div>
              </div>
            )}

            {/* 3. SUBMIT REVIEW TAB */}
            {activeTab === "submit" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-left">
                  <h1 className={`text-2xl font-black ${textTheme}`}>Submit Review</h1>
                  <p className={`${textMuted} text-xs font-bold mt-1`}>
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
                        className={`flex items-center gap-2 py-3 px-3 text-xs font-black cursor-pointer border-b-2 transition duration-200 ${
                          isActive
                            ? "border-blue-500 text-blue-500"
                            : `border-transparent ${textMuted} hover:text-white`
                        }`}
                      >
                        {tabName}
                        <span className={`${color} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tab content */}
                <div className="space-y-6 mt-4">
                  {subTab === "Pending" && (
                    <div className="space-y-4 text-left">
                      {assignedIssues.filter((i) => i.status === "Pending").length === 0 ? (
                        <div className={`border rounded-2xl p-16 text-center ${isDark ? "bg-[#111827]/80 border-white/5" : "bg-white/95 border-slate-200"} ${textMuted}`}>
                          No pending issues to upload work-started proof for.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "Pending")
                          .map((issue) => (
                            <PremiumGlowCard
                              key={issue.docId || issue.id}
                              className="p-5 flex flex-col gap-4"
                            >
                              {/* TOP details */}
                              <div className="flex gap-4 items-start">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900 shadow-sm`}
                                />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-black uppercase tracking-wider">
                                      {issue.category}
                                    </span>
                                    <span className={getSeverityBadgeClass(issue.severity)}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className={`${textTheme} text-sm font-semibold leading-relaxed`}>
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-[11px] flex-wrap font-medium">
                                    <span className={textMuted}>📍 {issue.location}</span>
                                    <span className={textSubtle}>
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* STEP 1 SECTION */}
                              <div className={`rounded-xl p-4 border space-y-3 ${isDark ? "bg-[#070E1A]/60 border-cyan-500/20" : "bg-blue-50/50 border-blue-200"}`}>
                                <div>
                                  <h3 className={`${textTheme} font-black text-xs uppercase tracking-widest`}>
                                    Step 1: Upload Work Started Photo
                                  </h3>
                                  <p className={`${textMuted} text-xs font-semibold mt-1`}>
                                    Upload a photo showing crew or work has officially commenced at the location
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
                                  className={`border-dashed border rounded-xl p-6 text-center transition duration-200 ${
                                    isDark ? "border-slate-700 bg-slate-800/40 hover:border-blue-500/50 hover:bg-slate-800/80" : "border-slate-200 bg-white hover:border-blue-500 hover:bg-slate-50"
                                  } ${
                                    submitLoading[issue.docId]
                                      ? "cursor-not-allowed opacity-50"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  <span className={`${textMuted} text-xs font-bold`}>
                                    {submitLoading[issue.docId]
                                      ? "Uploading to Gemini for verification..."
                                      : "📷 Click to upload and verify progress photo"}
                                  </span>
                                </div>

                                {/* Gemini Loading Spinner */}
                                {submitLoading[issue.docId] && (
                                  <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-black animate-pulse py-2">
                                    <div className="animate-spin border-2 border-blue-400 border-t-transparent rounded-full w-4 h-4" />
                                    <span>Gemini AI is analyzing road context and validating proof...</span>
                                  </div>
                                )}

                                {/* Error & Success States */}
                                {submitError[issue.docId] && (
                                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    ❌ Verification failed: {submitError[issue.docId]}
                                  </div>
                                )}
                                {submitSuccess[issue.docId] && (
                                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    ✅ {submitSuccess[issue.docId]}
                                  </div>
                                )}
                              </div>
                            </PremiumGlowCard>
                          ))
                      )}
                    </div>
                  )}

                  {subTab === "In Progress" && (
                    <div className="space-y-4 text-left">
                      {assignedIssues.filter((i) => i.status === "In Progress").length === 0 ? (
                        <div className={`border rounded-2xl p-16 text-center ${isDark ? "bg-[#111827]/80 border-white/5" : "bg-white/95 border-slate-200"} ${textMuted}`}>
                          No active in-progress issues.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "In Progress")
                          .map((issue) => (
                            <PremiumGlowCard
                              key={issue.docId || issue.id}
                              className="p-5 flex flex-col gap-4"
                            >
                              {/* TOP details */}
                              <div className="flex gap-4 items-start">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900 shadow-sm`}
                                />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-black uppercase tracking-wider">
                                      {issue.category}
                                    </span>
                                    <span className={getSeverityBadgeClass(issue.severity)}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className={`${textTheme} text-sm font-semibold leading-relaxed`}>
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-[11px] flex-wrap font-medium">
                                    <span className={textMuted}>📍 {issue.location}</span>
                                    <span className={textSubtle}>
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Show Step 1 completed */}
                              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 flex gap-4 items-start">
                                {issue.workPhotos?.[0] && (
                                  <img
                                    src={issue.workPhotos[0]}
                                    alt="Work Started"
                                    className="w-16 h-16 object-cover rounded-lg border border-green-500/20 shrink-0 bg-gray-900 shadow-sm"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className={`font-black text-xs ${textTheme}`}>
                                    Step 1 Complete - Work Started Photo Verified by Gemini
                                  </div>
                                  {issue.workStartedNote && (
                                    <div className="text-green-400 text-xs mt-1 font-semibold leading-relaxed italic">
                                      "{issue.workStartedNote}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* STEP 2 SECTION */}
                              <div className={`rounded-xl p-4 border space-y-3 ${isDark ? "bg-[#070E1A]/60 border-cyan-500/20" : "bg-cyan-50/50 border-cyan-200"}`}>
                                <div>
                                  <h3 className={`${textTheme} font-black text-xs uppercase tracking-widest`}>
                                    Step 2: Upload Completion Photo
                                  </h3>
                                  <p className={`${textMuted} text-xs font-semibold mt-1`}>
                                    Upload photo of the SAME location showing issue is fully resolved
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
                                  className={`border-dashed border rounded-xl p-6 text-center transition duration-200 ${
                                    isDark ? "border-slate-700 bg-slate-800/40 hover:border-blue-500/50 hover:bg-slate-800/80" : "border-slate-200 bg-white hover:border-blue-500 hover:bg-slate-50"
                                  } ${
                                    submitLoading[issue.docId]
                                      ? "cursor-not-allowed opacity-50"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  <span className={`${textMuted} text-xs font-bold`}>
                                    {submitLoading[issue.docId]
                                      ? "Uploading to Gemini for verification..."
                                      : "📷 Click to upload completion photo"}
                                  </span>
                                </div>

                                {/* Gemini Loading Spinner */}
                                {submitLoading[issue.docId] && (
                                  <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-black animate-pulse py-2">
                                    <div className="animate-spin border-2 border-blue-400 border-t-transparent rounded-full w-4 h-4" />
                                    <span>Gemini is verifying resolution context and building final report...</span>
                                  </div>
                                )}

                                {/* Error & Success States */}
                                {submitError[issue.docId] && (
                                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    ❌ Verification failed: {submitError[issue.docId]}
                                  </div>
                                )}
                                {submitSuccess[issue.docId] && (
                                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-3 text-xs font-semibold text-center mt-2">
                                    ✅ {submitSuccess[issue.docId]}
                                  </div>
                                )}
                              </div>
                            </PremiumGlowCard>
                          ))
                      )}
                    </div>
                  )}

                  {subTab === "Resolved" && (
                    <div className="space-y-4 text-left">
                      {assignedIssues.filter((i) => i.status === "Resolved").length === 0 ? (
                        <div className={`border rounded-2xl p-16 text-center ${isDark ? "bg-[#111827]/80 border-white/5" : "bg-white/95 border-slate-200"} ${textMuted}`}>
                          No resolved issues yet.
                        </div>
                      ) : (
                        assignedIssues
                          .filter((i) => i.status === "Resolved")
                          .map((issue) => (
                            <PremiumGlowCard
                              key={issue.docId || issue.id}
                              className="p-5 flex flex-col gap-4"
                            >
                              {/* TOP details */}
                              <div className="flex gap-4 items-start">
                                <img
                                  src={issue.imagePreview}
                                  alt=""
                                  className={`w-28 h-28 object-cover rounded-xl shrink-0 border ${borderTheme} bg-gray-900 shadow-sm`}
                                />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-md border border-blue-500/20 font-black uppercase tracking-wider">
                                      {issue.category}
                                    </span>
                                    <span className={getSeverityBadgeClass(issue.severity)}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className={`${textTheme} text-sm font-semibold leading-relaxed`}>
                                    {issue.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-[11px] flex-wrap font-medium">
                                    <span className={textMuted}>📍 {issue.location}</span>
                                    <span className={textSubtle}>
                                      Reporter: {issue.userEmail || "Anonymous"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Before & After section */}
                              <div className="mt-2">
                                <div className={`text-[10px] font-black uppercase tracking-widest ${textMuted} mb-3`}>Before &amp; After Comparison</div>
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Left: Before (Work Started) */}
                                  <div className={`rounded-xl p-3 border flex flex-col gap-2 ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                      <span className="text-xs font-black text-yellow-500 uppercase tracking-wider">Before</span>
                                    </div>
                                    {issue.workPhotos?.[0] ? (
                                      <img
                                        src={issue.workPhotos[0]}
                                        alt="Work Started Proof"
                                        className={`w-full h-36 object-cover rounded-xl border ${borderTheme} bg-gray-900`}
                                      />
                                    ) : (
                                      <div className="w-full h-36 bg-gray-900 rounded-xl border border-slate-800 flex items-center justify-center text-xs text-gray-500 font-bold">
                                        No Image Available
                                      </div>
                                    )}
                                    {issue.workStartedNote && (
                                      <div className={`text-xs ${textMuted} font-semibold leading-relaxed italic mt-1`}>
                                        "{issue.workStartedNote}"
                                      </div>
                                    )}
                                  </div>

                                  {/* Right: After (Completed) */}
                                  <div className={`rounded-xl p-3 border flex flex-col gap-2 ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                      <span className="text-xs font-black text-green-500 uppercase tracking-wider">After</span>
                                    </div>
                                    {issue.workPhotos?.[1] ? (
                                      <img
                                        src={issue.workPhotos[1]}
                                        alt="Completion Proof"
                                        className={`w-full h-36 object-cover rounded-xl border ${borderTheme} bg-gray-900`}
                                      />
                                    ) : (
                                      <div className="w-full h-36 bg-gray-900 rounded-xl border border-slate-800 flex items-center justify-center text-xs text-gray-500 font-bold">
                                        No Image Available
                                      </div>
                                    )}
                                    {issue.completionNote && (
                                      <div className={`text-xs ${textMuted} font-semibold leading-relaxed italic mt-1`}>
                                        "{issue.completionNote}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Resolved on Date */}
                              {issue.resolvedDate && (
                                <div className="text-green-400 text-xs font-black mt-2 uppercase tracking-wider">
                                  ✓ Fully Resolved on {issue.resolvedDate}
                                </div>
                              )}
                            </PremiumGlowCard>
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
              <div className="space-y-4">
                <div>
                  <h2 className={`text-2xl font-black ${textTheme} mb-1`}>Smart City Operations Center</h2>
                  <p className={`${textMuted} text-sm font-semibold`}>Live civic intelligence across the city — AI-powered heatmap, real-time markers & pulse tracking</p>
                </div>

                <IssueMap issues={issues} height="600px" />
              </div>
            )}

          </>
        )}
      </div>
    </motion.div>
  );
}
