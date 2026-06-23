import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { analyzeIssueImage } from "../lib/gemini";
import { useAuth } from "../context/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Report() {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
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

    const newIssue = {
      id: Date.now(),
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

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to save report:", err);
      alert("Failed to save report: " + err.message);
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

  return (
    <div className="pt-28 px-8 max-w-4xl mx-auto pb-20">
      {!submitted && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Report an Issue</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Provide details of infrastructure problems in your area to notify local municipal authorities.
          </p>
        </div>
      )}

      {/* 1. SUCCESS STATE */}
      {submitted && (
        <div className="flex flex-col items-center justify-center text-center bg-green-500/10 border border-green-500/30 rounded-2xl p-12 mt-8">
          <span className="text-6xl mb-4">✅</span>
          <h2 className="text-white font-bold text-2xl">Issue Reported!</h2>
          <p className="text-[#9CA3AF] text-sm mt-2 max-w-md">
            Your report has been logged and the community has been notified. Live status can be tracked in the feed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200"
            >
              Report Another Issue
            </button>
            <Link
              to="/feed"
              className="border border-[#374151] hover:bg-[#1F2937] text-white font-semibold px-6 py-3 rounded-xl text-center transition duration-200"
            >
              View Live Feed
            </Link>
          </div>
        </div>
      )}

      {/* 2. UPLOAD AREA */}
      {!submitted && !file && !loading && !analysis && (
        <div
          onClick={handleDivClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#374151] hover:border-blue-500/50 rounded-2xl p-20 text-center cursor-pointer transition-all duration-300 group bg-[#111827]/50"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <span className="text-5xl mb-4 inline-block group-hover:scale-110 transition duration-300">📷</span>
          <h3 className="text-white font-semibold text-xl mt-2">Drop your photo here</h3>
          <p className="text-[#9CA3AF] text-sm mt-1">or click to browse</p>
          <p className="text-[#6B7280] text-xs mt-3">JPG, PNG, WEBP supported</p>
          {error && <p className="text-red-400 text-sm mt-4 font-medium">{error}</p>}
        </div>
      )}

      {/* 3. LOADING STATE */}
      {!submitted && file && loading && (
        <div className="flex flex-col items-center">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-2xl mb-8 border border-[#374151]"
            />
          )}
          <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mx-auto"></div>
          <h3 className="text-blue-400 font-medium mt-6 text-center">
            Gemini is analyzing your photo...
          </h3>
          <p className="text-[#9CA3AF] text-sm text-center mt-2 max-w-sm">
            Identifying issue type, severity, and responsible department
          </p>
        </div>
      )}

      {/* 4. INVALID ISSUE STATE */}
      {!submitted && !loading && analysis && !analysis.is_valid_issue && (
        <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-2xl p-10 text-center">
          <span className="text-4xl mb-3">⚠️</span>
          <h2 className="text-red-400 font-semibold text-xl">Not a Civic Issue</h2>
          <p className="text-[#9CA3AF] text-sm mt-3 max-w-md leading-relaxed">
            This image doesn't appear to show a civic infrastructure problem. Please upload a photo of a pothole, water leak, broken streetlight, or similar issues.
          </p>
          <button
            onClick={handleReset}
            className="mt-6 bg-[#1F2937] hover:bg-[#374151] text-white border border-[#374151] font-medium px-6 py-2.5 rounded-xl transition duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 5. ANALYSIS FORM */}
      {!submitted && !loading && analysis && analysis.is_valid_issue && (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column */}
          <div className="w-full md:w-1/3 flex flex-col">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl mb-4 border border-[#374151]"
              />
            )}

            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
                AI Detection Results
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="label text-[#6B7280] text-xs block">Category</span>
                  <span className="value text-white text-sm font-medium">{analysis.category}</span>
                </div>
                <div>
                  <span className="label text-[#6B7280] text-xs block">Severity</span>
                  <span
                    className={`value text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${getSeverityColor(
                      analysis.severity
                    )}`}
                  >
                    {analysis.severity}
                  </span>
                </div>
                <div>
                  <span className="label text-[#6B7280] text-xs block">Department</span>
                  <span className="value text-white text-sm font-medium">{analysis.department}</span>
                </div>
                <div>
                  <span className="label text-[#6B7280] text-xs block">Est. Resolution</span>
                  <span className="value text-white text-sm font-medium">
                    {analysis.estimated_resolution_days} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-2/3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-6 flex items-center gap-2">
              <span className="text-green-400 text-sm">
                ✅ AI Analysis Complete — Review and submit below
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[#9CA3AF] text-sm font-medium mb-1.5 block">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
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
                <label className="text-[#9CA3AF] text-sm font-medium mb-1.5 block">
                  Severity
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="text-[#9CA3AF] text-sm font-medium mb-1.5 block">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
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
                <label className="text-[#9CA3AF] text-sm font-medium mb-1.5 block">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-[#9CA3AF] text-sm font-medium mb-1.5 block">
                  Suggested Action
                </label>
                <input
                  type="text"
                  name="suggested_action"
                  value={formData.suggested_action}
                  onChange={handleInputChange}
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-[#9CA3AF] text-sm font-medium mb-1.5 block">
                  Location Name *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Gokhale Road, Thane West"
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-[#9CA3AF] text-sm font-medium mb-1.5 block">
                  Reporter Name
                </label>
                <input
                  type="text"
                  name="reporter"
                  value={formData.reporter}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/3 bg-[#1F2937] hover:bg-[#374151] text-[#9CA3AF] hover:text-white font-semibold py-3 rounded-xl transition text-sm border border-[#374151]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-blue-500/20"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
