import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="bg-[#0A0F1E] min-h-screen text-[#F9FAFB] flex relative overflow-hidden w-full"
    >
      {/* LEFT PANEL (hidden md:flex w-1/2 relative overflow-hidden) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900/50 via-[#0A0F1E] to-cyan-900/30 border-r border-[#374151] flex-col justify-center px-16">
        {/* Background orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <div className="text-blue-400 font-bold text-2xl mb-12 flex items-center gap-2">
            <span>⚡</span> CivicPulse
          </div>
          
          <h1 className="text-5xl font-black text-white leading-tight">
            Making Cities <br />
            Smarter, <br />
            One Report <br />
            at a Time.
          </h1>
          
          <div className="w-16 h-1 bg-blue-500 rounded mt-6"></div>
          
          <p className="text-[#9CA3AF] mt-6 text-lg max-w-sm leading-relaxed font-medium">
            Join citizens across Maharashtra reporting and resolving civic issues with the power of AI.
          </p>
          
          {/* Feature pills */}
          <div className="mt-12 flex flex-col gap-3">
            {[
              { icon: "🤖", text: "AI-powered issue analysis" },
              { icon: "📍", text: "Real-time location tracking" },
              { icon: "🔔", text: "Instant status notifications" }
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5 hover:bg-white/10 transition-colors duration-200 text-white text-sm font-semibold">
                <span className="text-lg">{feat.icon}</span>
                <span>{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (w-full md:w-1/2 flex items-center justify-center px-8 py-12) */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-[#0A0F1E] px-8 py-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="md:hidden flex justify-center mb-8">
            <span className="text-blue-400 font-bold text-xl tracking-tight flex items-center gap-1.5">
              <span>⚡</span> CivicPulse
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-black text-white">
            {isLoginTab ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-2 font-medium">
            {isLoginTab 
              ? "Enter your details to access your account" 
              : "Register to start making your neighborhood cleaner and safer"}
          </p>

          {/* Tabs */}
          <div className="flex bg-[#111827] rounded-2xl p-1 mt-8 border border-[#374151]/30">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabChange(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-center bg-transparent border-none outline-none"
              style={{
                backgroundColor: isLoginTab ? "#2563EB" : "transparent",
                color: isLoginTab ? "#FFFFFF" : "#9CA3AF",
              }}
            >
              Login
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabChange(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-center bg-transparent border-none outline-none"
              style={{
                backgroundColor: !isLoginTab ? "#2563EB" : "transparent",
                color: !isLoginTab ? "#FFFFFF" : "#9CA3AF",
              }}
            >
              Sign Up
            </motion.button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mt-4 font-medium text-center flex items-center justify-center gap-1.5 animate-pulse">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={isLoginTab ? handleLoginSubmit : handleSignUpSubmit} className="mt-8 space-y-5">
            {!isLoginTab && (
              // SIGNUP FULL NAME
              <div>
                <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full bg-[#111827] border border-[#374151] rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-sm placeholder text-[#4B5563]"
                />
              </div>
            )}

            <div>
              <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full bg-[#111827] border border-[#374151] rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-sm placeholder text-[#4B5563]"
              />
            </div>

            <div>
              <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-[#111827] border border-[#374151] rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-sm placeholder text-[#4B5563]"
              />
            </div>

            {!isLoginTab && (
              // CONFIRM PASSWORD FOR SIGNUP
              <>
                <div>
                  <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 block">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-[#111827] border border-[#374151] rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-sm placeholder text-[#4B5563]"
                  />
                </div>

                {/* SIGNUP ROLE CARDS */}
                <div className="mt-4">
                  <span className="text-[#9CA3AF] text-xs uppercase tracking-wider mb-3 block font-semibold">
                    I am a...
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Citizen Card */}
                    <div
                      onClick={() => {
                        setRole("citizen");
                        setError("");
                      }}
                      className={`bg-[#111827] border-2 rounded-2xl p-4 cursor-pointer text-center transition-all duration-200 flex flex-col items-center justify-center ${
                        role === "citizen"
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-[#374151] hover:border-[#6B7280]"
                      }`}
                    >
                      <span className="text-3xl">👤</span>
                      <span className="text-white font-semibold text-sm mt-2">Citizen</span>
                      <span className="text-[#9CA3AF] text-[11px] mt-1 leading-tight">
                        Report civic issues
                      </span>
                    </div>

                    {/* Municipal Officer Card */}
                    <div
                      onClick={() => {
                        setRole("officer");
                        setError("");
                      }}
                      className={`bg-[#111827] border-2 rounded-2xl p-4 cursor-pointer text-center transition-all duration-200 flex flex-col items-center justify-center ${
                        role === "officer"
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-[#374151] hover:border-[#6B7280]"
                      }`}
                    >
                      <span className="text-3xl">🏛️</span>
                      <span className="text-white font-semibold text-sm mt-2">Officer</span>
                      <span className="text-[#9CA3AF] text-[11px] mt-1 leading-tight">
                        Manage & resolve
                      </span>
                    </div>
                  </div>
                </div>

                {/* Officer Authorization Code and Department */}
                <AnimatePresence>
                  {role === "officer" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 pt-2 overflow-hidden"
                    >
                      <div>
                        <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 block">
                          Officer Authorization Code
                        </label>
                        <input
                          type="password"
                          required
                          value={officerCode}
                          onChange={(e) => setOfficerCode(e.target.value)}
                          placeholder="Enter officer authorization code"
                          className="w-full bg-[#111827] border border-[#374151] rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-sm placeholder text-[#4B5563]"
                        />
                      </div>

                      <div>
                        <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 block">
                          Assigned Department
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full bg-[#111827] border border-[#374151] rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-sm cursor-pointer"
                        >
                          <option value="BMC">BMC (Brihanmumbai Municipal Corporation)</option>
                          <option value="MSEDCL">MSEDCL (Electricity Board)</option>
                          <option value="NMMC">NMMC (Navi Mumbai Municipal Corp.)</option>
                          <option value="PWD">PWD (Public Works Department)</option>
                          <option value="Traffic Police">Traffic Police</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* SUBMIT BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>{isLoginTab ? "Signing In..." : "Creating Account..."}</span>
                </>
              ) : (
                <span>{isLoginTab ? "Sign In" : "Create Account"}</span>
              )}
            </motion.button>
          </form>

          {/* DIVIDER */}
          <div className="relative flex py-5 items-center mt-6 select-none">
            <div className="flex-grow border-t border-[#374151]/50"></div>
            <span className="flex-shrink mx-4 text-[#6B7280] text-xs font-semibold uppercase tracking-wider">
              or continue with
            </span>
            <div className="flex-grow border-t border-[#374151]/50"></div>
          </div>

          {/* GOOGLE SIGN IN button (visual only, no functionality) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="w-full border border-[#374151] hover:border-[#6B7280] rounded-2xl py-3.5 flex items-center justify-center gap-3 text-white text-sm transition font-medium cursor-pointer bg-transparent"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-800">
              G
            </div>
            <span>Continue with Google</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
