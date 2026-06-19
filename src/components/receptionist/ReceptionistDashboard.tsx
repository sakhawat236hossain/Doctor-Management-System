"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, CreditCard, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

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

export function ReceptionistDashboard() {
  const t = useT();

  const { data, isLoading } = useQuery({
    queryKey: ["receptionist-reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=overview");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ReportData;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments?status=due");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  if (isLoading) return <Loading message={t("admin.loadingDashboard")} />;

  const stats = data?.stats;
  const appointments = data?.recentAppointments || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">{t("receptionist.dashboard")}</h1>
        <p className="text-muted-foreground dark:text-slate-400">{t("receptionist.dashboardDesc")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-slate-300">{t("appointment.todayAppointments")}</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats?.todayAppointments || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-slate-300">{t("patient.totalPatients")}</CardTitle>
            <Users className="h-4 w-4 text-teal-500 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats?.totalPatients || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-slate-300">{t("admin.pendingPayments")}</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats?.pendingPayments || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-slate-300">{t("admin.totalDoctors")}</CardTitle>
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats?.totalDoctors || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("appointment.todayAppointments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground dark:text-slate-400">{t("appointment.noTodayAppointments")}</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between rounded-lg border dark:border-slate-700 p-3">
                    <div>
                      <p className="font-medium dark:text-white">#{apt.serialNumber} {apt.patientId?.userId?.name}</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">
                        Dr. {apt.doctorId?.userId?.name} &middot; {formatDate(apt.appointmentDate)}
                      </p>
                    </div>
                    <Badge variant="secondary">{t(`status.${apt.status}`)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("admin.pendingPayments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!payments || payments.length === 0 ? (
              <p className="text-muted-foreground dark:text-slate-400">{t("admin.noIncomeData")}</p>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment: { _id: string; amount: number; appointmentId?: { patientId?: { userId?: { name: string } } } }) => (
                  <div key={payment._id} className="flex items-center justify-between rounded-lg border dark:border-slate-700 p-3">
                    <p className="font-medium dark:text-white">
                      {payment.appointmentId?.patientId?.userId?.name || t("common.unknown")}
                    </p>
                    <Badge variant="warning">{formatCurrency(payment.amount)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, CreditCard, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { formatCurrency, formatDate } from "@/lib/utils";

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

export function ReceptionistDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["receptionist-reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=overview");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ReportData;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments?status=due");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  if (isLoading) return <Loading message="Loading dashboard..." />;

  const stats = data?.stats;
  const appointments = data?.recentAppointments || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receptionist Dashboard</h1>
        <p className="text-muted-foreground">Manage appointments, payments, and patient flow</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayAppointments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPayments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDoctors || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground">No appointments today.</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">#{apt.serialNumber} {apt.patientId?.userId?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {apt.doctorId?.userId?.name} &middot; {formatDate(apt.appointmentDate)}
                      </p>
                    </div>
                    <Badge variant="secondary">{apt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {!payments || payments.length === 0 ? (
              <p className="text-muted-foreground">No pending payments.</p>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment: { _id: string; amount: number; appointmentId?: { patientId?: { userId?: { name: string } } } }) => (
                  <div key={payment._id} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="font-medium">
                      {payment.appointmentId?.patientId?.userId?.name || "Unknown"}
                    </p>
                    <Badge variant="warning">{formatCurrency(payment.amount)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
