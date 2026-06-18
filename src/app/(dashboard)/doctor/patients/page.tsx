"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { Phone, User } from "lucide-react";
import type { Socket } from "socket.io-client";

interface AppointmentRow {
  _id: string;
  serialNumber: number;
  type: string;
  status: string;
  notes: string;
  patientId?: {
    userId?: { name: string; phone: string };
  };
}

type FilterKey = "all" | "waiting" | "serving" | "completed" | "no-show";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "সবাই" },
  { key: "waiting", label: "বাকি" },
  { key: "serving", label: "চলমান" },
  { key: "completed", label: "সম্পন্ন" },
  { key: "no-show", label: "No-Show" },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge variant="secondary">নিশ্চিত</Badge>;
    case "pending":
      return <Badge variant="outline">অপেক্ষমান</Badge>;
    case "serving":
      return <Badge className="bg-blue-100 text-blue-800">চলমান</Badge>;
    case "completed":
      return <Badge variant="success">সম্পন্ন</Badge>;
    case "cancelled":
      return <Badge variant="destructive">বাতিল</Badge>;
    case "no-show":
      return <Badge variant="outline">No-Show</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

function DoctorPatientsContent() {
  const { session } = useAuth();
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(() => {
    fetch(`/api/appointments?doctorId=${doctorId}&date=${today}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAppointments(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId, today]);

  // Get doctor ID
  useEffect(() => {
    fetch(`/api/doctors?search=${encodeURIComponent(session?.user?.name || "")}&limit=1`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) setDoctorId(res.data[0]._id);
      })
      .catch(() => {});
  }, [session?.user?.name]);

  useEffect(() => {
    if (doctorId) fetchData();
  }, [doctorId, fetchData]);

  // Socket listener
  useEffect(() => {
    if (!doctorId) return;
    let socket: Socket;
    try {
      socket = connectSocket();
      socket.on(SOCKET_EVENTS.QUEUE_UPDATED, () => fetchData());
      socket.on(SOCKET_EVENTS.APPOINTMENT_UPDATE, () => fetchData());
    } catch { /* ignore */ }
    return () => { try { disconnectSocket(); } catch { /* ignore */ } };
  }, [doctorId, fetchData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch { /* ignore */ }
  };

  const filtered = appointments.filter((a) => {
    if (a.status === "cancelled") return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "waiting") return ["confirmed", "pending"].includes(a.status);
    if (activeFilter === "serving") return a.status === "serving";
    if (activeFilter === "completed") return a.status === "completed";
    if (activeFilter === "no-show") return a.status === "no-show";
    return true;
  }).sort((a, b) => a.serialNumber - b.serialNumber);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">আজকের রোগী</h1>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeFilter === f.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
            <span className="ml-1 text-xs opacity-60">
              ({appointments.filter((a) => {
                if (a.status === "cancelled") return false;
                if (f.key === "all") return true;
                if (f.key === "waiting") return ["confirmed", "pending"].includes(a.status);
                if (f.key === "serving") return a.status === "serving";
                if (f.key === "completed") return a.status === "completed";
                if (f.key === "no-show") return a.status === "no-show";
                return false;
              }).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Serial #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">নাম</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ধরন</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">স্ট্যাটাস</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ফি</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">নোট</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>কোনো রোগী নেই</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((apt) => (
                    <tr
                      key={apt._id}
                      className={`border-b last:border-0 ${
                        apt.status === "serving" ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-bold">#{apt.serialNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{apt.patientId?.userId?.name || "—"}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {apt.patientId?.userId?.phone || "—"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {apt.type === "new" ? "নতুন" : "ফলো-আপ"}
                      </td>
                      <td className="py-3 px-4">{statusBadge(apt.status)}</td>
                      <td className="py-3 px-4 text-gray-500">—</td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-[120px] truncate">
                        {apt.notes || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          {["confirmed", "pending"].includes(apt.status) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(apt._id, "serving")}
                                className="h-7 text-xs"
                              >
                                ডাকুন
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(apt._id, "completed")}
                                className="h-7 text-xs text-green-600"
                              >
                                সম্পন্ন
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(apt._id, "no-show")}
                                className="h-7 text-xs text-amber-600"
                              >
                                No-Show
                              </Button>
                            </>
                          )}
                          {apt.status === "serving" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(apt._id, "completed")}
                                className="h-7 text-xs text-green-600"
                              >
                                সম্পন্ন
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(apt._id, "no-show")}
                                className="h-7 text-xs text-amber-600"
                              >
                                No-Show
                              </Button>
                            </>
                          )}
                          {["completed", "no-show"].includes(apt.status) && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DoctorPatientsPage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <DoctorPatientsContent />
    </RoleGuard>
  );
}
