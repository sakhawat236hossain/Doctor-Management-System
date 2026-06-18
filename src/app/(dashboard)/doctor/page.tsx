"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
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
  const { session } = useAuth();
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [currentSerial, setCurrentSerial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch doctor ID if not yet known
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

  // Socket.io listener
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
        alert(data.error || "Failed to advance queue");
      }
    } catch {
      alert("Something went wrong");
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

  // Stats
  const total = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "no-show"
  ).length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const remaining = total - completed - appointments.filter((a) => a.status === "serving").length;
  const serving = appointments.filter((a) => a.status === "serving")[0];

  // Today's income estimate
  const todayIncome = completed * 500; // placeholder — real calc from payments

  const statCards = [
    { label: "আজকের রোগী", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "সম্পন্ন", value: completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "বাকি", value: Math.max(0, remaining), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "আজকের আয়", value: `৳${todayIncome.toLocaleString()}`, icon: Banknote, color: "text-teal-600", bg: "bg-teal-50" },
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

      {/* Next Patient Card */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">এখন চলছে — Current Serial</p>
              <p className="text-5xl font-bold text-blue-600">#{currentSerial}</p>
              {serving && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">
                    {serving.patientId?.userId?.name || "রোগী"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {serving.type === "new" ? "নতুন রোগী" : "ফলো-আপ"}
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
                পরবর্তী রোগী
              </Button>
              {serving && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompletePatient(serving._id)}
                  className="text-green-600 border-green-300"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  সম্পন্ন করুন
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Patient List */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">আজকের রোগীদের তালিকা</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">Serial</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">নাম</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">ধরন</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {appointments
                  .filter((a) => a.status !== "cancelled")
                  .sort((a, b) => a.serialNumber - b.serialNumber)
                  .map((apt) => (
                    <tr
                      key={apt._id}
                      className={`border-b last:border-0 ${
                        apt.status === "serving" ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold">#{apt.serialNumber}</td>
                      <td className="py-2.5 px-4">{apt.patientId?.userId?.name || "—"}</td>
                      <td className="py-2.5 px-4">
                        {apt.type === "new" ? "নতুন" : "ফলো-আপ"}
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
                          {apt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      আজ কোনো রোগী নেই
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
