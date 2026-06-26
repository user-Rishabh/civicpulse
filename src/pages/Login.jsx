import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState("citizen");
  const [officerCode, setOfficerCode] = useState("");
  const [department, setDepartment] = useState("BMC");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTabChange = (loginTab) => {
    setIsLoginTab(loginTab);
    setError("");
    setRole("citizen");
    setOfficerCode("");
    setDepartment("BMC");
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      // Simplify Firebase error messages
      let message = "Invalid email or password.";
      if (err.code === "auth/invalid-credential") {
        message = "Incorrect email or password.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/user-disabled") {
        message = "This user account has been disabled.";
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    if (role === "officer" && officerCode !== "CIVIC2026") {
      setError("Invalid officer code");
      return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.fullName,
      });

      // Save user to Firestore 'users' collection
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.fullName,
        role: role,
        ...(role === "officer" ? { department } : {}),
        createdAt: new Date().toISOString(),
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      let message = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        message = "Password is too weak. Make it at least 6 characters.";
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0A0F1E] min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#111827] rounded-2xl border border-[#374151] p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-blue-400 font-bold text-2xl tracking-tight block mb-2">
            ⚡ CivicPulse
          </span>
          <p className="text-[#9CA3AF] text-sm">
            {isLoginTab ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Tabs Toggle */}
        <div className="flex bg-[#1F2937] p-1 rounded-xl mb-8 border border-[#374151] select-none">
          <button
            onClick={() => handleTabChange(true)}
            className={`w-1/2 text-center py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isLoginTab
                ? "bg-blue-600 text-white rounded-lg shadow-md"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => handleTabChange(false)}
            className={`w-1/2 text-center py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
              !isLoginTab
                ? "bg-blue-600 text-white rounded-lg shadow-md"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3 mb-6 font-medium text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Forms */}
        {isLoginTab ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3.5 rounded-xl transition duration-200 text-base shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSignUpSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="text-[#9CA3AF] text-sm font-medium mb-3 block">
                I am signing up as:
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Citizen Card */}
                <div
                  onClick={() => {
                    setRole("citizen");
                    setError("");
                  }}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition duration-200 ${
                    role === "citizen"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[#374151] bg-[#111827] hover:border-gray-500"
                  }`}
                >
                  <div className="text-xl mb-1">👤</div>
                  <div className="text-white font-semibold text-sm">Citizen</div>
                  <div className="text-[#9CA3AF] text-[11px] mt-1 leading-normal">
                    Report and track civic issues in my neighborhood.
                  </div>
                </div>

                {/* Officer Card */}
                <div
                  onClick={() => {
                    setRole("officer");
                    setError("");
                  }}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition duration-200 ${
                    role === "officer"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[#374151] bg-[#111827] hover:border-gray-500"
                  }`}
                >
                  <div className="text-xl mb-1">🏛️</div>
                  <div className="text-white font-semibold text-sm">Municipal Officer</div>
                  <div className="text-[#9CA3AF] text-[11px] mt-1 leading-normal">
                    Manage and resolve reported issues for the city.
                  </div>
                </div>
              </div>
            </div>

            {/* Officer Authorization Code */}
            {role === "officer" && (
              <div>
                <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                  Officer Authorization Code
                </label>
                <input
                  type="password"
                  required
                  value={officerCode}
                  onChange={(e) => setOfficerCode(e.target.value)}
                  placeholder="Enter officer authorization code"
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
                />
              </div>
            )}

            {/* Officer Department Selection */}
            {role === "officer" && (
              <div>
                <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                  Assigned Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm cursor-pointer"
                >
                  <option value="BMC">BMC (Brihanmumbai Municipal Corporation)</option>
                  <option value="MSEDCL">MSEDCL (Electricity Board)</option>
                  <option value="NMMC">NMMC (Navi Mumbai Municipal Corp.)</option>
                  <option value="PWD">PWD (Public Works Department)</option>
                  <option value="Traffic Police">Traffic Police</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Min. 6 characters"
                className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="text-[#9CA3AF] text-sm font-medium mb-2 block">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3.5 rounded-xl transition duration-200 text-base shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
