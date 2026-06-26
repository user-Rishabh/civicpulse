import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Feed from "./pages/Feed";
import CitizenDashboard from "./pages/CitizenDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import Login from "./pages/Login";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F1E]">
        <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    if (!userProfile) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F1E]">
          <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
        </div>
      );
    }

    if (!allowedRoles.includes(userProfile.role)) {
      if (userProfile.role === "officer") {
        return <Navigate to="/officer-dashboard" replace />;
      } else {
        return <Navigate to="/citizen-dashboard" replace />;
      }
    }
  }

  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function DashboardRedirect() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F1E]">
        <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
      </div>
    );
  }

  if (userProfile.role === "officer") {
    return <Navigate to="/officer-dashboard" replace />;
  } else {
    return <Navigate to="/citizen-dashboard" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB]">
        <Navbar />
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute allowedRoles={["citizen"]}>
                  <Report />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute allowedRoles={["citizen", "officer"]}>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen-dashboard"
              element={
                <ProtectedRoute allowedRoles={["citizen"]}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer-dashboard"
              element={
                <ProtectedRoute allowedRoles={["officer"]}>
                  <OfficerDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
