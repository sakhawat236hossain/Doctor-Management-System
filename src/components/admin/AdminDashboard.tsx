"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Stethoscope, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { AdminCharts } from "@/components/admin/AdminCharts";

interface ReportData {
  stats: {
    totalPatients: number;
    totalDoctors: number;
    todayAppointments: number;
    pendingPayments: number;
  };
  recentAppointments: Array<{
    _id: string;
    serialNumber: number;
    appointmentDate: string;
    status: string;
    type: string;
    doctorId?: { userId?: { name: string } };
    patientId?: { userId?: { name: string } };
  }>;
}

export function AdminDashboard() {
  const t = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=overview");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ReportData;
    },
  });

  if (isLoading) return <Loading message={t("admin.loadingDashboard")} />;
  if (error) return <div className="text-destructive p-4 dark:text-red-400">{t("admin.loadFailed")}</div>;

  const stats = data?.stats;
  const appointments = data?.recentAppointments || [];

  const statCards = [
    { title: t("patient.totalPatients"), value: stats?.totalPatients || 0, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { title: t("admin.totalDoctors"), value: stats?.totalDoctors || 0, icon: Stethoscope, color: "text-teal-500 dark:text-teal-400" },
    { title: t("admin.todayAppointments"), value: stats?.todayAppointments || 0, icon: Calendar, color: "text-purple-600 dark:text-purple-400" },
    { title: t("admin.pendingPayments"), value: stats?.pendingPayments || 0, icon: CreditCard, color: "text-orange-600 dark:text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">{t("admin.dashboard")}</h1>
        <p className="text-muted-foreground dark:text-slate-400">{t("admin.dashboardDesc")}</p>
      </div>

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

      <AdminCharts />

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">{t("appointment.todayAppointments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground dark:text-slate-400">{t("appointment.noTodayAppointments")}</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between rounded-lg border dark:border-slate-700 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {apt.serialNumber}
                    </span>
                    <div>
                      <p className="font-medium dark:text-white">{apt.patientId?.userId?.name || t("patient.unknownPatient")}</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">
                        Dr. {apt.doctorId?.userId?.name || t("common.unknown")} &middot; {formatDate(apt.appointmentDate)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={apt.status === "completed" ? "success" : "secondary"}>
                    {t(`status.${apt.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
