"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Users,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

type RangeKey = "today" | "week" | "month" | "year" | "custom";

interface DailyData {
  date: string;
  patients: number;
  newCount: number;
  followUpCount: number;
  income: number;
  collected: number;
}

interface Summary {
  total: number;
  paid: number;
  due: number;
  patients: number;
}

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "আজ" },
  { key: "week", label: "এই সপ্তাহ" },
  { key: "month", label: "এই মাস" },
  { key: "year", label: "এই বছর" },
  { key: "custom", label: "কাস্টম" },
];

function getDateRange(key: RangeKey): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (key === "today") {
    return { start: fmt(now), end: fmt(now) };
  }
  if (key === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    return { start: fmt(start), end: fmt(now) };
  }
  if (key === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: fmt(start), end: fmt(now) };
  }
  if (key === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { start: fmt(start), end: fmt(now) };
  }
  return { start: "", end: "" };
}

function IncomeContent() {
  const { session } = useAuth();
  const [doctorId, setDoctorId] = useState("");
  const [rangeKey, setRangeKey] = useState<RangeKey>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, due: 0, patients: 0 });
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Get doctor ID
  useEffect(() => {
    fetch(`/api/doctors?search=${encodeURIComponent(session?.user?.name || "")}&limit=1`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) setDoctorId(res.data[0]._id);
      })
      .catch(() => {});
  }, [session?.user?.name]);

  const fetchReport = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);

    let startDate: string;
    let endDate: string;

    if (rangeKey === "custom") {
      startDate = customStart;
      endDate = customEnd;
    } else {
      const range = getDateRange(rangeKey);
      startDate = range.start;
      endDate = range.end;
    }

    try {
      const params = new URLSearchParams({
        doctorId,
        startDate,
        endDate,
        format: "json",
      });
      const res = await fetch(`/api/reports/doctor?${params}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setDaily(data.data.daily);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [doctorId, rangeKey, customStart, customEnd]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCSV = () => {
    if (!doctorId) return;
    let startDate: string;
    let endDate: string;

    if (rangeKey === "custom") {
      startDate = customStart;
      endDate = customEnd;
    } else {
      const range = getDateRange(rangeKey);
      startDate = range.start;
      endDate = range.end;
    }

    const params = new URLSearchParams({
      doctorId,
      startDate,
      endDate,
      format: "csv",
    });
    window.open(`/api/reports/doctor?${params}`, "_blank");
  };

  const chartData = daily.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
  }));

  const statCards = [
    { label: "মোট আয়", value: `৳${summary.total.toLocaleString()}`, icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "পরিশোধিত", value: `৳${summary.paid.toLocaleString()}`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "বাকি", value: `৳${summary.due.toLocaleString()}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "মোট রোগী", value: summary.patients, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">আয়ের হিসাব</h1>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRangeKey(r.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              rangeKey === r.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Custom Date Pickers */}
      {rangeKey === "custom" && (
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">From</label>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To</label>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading report data...</div>
      ) : daily.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-gray-400">
            No data for selected range
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Income BarChart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Income (৳)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`৳${value}`, ""]}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Patient Count LineChart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Patient Count Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="patients" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="newCount" stroke="#3B82F6" strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="followUpCount" stroke="#10B981" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Breakdown Table */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">তারিখ</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">রোগী</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">নতুন</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">ফলোআপ</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">আয়</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">সংগৃহীত</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.map((d) => (
                      <tr key={d.date} className="border-b last:border-0">
                        <td className="py-2.5 px-4 font-medium">
                          {new Date(d.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 px-4">{d.patients}</td>
                        <td className="py-2.5 px-4">{d.newCount}</td>
                        <td className="py-2.5 px-4">{d.followUpCount}</td>
                        <td className="py-2.5 px-4 font-medium">৳{d.income.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-green-600 font-medium">
                          ৳{d.collected.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function IncomePage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <IncomeContent />
    </RoleGuard>
  );
}
