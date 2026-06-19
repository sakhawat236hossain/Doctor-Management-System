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

const MONTHS_BN = [
  "জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন",
  "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে",
];

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  pending: { label: "অপেক্ষমান", variant: "warning" },
  confirmed: { label: "নিশ্চিত", variant: "default" },
  serving: { label: "চিকিৎসাধীন", variant: "default" },
  completed: { label: "সম্পন্ন", variant: "success" },
  cancelled: { label: "বাতিল", variant: "destructive" },
  "no-show": { label: "আসেনি", variant: "secondary" },
};

export default function AdminPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AdminOverview;
    },
  });

  if (isLoading) return <Loading message="ড্যাশবোর্ড লোড হচ্ছে..." />;
  if (error) return <div className="text-destructive p-4">ড্যাশবোর্ড লোড করতে ব্যর্থ হয়েছে</div>;

  const stats = data?.stats;

  const statCards = [
    { title: "মোট ডাক্তার", value: stats?.totalDoctors || 0, icon: Stethoscope, color: "text-teal-500" },
    { title: "মোট রোগী", value: stats?.totalPatients || 0, icon: Users, color: "text-blue-600" },
    { title: "আজকের অ্যাপয়েন্টমেন্ট", value: stats?.todayAppointments || 0, icon: Calendar, color: "text-purple-600" },
    { title: "আজকের মোট আয়", value: `৳${(stats?.todayIncome || 0).toLocaleString("bn-BD")}`, icon: DollarSign, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
        <p className="text-muted-foreground">ক্লিনিকের সার্বিক কার্যক্রমের সংক্ষিপ্ত বিবরণ</p>
      </div>

      {/* Stat Cards */}
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

      {/* Monthly Income Chart */}
      <Card>
        <CardHeader>
          <CardTitle>এই বছরের মাসিক আয়</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyIncome || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`৳${value.toLocaleString("bn-BD")}`, "আয়"]}
                  labelFormatter={(label) => `মাস: ${label}`}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Doctors Table */}
        <Card>
          <CardHeader>
            <CardTitle>সক্রিয় ডাক্তারগণ</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.activeDoctors || []).length === 0 ? (
              <p className="text-muted-foreground">কোনো সক্রিয় ডাক্তার নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">ডাক্তার</th>
                      <th className="py-2 text-left font-medium">স্ট্যাটাস</th>
                      <th className="py-2 text-center font-medium">আজকের রোগী</th>
                      <th className="py-2 text-right font-medium">আজকের আয়</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.activeDoctors || []).slice(0, 8).map((doc) => (
                      <tr key={doc._id} className="border-b last:border-0">
                        <td className="py-2">
                          <div>
                            <p className="font-medium">{doc.doctorName}</p>
                            <p className="text-xs text-muted-foreground">{doc.speciality}</p>
                          </div>
                        </td>
                        <td className="py-2">
                          <Badge variant={doc.status === "available" ? "success" : "secondary"}>
                            {doc.status === "available" ? "সক্রিয়" : doc.status === "on-leave" ? "ছুটিতে" : "অনুপলব্ধ"}
                          </Badge>
                        </td>
                        <td className="py-2 text-center">{doc.todayPatients}</td>
                        <td className="py-2 text-right">৳{doc.todayIncome.toLocaleString("bn-BD")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক অ্যাপয়েন্টমেন্ট</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.recentAppointments || []).length === 0 ? (
              <p className="text-muted-foreground">কোনো সাম্প্রতিক অ্যাপয়েন্টমেন্ট নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">সিরিয়াল</th>
                      <th className="py-2 text-left font-medium">রোগী</th>
                      <th className="py-2 text-left font-medium">ডাক্তার</th>
                      <th className="py-2 text-left font-medium">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentAppointments || []).slice(0, 10).map((apt) => {
                      const st = STATUS_MAP[apt.status] || { label: apt.status, variant: "secondary" as const };
                      return (
                        <tr key={apt._id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{apt.serialNumber}</td>
                          <td className="py-2">{apt.patientId?.userId?.name || "অজানা"}</td>
                          <td className="py-2">{apt.doctorId?.userId?.name || "অজানা"}</td>
                          <td className="py-2">
                            <Badge variant={st.variant}>{st.label}</Badge>
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

