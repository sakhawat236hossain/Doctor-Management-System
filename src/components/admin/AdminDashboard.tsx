"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Stethoscope, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { formatDate } from "@/lib/utils";
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=overview");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ReportData;
    },
  });

  if (isLoading) return <Loading message="Loading dashboard..." />;
  if (error) return <div className="text-destructive">Failed to load dashboard data</div>;

  const stats = data?.stats;
  const appointments = data?.recentAppointments || [];

  const statCards = [
    { title: "Total Patients", value: stats?.totalPatients || 0, icon: Users, color: "text-blue-600" },
    { title: "Total Doctors", value: stats?.totalDoctors || 0, icon: Stethoscope, color: "text-teal-500" },
    { title: "Today's Appointments", value: stats?.todayAppointments || 0, icon: Calendar, color: "text-purple-600" },
    { title: "Pending Payments", value: stats?.pendingPayments || 0, icon: CreditCard, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of clinic operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminCharts />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {apt.serialNumber}
                    </span>
                    <div>
                      <p className="font-medium">{apt.patientId?.userId?.name || "Unknown Patient"}</p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {apt.doctorId?.userId?.name || "Unknown"} &middot; {formatDate(apt.appointmentDate)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={apt.status === "completed" ? "success" : "secondary"}>
                    {apt.status}
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
