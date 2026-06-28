import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyzeIssueImage } from "../lib/gemini";
import { useAuth } from "../context/AuthContext";
import { collection, addDoc, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function Report({ onViewReports }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, userProfile } = useAuth();
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
  
  // File and Analysis states
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  // Wizard states
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [reportedId, setReportedId] = useState(null);
  const [reportedTrackerId, setReportedTrackerId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Duplicate detection states
  const [duplicates, setDuplicates] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [toast, setToast] = useState("");

  const [formData, setFormData] = useState({
    category: "",
    severity: "",
    department: "",
    description: "",
    suggested_action: "",
    location: "",
    reporter: "",
    estimated_resolution_days: 7,
  });

  const loadingSteps = [
    "Gemini Vision initialized...",
    "Image received",
    "Detecting infrastructure damage...",
    "GPS metadata extracted",
    "Classifying issue...",
    "Severity calculated...",
    "Matching department...",
    "Analysis complete",
  ];

  // Animate the progress steps when analyzing — 700ms per step matching animation delays
  useEffect(() => {
    if (loading) {
      setLoadingStepIdx(0);
      const interval = setInterval(() => {
        setLoadingStepIdx((prev) => {
          if (prev < 7) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 700);
      return () => clearInterval(interval);
    }
  }, [loading]);


  const handleDivClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const extractVideoFrame = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      
      const objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;
      
      const cleanup = () => URL.revokeObjectURL(objectUrl);
      
      video.addEventListener('error', (e) => {
        cleanup();
        reject(new Error('Video load failed'));
      });
      
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(1, video.duration * 0.1);
      });
      
      video.addEventListener('seeked', () => {
        try {
          canvas.width = Math.min(video.videoWidth, 1280);
          canvas.height = Math.min(video.videoHeight, 720);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          cleanup();
          if (base64 && base64.length > 100) {
            resolve(base64);
          } else {
            reject(new Error('Empty frame extracted'));
          }
        } catch (err) {
          cleanup();
          reject(err);
        }
      });
      
      video.load();
    });
  };

  const processFile = async (selectedFile) => {
    setFile(selectedFile);
    setError("");
    setLoading(true);
    setCurrentStep(2); // Transition to Step 2 immediately on selection

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File is too large. Max size is 50MB.");
      setCurrentStep(1);
      setLoading(false);
      return;
    }

    try {
      let base64Data, mimeType;
      
      if (selectedFile.type.startsWith('video/')) {
        const videoUrl = URL.createObjectURL(selectedFile);
        setPreview(videoUrl);
        
        try {
          base64Data = await extractVideoFrame(selectedFile);
          mimeType = 'image/jpeg';
          setThumbnail('data:image/jpeg;base64,' + base64Data);
        } catch (err) {
          console.error('Frame extraction failed:', err);
          // fallback - skip Gemini
          setAnalysis({
            is_valid_issue: true,
            category: "Other",
            severity: "Medium",
            description: "Video evidence uploaded by citizen.",
            department: "BMC General", 
            suggested_action: "Officer to review video and take appropriate action.",
            estimated_resolution_days: 7,
            estimated_days: 7,
            isVideoUpload: true
          });
          setFormData({
            category: "Other",
            severity: "Medium",
            department: "BMC General",
            description: "Video evidence uploaded by citizen.",
            suggested_action: "Officer to review video and take appropriate action.",
            location: "",
            reporter: "",
            estimated_resolution_days: 7,
          });
          setCurrentStep(3);
          setLoading(false);
          return;
        }
      } else {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        setPreview(dataUrl);
        mimeType = dataUrl.split(";")[0].split(":")[1];
        base64Data = dataUrl.split(",")[1];
      }

      // Call Gemini Analysis
      const result = await analyzeIssueImage(base64Data, mimeType);

      if (!result) {
        throw new Error("No response received from Gemini AI.");
      }

      // 1. Load ALL issues from Firestore 'issues' collection
      let allIssues = [];
      try {
        const querySnapshot = await getDocs(collection(db, "issues"));
        querySnapshot.forEach((doc) => {
          allIssues.push({ docId: doc.id, ...doc.data() });
        });
      } catch (dbErr) {
        console.error("Failed to load issues for duplicate check:", dbErr);
      }

      // 2. Check for duplicates
      const foundDuplicates = checkDuplicates(allIssues, result, "");
      if (foundDuplicates.length > 0) {
        setDuplicates(foundDuplicates);
        setShowWarning(true);
      } else {
        setDuplicates([]);
        setShowWarning(false);
      }

      setAnalysis(result);

      // Prefill form
      setFormData({
        category: result.category || "Other",
        severity: result.severity || "Medium",
        department: result.department || "Other",
        description: result.description || "",
        suggested_action: result.suggested_action || "",
        location: "", // Required to be entered by user
        reporter: "",
        estimated_resolution_days: result.estimated_resolution_days || 7,
      });
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze file. Please try again.");
      setCurrentStep(1); // Reset back to upload if error occurs
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith("image/") || droppedFile.type.startsWith("video/"))) {
      processFile(droppedFile);
    } else {
      setError("Please drop a valid image or video file.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFile(null);
    setPreview("");
    setThumbnail("");
    setLoading(false);
    setAnalysis(null);
    setError("");
    setSubmitted(false);
    setDuplicates([]);
    setShowWarning(false);
    setCurrentStep(1);
    setReportedId(null);
    setReportedTrackerId("");
    setFormData({
      category: "",
      severity: "",
      department: "",
      description: "",
      suggested_action: "",
      location: "",
      reporter: "",
      estimated_resolution_days: 7,
    });
  };

  const handleViewReports = () => {
    if (onViewReports) {
      onViewReports();
    } else {
      navigate("/citizen-dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.trim()) {
      alert("Location is required.");
      return;
    }

    if (!user) {
      alert("You must be logged in to submit an issue.");
      return;
    }

    setIsSaving(true);
    const id = Date.now();
    const generatedTrackerId = "CP-" + Math.floor(100000 + Math.random() * 900000);
    const newIssue = {
      ...formData,
      id: id,
      trackerId: generatedTrackerId,
      userId: user.uid,
      userEmail: user.email,
      reporterName: formData.reporter || userProfile?.name || "Anonymous",
      reporter: formData.reporter || userProfile?.name || "Anonymous",
      imagePreview: thumbnail || preview,
      upvotes: 0,
      status: "Pending",
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      department: formData.department,
      workPhotos: [],
      officerNote: "",
      estimatedDays: null,
      estimated_resolution_days: Number(formData.estimated_resolution_days),
    };

    try {
      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, "issues"), newIssue);

      // Find nearby citizens (same location) and notify them
      try {
        const querySnapshot = await getDocs(collection(db, "issues"));
        const uniqueEmails = new Set();
        querySnapshot.forEach((docSnap) => {
          const issueData = docSnap.data();
          if (
            issueData.location && 
            newIssue.location &&
            issueData.location.trim().toLowerCase() === newIssue.location.trim().toLowerCase() &&
            issueData.userEmail !== user.email
          ) {
            uniqueEmails.add(issueData.userEmail);
          }
        });

        for (const email of uniqueEmails) {
          await addDoc(collection(db, "notifications"), {
            id: Date.now(),
            issueId: docRef.id,
            message: `A ${newIssue.category} was reported near you at ${newIssue.location}. Can you verify it? Upload a photo to confirm.`,
            type: "verify",
            read: false,
            createdAt: new Date().toISOString(),
            userEmail: email
          });
        }
      } catch (notifyErr) {
        console.error("Failed to notify nearby citizens:", notifyErr);
      }

      // 2. Save to localStorage as fallback
      const stored = localStorage.getItem("civicpulse_issues");
      const issues = stored ? JSON.parse(stored) : [];
      issues.unshift(newIssue);
      localStorage.setItem("civicpulse_issues", JSON.stringify(issues));

      setReportedId(id);
      setReportedTrackerId(generatedTrackerId);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to save report:", err);
      alert("Failed to save report: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpvoteDuplicate = async () => {
    if (duplicates.length === 0) return;
    const mostRelevant = duplicates[0];
    try {
      if (mostRelevant.docId) {
        // increment upvote in Firestore
        const docRef = doc(db, "issues", mostRelevant.docId);
        await updateDoc(docRef, {
          upvotes: increment(1)
        });
      }

      // Update localStorage fallback
      const stored = localStorage.getItem("civicpulse_issues");
      if (stored) {
        const issues = JSON.parse(stored);
        const updated = issues.map(iss => {
          if (iss.id === mostRelevant.id) {
            return { ...iss, upvotes: (iss.upvotes || 0) + 1 };
          }
          return iss;
        });
        localStorage.setItem("civicpulse_issues", JSON.stringify(updated));
      }

      // Show success toast
      setToast("Upvoted existing report successfully!");
      setTimeout(() => setToast(""), 4000);

      // Reset form
      handleReset();
    } catch (err) {
      console.error("Failed to upvote duplicate:", err);
      alert("Failed to upvote report: " + err.message);
    }
  };

  // Severity color mappings
  const getSeverityColor = (sev) => {
    switch (sev) {
      case "Low":
        return "text-green-400 bg-green-500/10 border border-green-500/20";
      case "Medium":
        return "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20";
      case "High":
        return "text-orange-400 bg-orange-500/10 border border-orange-500/20";
      case "Critical":
        return "text-red-400 bg-red-500/10 border border-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border border-gray-500/20";
    }
  };

  const getSeverityBorderClass = (sev) => {
    switch (sev) {
      case "Low": return "border-l-4 border-l-green-500";
      case "Medium": return "border-l-4 border-l-yellow-500";
      case "High": return "border-l-4 border-l-orange-500";
      case "Critical": return "border-l-4 border-l-red-500";
      default: return "border-l-4 border-l-gray-500";
    }
  };

  return (
    <div className="pt-28 px-8 max-w-4xl mx-auto pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-10 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-semibold flex items-center gap-2 animate-bounce">
          <span>✅</span> {toast}
        </div>
      )}

      {/* SUCCESS STATE */}
      {submitted && (
        <div className={"flex flex-col items-center justify-center text-center " + t.bg + " min-h-[60vh] py-12 px-4 rounded-3xl border " + t.border + "/30"}>
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-5xl animate-bounce">✅</span>
          </div>
          <h2 className={`${t.text} font-black text-4xl mt-6`}>Issue Reported Successfully!</h2>
          <p className={`${t.muted} text-base mt-3 max-w-md mx-auto leading-relaxed`}>
            Your report has been logged. The community and municipal department have been notified.
          </p>
          {reportedTrackerId && (
            <div className={`mt-5 p-4 rounded-xl border ${t.border} ${t.surface2} flex flex-col items-center justify-center max-w-sm mx-auto`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-1">Your Tracker ID</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${t.text} select-all`}>{reportedTrackerId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reportedTrackerId);
                    setToast("Tracker ID copied to clipboard!");
                    setTimeout(() => setToast(""), 3000);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer"
                  title="Copy Tracker ID"
                >
                  📋 Copy
                </button>
              </div>
              <p className="text-[10px] text-[#6B7280] font-semibold mt-2 text-center">
                Keep this safe! Use it under "Track My Reports" to view this issue's live progress anonymously.
              </p>
            </div>
          )}
          {reportedId && (
            <p className="text-[#6B7280] text-[10px] mt-4 font-semibold uppercase tracking-wider">
              Internal ID: #{reportedId}
            </p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition duration-200 cursor-pointer text-center"
            >
              Report Another Issue
            </button>
            <button
              onClick={handleViewReports}
              className={`border ${t.border} hover:${t.surface2} ${t.text} font-semibold px-8 py-3 rounded-xl transition duration-200 cursor-pointer text-center`}
            >
              View My Reports
            </button>
          </div>
        </div>
      )}

      {!submitted && (
        <>
          {/* HEADER */}
          <div className="mb-8 text-center md:text-left">
            <h1 className={`text-3xl font-black ${t.text} tracking-tight`}>Report a Civic Issue</h1>
            <p className={`${t.muted} text-sm mt-2`}>
              AI will automatically analyze your photo and fill in the details
            </p>
          </div>

          {/* STEP INDICATOR */}
          <div className="flex items-center justify-center gap-0 mb-10 max-w-xl mx-auto select-none">
            {/* Step 1 */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                currentStep >= 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : `${t.surface2} border ${t.border} text-[#6B7280]`
              }`}>
                1
              </div>
              <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                currentStep === 1 ? t.text : t.muted
              }`}>
                Upload Photo
              </span>
            </div>

            {/* Connector 1-2 */}
            <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
              currentStep > 1 ? "bg-blue-600" : (isDark ? "bg-[#374151]" : "bg-[#C7D7F9]")
            }`} style={{ transform: "translateY(-10px)" }}></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                currentStep >= 2 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : `${t.surface2} border ${t.border} text-[#6B7280]`
              }`}>
                2
              </div>
              <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                currentStep === 2 ? t.text : t.muted
              }`}>
                AI Analysis
              </span>
            </div>

            {/* Connector 2-3 */}
            <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
              currentStep > 2 ? "bg-blue-600" : (isDark ? "bg-[#374151]" : "bg-[#C7D7F9]")
            }`} style={{ transform: "translateY(-10px)" }}></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                currentStep >= 3 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : `${t.surface2} border ${t.border} text-[#6B7280]`
              }`}>
                3
              </div>
              <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                currentStep === 3 ? t.text : t.muted
              }`}>
                Submit Report
              </span>
            </div>
          </div>

          {/* STEP 1: UPLOAD PHOTO */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div
                onClick={handleDivClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={"relative border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all duration-300 group " + (
                  isDragging 
                    ? "border-blue-500 bg-blue-500/5" 
                    : t.border + " hover:border-blue-500 " + t.surface + "/50 hover:bg-blue-500/3"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                
                {/* Camera and Video icon */}
                <div className={`w-20 h-20 mx-auto ${t.surface2} rounded-2xl flex items-center justify-center group-hover:bg-blue-500/10 transition duration-300`}>
                  <span className="text-4xl">📷 🎥</span>
                </div>

                <h3 className={`${t.text} font-bold text-2xl mt-6`}>Drop your photo or video here</h3>
                <p className={`${t.muted} mt-2`}>or click to browse files</p>
                <p className="text-[#6B7280] text-xs mt-3">Supports JPG, PNG, WEBP, MP4, MOV • Max 50MB</p>
                
                <button
                  type="button"
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl mt-6 font-medium group-hover:bg-blue-500 transition cursor-pointer inline-block"
                >
                  Browse Files
                </button>

                {error && <p className="text-red-400 text-sm mt-4 font-medium">{error}</p>}
              </div>

              {/* Photo tips row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${t.surface} rounded-xl p-4 border ${t.border} text-center`}>
                  <div className={`text-xs ${t.muted} font-bold`}>📸 Clear photo</div>
                  <div className="text-xs text-[#6B7280] mt-1 font-semibold">Good lighting</div>
                </div>
                <div className={`${t.surface} rounded-xl p-4 border ${t.border} text-center`}>
                  <div className={`text-xs ${t.muted} font-bold`}>📍 Show location</div>
                  <div className="text-xs text-[#6B7280] mt-1 font-semibold">Include surroundings</div>
                </div>
                <div className={`${t.surface} rounded-xl p-4 border ${t.border} text-center`}>
                  <div className={`text-xs ${t.muted} font-bold`}>🔍 Close up</div>
                  <div className="text-xs text-[#6B7280] mt-1 font-semibold">Show the issue clearly</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI ANALYSIS */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {preview && (
                file?.type?.startsWith("video/") ? (
                  <video src={preview} controls className="w-full h-64 rounded-2xl object-cover" />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className={"w-full h-72 object-cover rounded-2xl border " + t.border + "/50 shadow-lg"}
                  />
                )
              )}

              {/* ── PREMIUM AI ANALYSIS TERMINAL ─────────────────────────── */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`relative overflow-hidden rounded-2xl border mt-6 ${
                    isDark
                      ? "bg-[#060D1A] border-[#1E3A5F]"
                      : "bg-[#F0F7FF] border-[#BFDBFE]"
                  }`}
                >
                  {/* Scanning beam that sweeps top-to-bottom */}
                  <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] z-10 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(37,99,235,0.8), rgba(6,182,212,0.6), transparent)"
                    }}
                  />

                  {/* Corner grid decorations */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-2xl" />

                  <div className="relative z-20 p-6 md:p-8">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        {/* Pulsing AI orb */}
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <motion.div
                            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.1, 0.4] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-blue-500"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.2, 0.6] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }}
                            className="absolute inset-0 rounded-full bg-cyan-400"
                          />
                          <span className="relative text-lg z-10">🤖</span>
                        </div>
                        <div>
                          <div className={`font-black text-sm tracking-widest uppercase ${isDark ? "text-cyan-400" : "text-blue-600"}`}>
                            Gemini Vision AI
                          </div>
                          <div className={`text-xs font-semibold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            Neural analysis engine v2.0
                          </div>
                        </div>
                      </div>

                      {/* Live indicator */}
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ opacity: [1, 0.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-2.5 h-2.5 rounded-full bg-red-500"
                        />
                        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-red-400" : "text-red-500"}`}>
                          LIVE
                        </span>
                      </div>
                    </div>

                    {/* Terminal output area */}
                    <div className={`rounded-xl border font-mono text-xs p-4 space-y-2.5 ${
                      isDark
                        ? "bg-black/60 border-[#1E3A5F]"
                        : "bg-white/70 border-[#BFDBFE]"
                    }`}>
                      {/* Prompt line */}
                      <div className={`text-[10px] mb-3 font-semibold uppercase tracking-widest ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                        $ civicpulse --analyze --mode=deep_scan
                      </div>

                      {[
                        { emoji: "🤖", text: "Gemini Vision initialized...",          color: "text-cyan-400",   delay: 0    },
                        { emoji: "📷", text: "Image received",                        color: "text-blue-400",   delay: 0.7  },
                        { emoji: "🔍", text: "Detecting infrastructure damage...",    color: "text-purple-400", delay: 1.4  },
                        { emoji: "📍", text: "GPS metadata extracted",               color: "text-sky-400",    delay: 2.1  },
                        { emoji: "🧠", text: "Classifying issue...",                  color: "text-indigo-400", delay: 2.8  },
                        { emoji: "⚠️",  text: "Severity calculated...",               color: "text-amber-400",  delay: 3.5  },
                        { emoji: "🏛",  text: "Matching department...",               color: "text-green-400",  delay: 4.2  },
                        { emoji: "✅",  text: "Analysis complete",                   color: "text-emerald-400",delay: 4.9  },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: item.delay }}
                          className="flex items-center gap-2.5"
                        >
                          {/* Status dot */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: item.delay + 0.1, type: "spring", stiffness: 300 }}
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              i < 7 ? "bg-current opacity-70" : "bg-emerald-400"
                            } ${item.color}`}
                          />

                          {/* Emoji */}
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: item.delay + 0.05 }}
                            className="text-sm shrink-0"
                          >
                            {item.emoji}
                          </motion.span>

                          {/* Text with typewriter reveal */}
                          <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "auto", opacity: 1 }}
                            transition={{ duration: 0.5, delay: item.delay + 0.1 }}
                            className={`overflow-hidden whitespace-nowrap font-bold ${item.color}`}
                          >
                            {item.text}
                          </motion.span>

                          {/* Trailing cursor only on last visible step */}
                          {i === Math.min(loadingStepIdx, 7) && (
                            <motion.span
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.7, repeat: Infinity }}
                              className={`ml-1 font-black ${item.color}`}
                            >
                              █
                            </motion.span>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className={`mt-5 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(((loadingStepIdx + 1) / 8) * 100, 95)}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 relative"
                      >
                        <motion.div
                          animate={{ x: ["0%", "100%"] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />
                      </motion.div>
                    </div>
                    <div className={`flex justify-between mt-1.5 text-[10px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                      <span>Processing...</span>
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {Math.min(Math.round(((loadingStepIdx + 1) / 8) * 100), 95)}%
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              )}


              {/* ANALYSIS COMPLETE */}
              {!loading && analysis && (
                <div className="space-y-6">
                  {analysis.is_valid_issue ? (
                    <>
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 mt-6">
                        <h2 className="text-green-400 font-bold text-lg">✅ Gemini Analysis Complete</h2>
                        <p className={`${t.muted} text-sm mt-1`}>
                          AI has pre-filled the form below. Review and submit.
                        </p>
                      </div>

                      {/* 4 Result badges */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className={`${t.surface} rounded-xl p-3 border ${t.border} flex flex-col justify-between`}>
                          <span className="text-[#6B7280] text-xs uppercase tracking-wider font-bold">Category</span>
                          <span className="text-blue-400 font-semibold text-sm mt-1">{analysis.category}</span>
                        </div>
                        <div className={`${t.surface} rounded-xl p-3 border ${t.border} flex flex-col justify-between`}>
                          <span className="text-[#6B7280] text-xs uppercase tracking-wider font-bold">Severity</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 w-max ${getSeverityColor(analysis.severity)}`}>
                            {analysis.severity}
                          </span>
                        </div>
                        <div className={`${t.surface} rounded-xl p-3 border ${t.border} flex flex-col justify-between`}>
                          <span className="text-[#6B7280] text-xs uppercase tracking-wider font-bold">Department</span>
                          <span className="text-green-400 font-semibold text-sm mt-1">{analysis.department}</span>
                        </div>
                        <div className={`${t.surface} rounded-xl p-3 border ${t.border} flex flex-col justify-between`}>
                          <span className="text-[#6B7280] text-xs uppercase tracking-wider font-bold">Est. Resolution</span>
                          <span className="text-amber-400 font-semibold text-sm mt-1">{analysis.estimated_resolution_days} days</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setCurrentStep(3)}
                        className="bg-blue-600 hover:bg-blue-500 text-white w-full py-3 rounded-xl font-semibold mt-6 transition duration-200 cursor-pointer block text-center"
                      >
                        Continue to Form &rarr;
                      </button>
                    </>
                  ) : (
                    /* INVALID ISSUE STATE */
                    <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-2xl p-10 text-center">
                      <span className="text-4xl mb-3">⚠️</span>
                      <h2 className="text-red-400 font-semibold text-xl">Not a Civic Issue</h2>
                      <p className={`${t.muted} text-sm mt-3 max-w-md leading-relaxed`}>
                        This image doesn't appear to show a civic infrastructure problem. Please upload a photo of a pothole, water leak, broken streetlight, or similar issues.
                      </p>
                      <button
                        onClick={handleReset}
                        className={`mt-6 ${t.surface2} hover:${t.border.replace('border', 'bg')} ${t.text} border ${t.border} font-medium px-6 py-2.5 rounded-xl transition duration-200 cursor-pointer`}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SUBMIT FORM */}
          {currentStep === 3 && (
            showWarning ? (
              /* DUPLICATE WARNING SECTION */
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6 max-w-2xl mx-auto">
                <h2 className="text-amber-400 font-bold text-lg">⚠️ Similar Issues Already Reported</h2>
                <p className={`${t.muted} text-sm mt-1`}>
                  These existing reports match your issue. Consider upvoting them instead.
                </p>
                
                {/* Show duplicate cards (max 3) */}
                <div className="mt-4 space-y-3">
                  {duplicates.slice(0, 3).map((dup, idx) => (
                    <div key={idx} className={`${t.surface} rounded-xl border ${t.border} p-4 flex gap-3`}>
                      {dup.imagePreview && (
                        <img
                          src={dup.imagePreview}
                          alt="Duplicate issue"
                          className={`w-16 h-16 object-cover rounded-lg shrink-0 border ${t.border}`}
                        />
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              {dup.category}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getSeverityColor(dup.severity)}`}>
                              {dup.severity}
                            </span>
                            <span className={`${t.surface2} ${t.muted} border ${t.border} text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                              {dup.status}
                            </span>
                          </div>
                          <p className={`${t.text} text-sm font-semibold mt-2`}>{dup.location || "Location Not Specified"}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`${t.muted} text-xs flex items-center gap-1 font-semibold`}>
                            👍 {dup.upvotes || 0}
                          </span>
                          <span className="text-[#6B7280] text-xs font-semibold">
                            Reported {getDaysAgo(dup.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Action buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleUpvoteDuplicate}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-6 py-3 transition duration-200 cursor-pointer"
                  >
                    Upvote Existing Report
                  </button>
                  <button
                    onClick={() => setShowWarning(false)}
                    className={`border ${t.border} ${t.text} rounded-xl px-6 py-3 hover:${t.surface2} transition duration-200 cursor-pointer`}
                  >
                    Report Anyway (Different Issue)
                  </button>
                </div>
              </div>
            ) : (
              /* TWO COLUMN LAYOUT */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* LEFT COLUMN: Sticky Preview & AI Summary */}
                <div className="w-full space-y-6 lg:sticky lg:top-24">
                  {preview && (
                    file?.type?.startsWith("video/") ? (
                      <video src={preview} controls className="w-full h-64 rounded-2xl object-cover" />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        className={"w-full h-56 object-cover rounded-2xl border " + t.border + "/50 shadow-md"}
                      />
                    )
                  )}

                  <div className={`${t.surface} rounded-2xl p-5 border ${t.border} shadow-lg`}>
                    <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                      AI Detection Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={t.bg + "/50 rounded-xl p-3 border " + t.border + "/40 flex flex-col justify-between"}>
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Category</span>
                        <span className="text-blue-400 font-semibold text-xs mt-1">{analysis.category}</span>
                      </div>
                      <div className={t.bg + "/50 rounded-xl p-3 border " + t.border + "/40 flex flex-col justify-between"}>
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Severity</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 w-max ${getSeverityColor(analysis.severity)}`}>
                          {analysis.severity}
                        </span>
                      </div>
                      <div className={t.bg + "/50 rounded-xl p-3 border " + t.border + "/40 flex flex-col justify-between"}>
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Department</span>
                        <span className="text-green-400 font-semibold text-xs mt-1">{analysis.department}</span>
                      </div>
                      <div className={t.bg + "/50 rounded-xl p-3 border " + t.border + "/40 flex flex-col justify-between"}>
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Est. Resolution</span>
                        <span className="text-amber-400 font-semibold text-xs mt-1">{analysis.estimated_resolution_days} days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Editable Form */}
                <div className={"w-full " + t.surface + "/40 rounded-2xl p-6 border " + t.border + "/30"}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className={`text-sm font-semibold mb-1.5 block ${t.muted}`}>
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`${t.surface2} border ${t.border} rounded-xl px-4 py-3 ${t.text} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition cursor-pointer`}
                        required
                      >
                        <option value="Pothole">Pothole</option>
                        <option value="Water Leak">Water Leak</option>
                        <option value="Broken Streetlight">Broken Streetlight</option>
                        <option value="Garbage Dumping">Garbage Dumping</option>
                        <option value="Damaged Road">Damaged Road</option>
                        <option value="Encroachment">Encroachment</option>
                        <option value="Flooding">Flooding</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={`text-sm font-semibold mb-1.5 block ${t.muted}`}>
                        Severity
                      </label>
                      <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleInputChange}
                        className={`${t.surface2} border ${t.border} rounded-xl px-4 py-3 ${t.text} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition cursor-pointer ${getSeverityBorderClass(formData.severity)}`}
                        required
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className={`text-sm font-semibold mb-1.5 block ${t.muted}`}>
                        Department
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className={`${t.surface2} border ${t.border} rounded-xl px-4 py-3 ${t.text} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition cursor-pointer`}
                        required
                      >
                        <option value="BMC">BMC (Brihanmumbai Municipal Corporation)</option>
                        <option value="MSEDCL">MSEDCL (Electricity Board)</option>
                        <option value="NMMC">NMMC (Navi Mumbai Municipal Corp.)</option>
                        <option value="PWD">PWD (Public Works Department)</option>
                        <option value="Traffic Police">Traffic Police</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={`text-sm font-semibold mb-1.5 block ${t.muted}`}>
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className={`${t.surface2} border ${t.border} rounded-xl px-4 py-3 ${t.text} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition resize-none`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`text-sm font-semibold mb-1.5 block ${t.muted}`}>
                        Suggested Action
                      </label>
                      <input
                        type="text"
                        name="suggested_action"
                        value={formData.suggested_action}
                        onChange={handleInputChange}
                        className={`${t.surface2} border ${t.border} rounded-xl px-4 py-3 ${t.text} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`text-sm font-semibold mb-1.5 block ${t.muted}`}>
                        Location Name *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-[#6B7280]">📍</span>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="e.g. Gokhale Road, Thane West"
                          className={`${t.surface2} border ${t.border} rounded-xl pl-10 pr-4 py-3 ${t.text} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-sm font-semibold mb-1.5 block ${t.muted}`}>
                        Reporter Name
                      </label>
                      <input
                        type="text"
                        name="reporter"
                        value={formData.reporter}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className={`${t.surface2} border ${t.border} rounded-xl px-4 py-3 ${t.text} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition`}
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSaving}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 w-full py-4 rounded-2xl font-bold text-white text-lg mt-8 shadow-[0_0_30px_rgba(59,130,246,0.4)] transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Report &rarr;</span>
                      )}
                    </motion.button>
                  </form>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function checkDuplicates(allIssues, newAnalysis, locationInput) {
  return allIssues.filter(issue => {
    if (issue.status === 'Resolved') return false;
    const sameCategory = issue.category === newAnalysis.category;
    const locationMatch = locationInput && issue.location && 
      (issue.location.toLowerCase().includes(locationInput.toLowerCase()) ||
       locationInput.toLowerCase().includes(issue.location.toLowerCase()));
    
    // check if 3+ words match in description
    let descriptionMatch = false;
    if (issue.description && newAnalysis.description) {
      const cleanWords = (text) => text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2);
      const words1 = cleanWords(issue.description);
      const words2 = cleanWords(newAnalysis.description);
      const set2 = new Set(words2);
      const common = words1.filter(w => set2.has(w));
      descriptionMatch = common.length >= 3;
    }
    
    return sameCategory && (locationMatch || descriptionMatch);
  });
}

function getDaysAgo(dateStr) {
  if (!dateStr) return "recently";
  const dateVal = new Date(dateStr);
  const today = new Date();
  const diffTime = Math.abs(today - dateVal);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
// Force HMR reload comment

