import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Feed from "./pages/Feed";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB]">
      <Navbar />
      <main className="w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
