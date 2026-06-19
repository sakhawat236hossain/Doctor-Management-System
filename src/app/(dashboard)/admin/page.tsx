"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Stethoscope, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useT } from "@/lib/i18n";

interface AdminOverview {
  stats: {
    totalDoctors: number;
    totalPatients: number;
    todayAppointments: number;
    todayIncome: number;
  };
  monthlyIncome: { month: string; income: number }[];
  activeDoctors: Array<{
    _id: string;
    doctorName: string;
    speciality: string;
    status: string;
    todayPatients: number;
    todayIncome: number;
  }>;
  recentAppointments: Array<{
    _id: string;
    serialNumber: number;
    appointmentDate: string;
    status: string;
    type: string;
    timeSlot: string;
    doctorId?: { userId?: { name: string } };
    patientId?: { userId?: { name: string } };
  }>;
}

const STATUS_MAP: Record<string, { labelKey: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  pending: { labelKey: "status.pending", variant: "warning" },
  confirmed: { labelKey: "status.confirmed", variant: "default" },
  serving: { labelKey: "status.serving", variant: "default" },
  completed: { labelKey: "status.completed", variant: "success" },
  cancelled: { labelKey: "status.cancelled", variant: "destructive" },
  "no-show": { labelKey: "status.noShow", variant: "secondary" },
};

export default function AdminPage() {
  const t = useT();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AdminOverview;
    },
  });

  if (isLoading) return <Loading message={t("admin.loadingDashboard")} />;
  if (error) return <div className="text-destructive p-4 dark:text-red-400">{t("admin.loadFailed")}</div>;

  const stats = data?.stats;

  const statCards = [
    { title: t("admin.totalDoctors"), value: stats?.totalDoctors || 0, icon: Stethoscope, color: "text-teal-500 dark:text-teal-400" },
    { title: t("admin.totalPatients"), value: stats?.totalPatients || 0, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { title: t("admin.todayAppointments"), value: stats?.todayAppointments || 0, icon: Calendar, color: "text-purple-600 dark:text-purple-400" },
    { title: t("admin.todayIncome"), value: `৳${(stats?.todayIncome || 0).toLocaleString("bn-BD")}`, icon: DollarSign, color: "text-green-600 dark:text-green-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">{t("admin.dashboard")}</h1>
        <p className="text-muted-foreground dark:text-slate-400">{t("admin.dashboardDesc")}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-300">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Income Chart */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">{t("admin.monthlyIncomeChart")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyIncome || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(value: number) => [`৳${value.toLocaleString("bn-BD")}`, t("admin.income")]}
                  labelFormatter={(label) => `${t("admin.month")}: ${label}`}
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Doctors Table */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("doctor.activeDoctors")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.activeDoctors || []).length === 0 ? (
              <p className="text-muted-foreground dark:text-slate-400">{t("doctor.noActiveDoctors")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      <th className="py-2 text-left font-medium dark:text-slate-300">{t("roles.doctor")}</th>
                      <th className="py-2 text-left font-medium dark:text-slate-300">{t("common.status")}</th>
                      <th className="py-2 text-center font-medium dark:text-slate-300">{t("doctor.todayPatients")}</th>
                      <th className="py-2 text-right font-medium dark:text-slate-300">{t("doctor.todayIncome")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.activeDoctors || []).slice(0, 8).map((doc) => (
                      <tr key={doc._id} className="border-b last:border-0 dark:border-slate-700">
                        <td className="py-2">
                          <div>
                            <p className="font-medium dark:text-white">{doc.doctorName}</p>
                            <p className="text-xs text-muted-foreground dark:text-slate-400">{doc.speciality}</p>
                          </div>
                        </td>
                        <td className="py-2">
                          <Badge variant={doc.status === "available" ? "success" : "secondary"}>
                            {doc.status === "available" ? t("status.available") : doc.status === "on-leave" ? t("status.onLeave") : t("status.unavailable")}
                          </Badge>
                        </td>
                        <td className="py-2 text-center dark:text-white">{doc.todayPatients}</td>
                        <td className="py-2 text-right dark:text-white">৳{doc.todayIncome.toLocaleString("bn-BD")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("admin.recentAppointments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.recentAppointments || []).length === 0 ? (
              <p className="text-muted-foreground dark:text-slate-400">{t("admin.noRecentAppointments")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      <th className="py-2 text-left font-medium dark:text-slate-300">{t("appointment.serial")}</th>
                      <th className="py-2 text-left font-medium dark:text-slate-300">{t("roles.patient")}</th>
                      <th className="py-2 text-left font-medium dark:text-slate-300">{t("roles.doctor")}</th>
                      <th className="py-2 text-left font-medium dark:text-slate-300">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentAppointments || []).slice(0, 10).map((apt) => {
                      const st = STATUS_MAP[apt.status] || { labelKey: "common.unknown", variant: "secondary" as const };
                      return (
                        <tr key={apt._id} className="border-b last:border-0 dark:border-slate-700">
                          <td className="py-2 font-medium dark:text-white">{apt.serialNumber}</td>
                          <td className="py-2 dark:text-slate-300">{apt.patientId?.userId?.name || t("common.unknown")}</td>
                          <td className="py-2 dark:text-slate-300">{apt.doctorId?.userId?.name || t("common.unknown")}</td>
                          <td className="py-2">
                            <Badge variant={st.variant}>{t(st.labelKey)}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
