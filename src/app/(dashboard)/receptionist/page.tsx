"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { QuickBookForm } from "@/components/receptionist/QuickBookForm";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Banknote,
} from "lucide-react";

interface TodayStats {
  totalBookings: number;
  serving: number;
  completed: number;
  totalRevenue: number;
}

function ReceptionistDashboardContent() {
  const t = useT();
  const [stats, setStats] = useState<TodayStats>({
    totalBookings: 0,
    serving: 0,
    completed: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch(`/api/appointments?date=${today}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const appointments = res.data;
          const totalBookings = appointments.length;
          const serving = appointments.filter(
            (a: { status: string }) => a.status === "serving"
          ).length;
          const completed = appointments.filter(
            (a: { status: string }) => a.status === "completed"
          ).length;

          fetch("/api/payments")
            .then((r) => r.json())
            .then((pRes) => {
              const totalRevenue = Array.isArray(pRes.data)
                ? pRes.data.reduce(
                    (sum: number, p: { amount: number }) => sum + (p.amount || 0),
                    0
                  )
                : 0;
              setStats({ totalBookings, serving, completed, totalRevenue });
            })
            .catch(() => {
              setStats({ totalBookings, serving, completed, totalRevenue: 0 });
            });
        }
      })
      .catch(() => {});
  }, []);

  const statCards = [
    {
      label: t("patient.todayBookings"),
      value: stats.totalBookings,
      icon: CalendarCheck,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label: t("status.serving"),
      value: stats.serving,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/30",
    },
    {
      label: t("status.completed"),
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/30",
    },
    {
      label: t("admin.todayIncome"),
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: Banknote,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Book Form */}
      <QuickBookForm />
    </div>
  );
}

export default function ReceptionistPage() {
  return (
    <RoleGuard allowedRoles={["receptionist", "admin"]}>
      <ReceptionistDashboardContent />
    </RoleGuard>
  );
}
