import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time synchronization with Firestore
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
        console.error("Firestore error in dashboard, local fallback:", error);
        try {
          const stored = localStorage.getItem("civicpulse_issues");
          setIssues(stored ? JSON.parse(stored) : []);
        } catch (e) {
          console.error("Local storage error:", e);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totalCount = issues.length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved").length;
  const pendingCount = issues.filter((i) => i.status === "Pending").length;
  const inProgressCount = issues.filter((i) => i.status === "In Progress").length;
  const criticalCount = issues.filter((i) => i.severity === "Critical").length;

  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const pendingPercentage = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const criticalPercentage = totalCount > 0 ? Math.round((criticalCount / totalCount) * 100) : 0;

  // Chart 1: Issues by Category
  const categories = [
    "Pothole",
    "Water Leak",
    "Broken Streetlight",
    "Garbage Dumping",
    "Damaged Road",
    "Encroachment",
    "Flooding",
    "Other",
  ];
  const categoryData = categories.map((cat) => ({
    name: cat,
    count: issues.filter((i) => i.category === cat).length,
  }));

  // Chart 2: Issues by Status
  const statusData = [
    { name: "Pending", value: pendingCount, color: "#6B7280" },
    { name: "In Progress", value: inProgressCount, color: "#3B82F6" },
    { name: "Resolved", value: resolvedCount, color: "#10B981" },
  ];

  // Filters out statuses with 0 value for cleaner Pie display (unless all are 0)
  const filteredStatusData = statusData.some((d) => d.value > 0)
    ? statusData.filter((d) => d.value > 0)
    : statusData;

  const recentIssues = issues.slice(0, 5);

  const getSeverityBadgeClass = (sev) => {
    const base = "rounded-full px-2 py-0.5 text-xs font-bold border inline-block ";
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

  const getStatusBadgeClass = (status) => {
    const base = "rounded-full px-2.5 py-0.5 text-xs font-medium border inline-block ";
    switch (status) {
      case "Pending":
        return base + "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "In Progress":
        return base + "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Resolved":
        return base + "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return base + "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="pt-28 px-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>📊</span> Impact Dashboard
        </h1>
        <p className="text-[#9CA3AF] mt-2 text-sm">
          Real-time overview of civic issues and resolutions across Maharashtra.
        </p>
      </div>

      {loading ? (
        /* Loading Screen */
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 mb-4"></div>
          <span className="text-[#9CA3AF] text-sm font-medium">Loading dashboard metrics...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {/* Card 1: Total Reports */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl mb-4 text-blue-400">
                  📋
                </div>
                <span className="text-[#9CA3AF] text-sm font-medium">Total Reports</span>
              </div>
              <div className="mt-2">
                <div className="text-4xl font-black text-blue-400">{totalCount}</div>
                <div className="text-[#6B7280] text-xs mt-1">All-time submissions</div>
              </div>
            </div>

            {/* Card 2: Resolved */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl mb-4 text-green-400">
                  ✅
                </div>
                <span className="text-[#9CA3AF] text-sm font-medium">Resolved</span>
              </div>
              <div className="mt-2">
                <div className="text-4xl font-black text-green-400">{resolvedCount}</div>
                <div className="text-[#6B7280] text-xs mt-1">{resolutionRate}% resolution rate</div>
              </div>
            </div>

            {/* Card 3: Pending */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-xl mb-4 text-yellow-400">
                  ⏳
                </div>
                <span className="text-[#9CA3AF] text-sm font-medium">Pending</span>
              </div>
              <div className="mt-2">
                <div className="text-4xl font-black text-yellow-400">{pendingCount}</div>
                <div className="text-[#6B7280] text-xs mt-1">{pendingPercentage}% pending response</div>
              </div>
            </div>

            {/* Card 4: Critical */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-xl mb-4 text-red-400">
                  🚨
                </div>
                <span className="text-[#9CA3AF] text-sm font-medium">Critical</span>
              </div>
              <div className="mt-2">
                <div className="text-4xl font-black text-red-400">{criticalCount}</div>
                <div className="text-[#6B7280] text-xs mt-1">{criticalPercentage}% critical severity</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Category Bar Chart */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col">
              <h3 className="text-white text-base font-semibold mb-4">Issues by Category</h3>
              <div className="h-64 w-full">
                {totalCount === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#9CA3AF] text-sm">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          borderColor: "#374151",
                          borderRadius: "8px",
                          color: "#FFF",
                        }}
                        cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status Pie Chart */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#374151] flex flex-col">
              <h3 className="text-white text-base font-semibold mb-4">Issues by Status</h3>
              <div className="h-64 w-full">
                {totalCount === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#9CA3AF] text-sm">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredStatusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {filteredStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          borderColor: "#374151",
                          borderRadius: "8px",
                          color: "#FFF",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span className="text-[#9CA3AF] text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Recent Reports Table */}
          <div className="mt-8 bg-[#111827] rounded-2xl border border-[#374151] overflow-hidden">
            <div className="p-6 border-b border-[#374151]">
              <h3 className="text-white text-lg font-semibold">Recent Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1F2937]/50">
                    <th className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Issue Description
                    </th>
                    <th className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Location
                    </th>
                    <th className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Severity
                    </th>
                    <th className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Status
                    </th>
                    <th className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentIssues.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#9CA3AF] text-sm">
                        No reports yet
                      </td>
                    </tr>
                  ) : (
                    recentIssues.map((issue) => (
                      <tr
                        key={issue.docId || issue.id}
                        className="hover:bg-[#1F2937]/35 transition duration-150"
                      >
                        <td className="px-6 py-4 text-sm text-white font-medium max-w-xs truncate">
                          {issue.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#9CA3AF] font-medium truncate max-w-xs">
                          {issue.location}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={getSeverityBadgeClass(issue.severity)}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={getStatusBadgeClass(issue.status)}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">
                          {issue.date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
