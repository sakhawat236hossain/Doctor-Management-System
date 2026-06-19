"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/shared/Loading";
import { useT } from "@/lib/i18n";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";

interface DoctorWiseRow {
  _id: string;
  doctorName: string;
  speciality: string;
  patientCount: number;
  totalIncome: number;
  collected: number;
  due: number;
}

interface DailyRow {
  _id: string;
  totalIncome: number;
  collected: number;
  due: number;
  patientCount: number;
}

interface AdminReportData {
  doctorWise: DoctorWiseRow[];
  daily: DailyRow[];
  grandTotal: {
    totalIncome: number;
    collected: number;
    due: number;
    patients: number;
  };
  dateRange: { start: string; end: string };
}

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1",
];

function getPresetRange(preset: string): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  let start: Date;

  switch (preset) {
    case "today":
      start = today;
      break;
    case "week": {
      start = new Date(today);
      start.setDate(start.getDate() - 7);
      break;
    }
    case "month": {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    }
    case "year": {
      start = new Date(today.getFullYear(), 0, 1);
      break;
    }
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return { start: start.toISOString().split("T")[0], end };
}

export default function AdminIncomePage() {
  const t = useT();
  const [dateRange, setDateRange] = useState(() => getPresetRange("month"));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-income-report", dateRange.start, dateRange.end],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      const res = await fetch(`/api/reports/admin?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AdminReportData;
    },
  });

  const pieData = useMemo(() => {
    if (!data?.doctorWise) return [];
    return data.doctorWise.map((d) => ({
      name: d.doctorName,
      value: d.totalIncome,
    }));
  }, [data]);

  const barData = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map((d) => ({
      date: new Date(d._id).toLocaleDateString("bn-BD", { day: "numeric", month: "short" }),
      income: d.totalIncome,
      collected: d.collected,
      due: d.due,
    }));
  }, [data]);

  function handlePreset(preset: string) {
    setDateRange(getPresetRange(preset));
  }

  function downloadCSV() {
    const params = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end,
      format: "csv",
    });
    window.open(`/api/reports/admin?${params}`, "_blank");
  }

  function downloadPDF() {
    if (!data) return;

    const doc = new jsPDF();
    const gt = data.grandTotal;

    doc.setFontSize(16);
    doc.text("Clinic Income Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 28);
    doc.text(`Total Income: Tk ${gt.totalIncome.toLocaleString()}`, 14, 34);
    doc.text(`Collected: Tk ${gt.collected.toLocaleString()}`, 14, 40);
    doc.text(`Due: Tk ${gt.due.toLocaleString()}`, 14, 46);

    // Table header
    let y = 58;
    doc.setFontSize(10);
    doc.setFillColor("#e6e6e6");
    doc.rect(14, y - 5, 182, 8, "F");
    doc.text("Doctor", 16, y);
    doc.text("Speciality", 66, y);
    doc.text("Patients", 106, y);
    doc.text("Income", 126, y);
    doc.text("Collected", 148, y);
    doc.text("Due", 170, y);
    y += 8;

    data.doctorWise.forEach((d) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(d.doctorName || "N/A", 16, y);
      doc.text(d.speciality || "", 66, y);
      doc.text(String(d.patientCount), 106, y);
      doc.text(`Tk ${d.totalIncome.toLocaleString()}`, 126, y);
      doc.text(`Tk ${d.collected.toLocaleString()}`, 148, y);
      doc.text(`Tk ${d.due.toLocaleString()}`, 170, y);
      y += 7;
    });

    doc.save(`income-report-${dateRange.start}-to-${dateRange.end}.pdf`);
    toast.success(t("common.pdfDownload"));
  }

  if (isLoading) return <Loading message={t("common.loading")} />;

  const gt = data?.grandTotal || { totalIncome: 0, collected: 0, due: 0, patients: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">{t("admin.incomeReport")}</h1>
          <p className="text-muted-foreground dark:text-slate-400">{t("admin.incomeReportDesc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPDF}>
            <FileText className="mr-2 h-4 w-4" />
            {t("common.pdfDownload")}
          </Button>
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            {t("common.csvDownload")}
          </Button>
        </div>
      </div>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "today", label: t("admin.today") },
              { key: "week", label: t("admin.thisWeek") },
              { key: "month", label: t("admin.thisMonth") },
              { key: "year", label: t("admin.thisYear") },
            ].map((p) => (
              <Button
                key={p.key}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div>
              <Label className="text-xs">{t("common.startDate")}</Label>
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">{t("common.endDate")}</Label>
              <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: t("admin.totalClinicIncome"), value: `৳${gt.totalIncome.toLocaleString("bn-BD")}` },
          { title: t("admin.collected"), value: `৳${gt.collected.toLocaleString("bn-BD")}` },
          { title: t("admin.remaining"), value: `৳${gt.due.toLocaleString("bn-BD")}` },
          { title: t("admin.totalPatientsCount"), value: gt.patients.toLocaleString("bn-BD") },
        ].map((card) => (
          <Card key={card.title} className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-300">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("admin.incomeByDoctor")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-muted-foreground dark:text-slate-400 text-center py-8">{t("common.noData")}</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("admin.dailyIncome")}</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-muted-foreground dark:text-slate-400 text-center py-8">{t("common.noData")}</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`} />
                    <Legend />
                    <Bar dataKey="income" name={t("admin.income")} fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name={t("admin.collected")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="due" name={t("admin.remaining")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">{t("admin.doctorWiseDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 dark:border-slate-700">
                <tr>
                  <th className="py-3 pl-4 text-left font-medium dark:text-slate-300">{t("roles.doctor")}</th>
                  <th className="py-3 text-center font-medium dark:text-slate-300">{t("roles.patient")}</th>
                  <th className="py-3 text-right font-medium dark:text-slate-300">{t("admin.income")}</th>
                  <th className="py-3 text-right font-medium dark:text-slate-300">{t("admin.collected")}</th>
                  <th className="py-3 text-right font-medium dark:text-slate-300">{t("admin.remaining")}</th>
                  <th className="py-3 pr-4 text-right font-medium dark:text-slate-300">{t("admin.percent")}</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.doctorWise || data.doctorWise.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                      {t("admin.noIncomeData")}
                    </td>
                  </tr>
                ) : (
                  data.doctorWise.map((d) => {
                    const pct = gt.totalIncome > 0 ? ((d.totalIncome / gt.totalIncome) * 100).toFixed(1) : "0";
                    return (
                      <tr key={d._id} className="border-b last:border-0 hover:bg-muted/30 dark:border-slate-700 dark:hover:bg-slate-700/50">
                        <td className="py-3 pl-4">
                          <div>
                            <p className="font-medium dark:text-white">{d.doctorName}</p>
                            <p className="text-xs text-muted-foreground dark:text-slate-400">{d.speciality}</p>
                          </div>
                        </td>
                        <td className="py-3 text-center dark:text-white">{d.patientCount}</td>
                        <td className="py-3 text-right dark:text-white">৳{d.totalIncome.toLocaleString("bn-BD")}</td>
                        <td className="py-3 text-right dark:text-white">৳{d.collected.toLocaleString("bn-BD")}</td>
                        <td className="py-3 text-right dark:text-white">৳{d.due.toLocaleString("bn-BD")}</td>
                        <td className="py-3 pr-4 text-right dark:text-white">{pct}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {data?.doctorWise && data.doctorWise.length > 0 && (
                <tfoot className="border-t bg-muted/30 font-medium dark:border-slate-700">
                  <tr>
                    <td className="py-3 pl-4 dark:text-white">{t("common.total")}</td>
                    <td className="py-3 text-center dark:text-white">{gt.patients}</td>
                    <td className="py-3 text-right dark:text-white">৳{gt.totalIncome.toLocaleString("bn-BD")}</td>
                    <td className="py-3 text-right dark:text-white">৳{gt.collected.toLocaleString("bn-BD")}</td>
                    <td className="py-3 text-right dark:text-white">৳{gt.due.toLocaleString("bn-BD")}</td>
                    <td className="py-3 pr-4 text-right">১০০%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
