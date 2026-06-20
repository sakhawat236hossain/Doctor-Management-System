"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { useT } from "@/lib/i18n";
import {
  Users,
  CheckCircle2,
  Clock,
  Banknote,
  ChevronRight,
} from "lucide-react";
import type { Socket } from "socket.io-client";

interface DoctorInfo {
  _id: string;
  userId: { _id: string; name: string };
  speciality: string;
  status: string;
  visitFee: number;
  followUpFee: number;
}

interface AppointmentRow {
  _id: string;
  serialNumber: number;
  type: string;
  status: string;
  notes: string;
  patientId?: { userId?: { name: string; phone: string } };
}

function DoctorDashboardContent() {
  const t = useT();
  const { session } = useAuth();
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [currentSerial, setCurrentSerial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayTotalIncome, setTodayTotalIncome] = useState(0);
  const [todayCollected, setTodayCollected] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    try {
      const [aptRes, queueRes] = await Promise.all([
        fetch(`/api/appointments?date=${today}`),
        fetch(`/api/queue?date=${today}`),
      ]);
      const aptData = await aptRes.json();
      const queueData = await queueRes.json();

      if (aptData.success) setAppointments(aptData.data);
      if (queueData.success && queueData.data.length > 0) {
        setCurrentSerial(queueData.data[0]?.currentSerial || 0);
        if (!doctorId && queueData.data[0]?.doctorId?._id) {
          setDoctorId(queueData.data[0].doctorId._id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today, doctorId]);

  // Fetch real income data from Payment records via reports API
  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    fetch(`/api/reports/doctor?doctorId=${doctorId}&startDate=${today}&endDate=${today}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res.success && res.data?.summary) {
          setTodayTotalIncome(res.data.summary.total || 0);
          setTodayCollected(res.data.summary.paid || 0);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [doctorId, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (doctorId) return;
    fetch(`/api/doctors?search=${encodeURIComponent(session?.user?.name || "")}&limit=1`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setDoctorId(res.data[0]._id);
        }
      })
      .catch(() => {});
  }, [doctorId, session?.user?.name]);

  useEffect(() => {
    if (!doctorId) return;
    let socket: Socket;
    try {
      socket = connectSocket();
      socket.on(SOCKET_EVENTS.QUEUE_UPDATED, (data: { doctorId: string }) => {
        if (data.doctorId === doctorId) fetchData();
      });
      socket.on(SOCKET_EVENTS.APPOINTMENT_UPDATE, () => {
        fetchData();
      });
    } catch {
      // ignore
    }
    return () => {
      try { disconnectSocket(); } catch { /* ignore */ }
    };
  }, [doctorId, fetchData]);

  const handleNextPatient = async () => {
    if (!doctorId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next", doctorId, date: today }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || t("queue.queueFailed"));
      }
    } catch {
      alert(t("queue.somethingWrong"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletePatient = async (appointmentId: string) => {
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, status: "completed" }),
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  const total = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "no-show"
  ).length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const remaining = total - completed - appointments.filter((a) => a.status === "serving").length;
  const serving = appointments.filter((a) => a.status === "serving")[0];

  const statCards = [
    { label: t("doctor.todayPatients"), value: total, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { label: t("status.completed"), value: completed, icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" },
    { label: t("admin.remaining"), value: Math.max(0, remaining), icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
    { label: t("doctor.todayIncome"), value: `৳${todayTotalIncome.toLocaleString()}`, icon: Banknote, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/30" },
    { label: "সংগৃহীত", value: `৳${todayCollected.toLocaleString()}`, icon: Banknote, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
      </div>
    );
  }

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

      {/* Next Patient Card */}
      <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{t("queue.currentlyServing")}</p>
              <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">#{currentSerial}</p>
              {serving && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {serving.patientId?.userId?.name || t("roles.patient")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {serving.type === "new" ? t("appointment.newVisit") : t("appointment.followUp")}
                    {serving.notes && ` · ${serving.notes}`}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleNextPatient}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6"
              >
                <ChevronRight className="mr-2 h-5 w-5" />
                {t("queue.nextPatient")}
              </Button>
              {serving && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompletePatient(serving._id)}
                  className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-700"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {t("queue.completePatient")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Patient List */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-0">
          <div className="p-4 border-b dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t("queue.todaysPatientList")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">{t("appointment.serial")}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">{t("common.name")}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">{t("common.type")}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {appointments
                  .filter((a) => a.status !== "cancelled")
                  .sort((a, b) => a.serialNumber - b.serialNumber)
                  .map((apt) => (
                    <tr
                      key={apt._id}
                      className={`border-b last:border-0 dark:border-slate-700 ${
                        apt.status === "serving" ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold dark:text-white">#{apt.serialNumber}</td>
                      <td className="py-2.5 px-4 dark:text-slate-300">{apt.patientId?.userId?.name || "—"}</td>
                      <td className="py-2.5 px-4 dark:text-slate-300">
                        {apt.type === "new" ? t("appointment.newVisit") : t("appointment.followUp")}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={
                            apt.status === "completed"
                              ? "success"
                              : apt.status === "serving"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {t(`status.${apt.status}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 dark:text-slate-500">
                      {t("queue.noPatientsToday")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DoctorPage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <DoctorDashboardContent />
    </RoleGuard>
  );
}
