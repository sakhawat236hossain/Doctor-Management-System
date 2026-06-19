"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/shared/Loading";
import { useT } from "@/lib/i18n";

export function AdminCharts() {
  const t = useT();

  const { data: appointmentData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["reports-appointments"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=appointments");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["reports-revenue"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=revenue");
      const json = await res.json();
      return json.success ? json.data : { daily: [], total: 0 };
    },
  });

  if (appointmentsLoading || revenueLoading) {
    return <Loading message={t("common.loading")} />;
  }

  const appointments = (appointmentData || []).map((item: { _id: string; count: number }) => ({
    date: item._id,
    appointments: item.count,
  }));

  const revenue = (revenueData?.daily || []).map((item: { _id: string; total: number }) => ({
    date: item._id,
    revenue: item.total,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base dark:text-white">{t("admin.appointmentsTrend")}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground dark:text-slate-400">{t("admin.noAppointmentData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appointments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" fontSize={12} tick={{ fill: "#94a3b8" }} />
                <YAxis fontSize={12} tick={{ fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="appointments" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base dark:text-white">
            {t("admin.revenueTrend")}
            {revenueData?.total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground dark:text-slate-400">
                {t("common.total")}: ৳{revenueData.total.toFixed(2)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground dark:text-slate-400">{t("admin.noRevenueData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" fontSize={12} tick={{ fill: "#94a3b8" }} />
                <YAxis fontSize={12} tick={{ fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} />
                <Line type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
