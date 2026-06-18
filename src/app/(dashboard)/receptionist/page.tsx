"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { QuickBookForm } from "@/components/receptionist/QuickBookForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

          // Calculate revenue from payments
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
      label: "আজকের মোট বুকিং",
      value: stats.totalBookings,
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "চলমান",
      value: stats.serving,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "সম্পন্ন",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "মোট আয়",
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: Banknote,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ];

  return (
    <div className="space-y-6">
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
