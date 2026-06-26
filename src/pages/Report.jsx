import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyzeIssueImage } from "../lib/gemini";
import { useAuth } from "../context/AuthContext";
import { collection, addDoc, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "framer-motion";

export default function Report({ onViewReports }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  
  // File and Analysis states
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  // Wizard states
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [reportedId, setReportedId] = useState(null);
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
    "Uploading image to Gemini Vision...",
    "Identifying issue type and category...",
    "Assessing severity level...",
    "Determining responsible department...",
    "Generating action recommendations...",
    "Checking for duplicate reports..."
  ];

  // Animate the progress steps when analyzing
  useEffect(() => {
    if (loading) {
      setLoadingStepIdx(0);
      const interval = setInterval(() => {
        setLoadingStepIdx((prev) => {
          if (prev < 5) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 800);
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

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setError("");
    setLoading(true);
    setCurrentStep(2); // Transition to Step 2 immediately on selection

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);

      try {
        const mimeType = dataUrl.split(";")[0].split(":")[1];
        const base64Data = dataUrl.split(",")[1];

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
        setError(err.message || "Failed to analyze image. Please try again.");
        setCurrentStep(1); // Reset back to upload if error occurs
      } finally {
        setLoading(false);
      }
    };
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
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      processFile(droppedFile);
    } else {
      setError("Please drop a valid image file.");
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
    setLoading(false);
    setAnalysis(null);
    setError("");
    setSubmitted(false);
    setDuplicates([]);
    setShowWarning(false);
    setCurrentStep(1);
    setReportedId(null);
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
    const newIssue = {
      id: id,
      category: formData.category,
      severity: formData.severity,
      department: formData.department,
      description: formData.description,
      suggested_action: formData.suggested_action,
      location: formData.location,
      reporter: formData.reporter || "Anonymous",
      imagePreview: preview,
      status: "Pending",
      upvotes: 0,
      date: new Date().toISOString().split("T")[0],
      estimated_resolution_days: Number(formData.estimated_resolution_days),
      userId: user.uid,
      userEmail: user.email,
    };

    try {
      // 1. Save to Firestore
      await addDoc(collection(db, "issues"), newIssue);

      // 2. Save to localStorage as fallback
      const stored = localStorage.getItem("civicpulse_issues");
      const issues = stored ? JSON.parse(stored) : [];
      issues.unshift(newIssue);
      localStorage.setItem("civicpulse_issues", JSON.stringify(issues));

      setReportedId(id);
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
        <div className="flex flex-col items-center justify-center text-center bg-[#0A0F1E] min-h-[60vh] py-12 px-4 rounded-3xl border border-[#374151]/30">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-5xl animate-bounce">✅</span>
          </div>
          <h2 className="text-white font-black text-4xl mt-6">Issue Reported Successfully!</h2>
          <p className="text-[#9CA3AF] text-base mt-3 max-w-md mx-auto leading-relaxed">
            Your report has been logged. The community and municipal department have been notified.
          </p>
          {reportedId && (
            <p className="text-[#6B7280] text-sm mt-4 font-semibold uppercase tracking-wider">
              Report ID: #{reportedId}
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
              className="border border-[#374151] hover:bg-[#1F2937] text-white font-semibold px-8 py-3 rounded-xl transition duration-200 cursor-pointer text-center"
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
            <h1 className="text-3xl font-black text-white tracking-tight">Report a Civic Issue</h1>
            <p className="text-[#9CA3AF] text-sm mt-2">
              AI will automatically analyze your photo and fill in the details
            </p>
          </div>

          {/* STEP INDICATOR */}
          <div className="flex items-center justify-center gap-0 mb-10 max-w-xl mx-auto select-none">
            {/* Step 1 */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                currentStep >= 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-[#1F2937] border border-[#374151] text-[#6B7280]"
              }`}>
                1
              </div>
              <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                currentStep === 1 ? "text-white" : "text-[#9CA3AF]"
              }`}>
                Upload Photo
              </span>
            </div>

            {/* Connector 1-2 */}
            <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
              currentStep > 1 ? "bg-blue-600" : "bg-[#374151]"
            }`} style={{ transform: "translateY(-10px)" }}></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                currentStep >= 2 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-[#1F2937] border border-[#374151] text-[#6B7280]"
              }`}>
                2
              </div>
              <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                currentStep === 2 ? "text-white" : "text-[#9CA3AF]"
              }`}>
                AI Analysis
              </span>
            </div>

            {/* Connector 2-3 */}
            <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
              currentStep > 2 ? "bg-blue-600" : "bg-[#374151]"
            }`} style={{ transform: "translateY(-10px)" }}></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                currentStep >= 3 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-[#1F2937] border border-[#374151] text-[#6B7280]"
              }`}>
                3
              </div>
              <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                currentStep === 3 ? "text-white" : "text-[#9CA3AF]"
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
                className={`relative border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all duration-300 group ${
                  isDragging 
                    ? "border-blue-500 bg-blue-500/5" 
                    : "border-[#374151] hover:border-blue-500 bg-[#111827]/50 hover:bg-blue-500/3"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Camera icon */}
                <div className="w-20 h-20 mx-auto bg-[#1F2937] rounded-2xl flex items-center justify-center group-hover:bg-blue-500/10 transition duration-300">
                  <span className="text-4xl">📷</span>
                </div>

                <h3 className="text-white font-bold text-2xl mt-6">Drop your photo here</h3>
                <p className="text-[#9CA3AF] mt-2">or click to browse files</p>
                <p className="text-[#6B7280] text-xs mt-3">Supports JPG, PNG, WEBP • Max 10MB</p>
                
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
                <div className="bg-[#111827] rounded-xl p-4 border border-[#374151] text-center">
                  <div className="text-xs text-[#9CA3AF] font-bold">📸 Clear photo</div>
                  <div className="text-xs text-[#6B7280] mt-1 font-semibold">Good lighting</div>
                </div>
                <div className="bg-[#111827] rounded-xl p-4 border border-[#374151] text-center">
                  <div className="text-xs text-[#9CA3AF] font-bold">📍 Show location</div>
                  <div className="text-xs text-[#6B7280] mt-1 font-semibold">Include surroundings</div>
                </div>
                <div className="bg-[#111827] rounded-xl p-4 border border-[#374151] text-center">
                  <div className="text-xs text-[#9CA3AF] font-bold">🔍 Close up</div>
                  <div className="text-xs text-[#6B7280] mt-1 font-semibold">Show the issue clearly</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI ANALYSIS */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-72 object-cover rounded-2xl border border-[#374151]/50 shadow-lg"
                />
              )}

              {/* LOADING STATE */}
              {loading && (
                <div className="bg-[#111827] rounded-2xl border border-[#374151] p-8 text-center mt-6">
                  {/* Spinner container */}
                  <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center">
                    <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8"></div>
                  </div>
                  <h3 className="text-blue-400 font-bold mt-6 text-lg">
                    Gemini is analyzing your photo...
                  </h3>
                  <p className="text-[#9CA3AF] text-sm mt-1 max-w-sm mx-auto font-medium">
                    Identifying issue type, severity, and responsible department
                  </p>

                  {/* Progress steps (800ms delays) */}
                  <div className="mt-8 text-left max-w-md mx-auto space-y-3.5 border-t border-[#374151]/50 pt-6">
                    {loadingSteps.map((step, idx) => {
                      let icon = "○";
                      let colorClass = "text-[#6B7280]";
                      
                      if (idx < loadingStepIdx) {
                        icon = "✓";
                        colorClass = "text-green-400 font-bold";
                      } else if (idx === loadingStepIdx) {
                        icon = "...";
                        colorClass = "text-blue-400 animate-pulse font-bold";
                      }
                      
                      return (
                        <div key={idx} className={`flex items-center gap-3 text-sm transition-colors duration-300 ${colorClass}`}>
                          <span className="w-6 text-center select-none font-bold">{icon}</span>
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ANALYSIS COMPLETE */}
              {!loading && analysis && (
                <div className="space-y-6">
                  {analysis.is_valid_issue ? (
                    <>
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 mt-6">
                        <h2 className="text-green-400 font-bold text-lg">✅ Gemini Analysis Complete</h2>
                        <p className="text-[#9CA3AF] text-sm mt-1">
                          AI has pre-filled the form below. Review and submit.
                        </p>
                      </div>

                      {/* 4 Result badges */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[#111827] rounded-xl p-3 border border-[#374151] flex flex-col justify-between">
                          <span className="text-[#6B7280] text-xs uppercase tracking-wider font-bold">Category</span>
                          <span className="text-blue-400 font-semibold text-sm mt-1">{analysis.category}</span>
                        </div>
                        <div className="bg-[#111827] rounded-xl p-3 border border-[#374151] flex flex-col justify-between">
                          <span className="text-[#6B7280] text-xs uppercase tracking-wider font-bold">Severity</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 w-max ${getSeverityColor(analysis.severity)}`}>
                            {analysis.severity}
                          </span>
                        </div>
                        <div className="bg-[#111827] rounded-xl p-3 border border-[#374151] flex flex-col justify-between">
                          <span className="text-[#6B7280] text-xs uppercase tracking-wider font-bold">Department</span>
                          <span className="text-green-400 font-semibold text-sm mt-1">{analysis.department}</span>
                        </div>
                        <div className="bg-[#111827] rounded-xl p-3 border border-[#374151] flex flex-col justify-between">
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
                      <p className="text-[#9CA3AF] text-sm mt-3 max-w-md leading-relaxed">
                        This image doesn't appear to show a civic infrastructure problem. Please upload a photo of a pothole, water leak, broken streetlight, or similar issues.
                      </p>
                      <button
                        onClick={handleReset}
                        className="mt-6 bg-[#1F2937] hover:bg-[#374151] text-white border border-[#374151] font-medium px-6 py-2.5 rounded-xl transition duration-200 cursor-pointer"
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
                <p className="text-[#9CA3AF] text-sm mt-1">
                  These existing reports match your issue. Consider upvoting them instead.
                </p>
                
                {/* Show duplicate cards (max 3) */}
                <div className="mt-4 space-y-3">
                  {duplicates.slice(0, 3).map((dup, idx) => (
                    <div key={idx} className="bg-[#111827] rounded-xl border border-[#374151] p-4 flex gap-3">
                      {dup.imagePreview && (
                        <img
                          src={dup.imagePreview}
                          alt="Duplicate issue"
                          className="w-16 h-16 object-cover rounded-lg shrink-0 border border-[#374151]"
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
                            <span className="bg-[#1F2937] text-[#9CA3AF] border border-[#374151] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              {dup.status}
                            </span>
                          </div>
                          <p className="text-white text-sm font-semibold mt-2">{dup.location || "Location Not Specified"}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[#9CA3AF] text-xs flex items-center gap-1 font-semibold">
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
                    className="border border-[#374151] text-white rounded-xl px-6 py-3 hover:bg-[#1F2937] transition duration-200 cursor-pointer"
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
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-56 object-cover rounded-2xl border border-[#374151]/50 shadow-md"
                    />
                  )}

                  <div className="bg-[#111827] rounded-2xl p-5 border border-[#374151] shadow-lg">
                    <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                      AI Detection Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0A0F1E]/50 rounded-xl p-3 border border-[#374151]/40 flex flex-col justify-between">
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Category</span>
                        <span className="text-blue-400 font-semibold text-xs mt-1">{analysis.category}</span>
                      </div>
                      <div className="bg-[#0A0F1E]/50 rounded-xl p-3 border border-[#374151]/40 flex flex-col justify-between">
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Severity</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 w-max ${getSeverityColor(analysis.severity)}`}>
                          {analysis.severity}
                        </span>
                      </div>
                      <div className="bg-[#0A0F1E]/50 rounded-xl p-3 border border-[#374151]/40 flex flex-col justify-between">
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Department</span>
                        <span className="text-green-400 font-semibold text-xs mt-1">{analysis.department}</span>
                      </div>
                      <div className="bg-[#0A0F1E]/50 rounded-xl p-3 border border-[#374151]/40 flex flex-col justify-between">
                        <span className="text-[#6B7280] text-[10px] uppercase tracking-wider font-bold">Est. Resolution</span>
                        <span className="text-amber-400 font-semibold text-xs mt-1">{analysis.estimated_resolution_days} days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Editable Form */}
                <div className="w-full bg-[#111827]/40 rounded-2xl p-6 border border-[#374151]/30">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-[#9CA3AF] text-sm font-semibold mb-1.5 block">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition cursor-pointer"
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
                      <label className="text-[#9CA3AF] text-sm font-semibold mb-1.5 block">
                        Severity
                      </label>
                      <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleInputChange}
                        className={`bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition cursor-pointer ${getSeverityBorderClass(formData.severity)}`}
                        required
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[#9CA3AF] text-sm font-semibold mb-1.5 block">
                        Department
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition cursor-pointer"
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
                      <label className="text-[#9CA3AF] text-sm font-semibold mb-1.5 block">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[#9CA3AF] text-sm font-semibold mb-1.5 block">
                        Suggested Action
                      </label>
                      <input
                        type="text"
                        name="suggested_action"
                        value={formData.suggested_action}
                        onChange={handleInputChange}
                        className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[#9CA3AF] text-sm font-semibold mb-1.5 block">
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
                          className="bg-[#1F2937] border border-[#374151] rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[#9CA3AF] text-sm font-semibold mb-1.5 block">
                        Reporter Name
                      </label>
                      <input
                        type="text"
                        name="reporter"
                        value={formData.reporter}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className="bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-full text-sm transition"
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
