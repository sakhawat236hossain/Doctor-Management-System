"use client";

import { useState, useEffect, useCallback } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserCheck,
  UserX,
  SkipForward,
  Pause,
  Play,
  XCircle,
  ChevronRight,
} from "lucide-react";
import type { Socket } from "socket.io-client";

interface DoctorWithUser {
  _id: string;
  userId: { _id: string; name: string };
  speciality: string;
  status: string;
}

interface QueueData {
  _id: string;
  doctorId: { _id: string; userId: { name: string } };
  date: string;
  currentSerial: number;
  totalBooked: number;
  status: "open" | "paused" | "closed";
}

interface AppointmentRow {
  _id: string;
  serialNumber: number;
  type: string;
  status: string;
  patientId?: { userId?: { name: string } };
}

const statusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge variant="secondary">নিশ্চিত</Badge>;
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

function QueueManagerContent() {
  const [doctors, setDoctors] = useState<DoctorWithUser[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Fetch doctors working today
  useEffect(() => {
    fetch(`/api/doctors?availableToday=true&limit=50`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setDoctors(res.data);
          if (res.data.length > 0) setSelectedDoctorId(res.data[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch queue + appointments when doctor changes
  const fetchQueueData = useCallback(() => {
    if (!selectedDoctorId) return;
    Promise.all([
      fetch(`/api/queue?doctorId=${selectedDoctorId}&date=${today}`).then((r) =>
        r.json()
      ),
      fetch(
        `/api/appointments?doctorId=${selectedDoctorId}&date=${today}`
      ).then((r) => r.json()),
    ]).then(([queueRes, apptRes]) => {
      if (queueRes.success && queueRes.data.length > 0) {
        setQueue(queueRes.data[0]);
      } else {
        setQueue(null);
      }
      if (apptRes.success) {
        setAppointments(apptRes.data);
      }
    });
  }, [selectedDoctorId, today]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Socket.io real-time listener
  useEffect(() => {
    let socket: Socket;
    try {
      socket = connectSocket();
      socket.on(SOCKET_EVENTS.QUEUE_UPDATED, () => {
        fetchQueueData();
      });
      socket.on(SOCKET_EVENTS.DOCTOR_STATUS, () => {
        fetchQueueData();
      });
    } catch {
      // Socket not available, ignore
    }
    return () => {
      try {
        disconnectSocket();
      } catch {
        // ignore
      }
    };
  }, [fetchQueueData]);

  // API actions
  const doQueueAction = async (action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          doctorId: selectedDoctorId,
          date: today,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQueueData();
      } else {
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchQueueData();
    } catch {
      // ignore
    }
  };

  const toggleDoctorStatus = async () => {
    if (!selectedDoctorId) return;
    const newStatus =
      doctors.find((d) => d._id === selectedDoctorId)?.status === "available"
        ? "unavailable"
        : "available";

    try {
      await fetch(`/api/doctors/${selectedDoctorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      // Refresh doctors
      fetch(`/api/doctors?availableToday=true&limit=50`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setDoctors(res.data);
        });
    } catch {
      // ignore
    }
  };

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
  const isDoctorIn = selectedDoctor?.status === "available";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Queue Manager</h1>

      {/* Doctor Tabs */}
      {doctors.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {doctors.map((d) => (
            <button
              key={d._id}
              onClick={() => setSelectedDoctorId(d._id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDoctorId === d._id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {d.userId?.name}
              <span className="ml-1 text-xs opacity-75">
                ({d.speciality})
              </span>
            </button>
          ))}
        </div>
      )}

      {doctors.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No doctors working today
          </CardContent>
        </Card>
      )}

      {selectedDoctorId && (
        <>
          {/* Doctor IN/OUT Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedDoctor?.userId?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedDoctor?.speciality}
                  </p>
                </div>
                <Button
                  onClick={toggleDoctorStatus}
                  className={`h-12 px-6 text-base font-medium ${
                    isDoctorIn
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isDoctorIn ? (
                    <>
                      <UserCheck className="mr-2 h-5 w-5" />
                      ডাক্তার ভেতরে আছেন ✓
                    </>
                  ) : (
                    <>
                      <UserX className="mr-2 h-5 w-5" />
                      ডাক্তার বাইরে আছেন ✗
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Queue Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Serial */}
            <Card className="text-center">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">এখন চলছে</p>
                <p className="text-5xl font-bold text-blue-600">
                  #{queue?.currentSerial || 0}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  মোট বুকিং: {queue?.totalBooked || 0}
                </p>
              </CardContent>
            </Card>

            {/* Next Patient Button */}
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <Button
                  onClick={() => doQueueAction("next")}
                  disabled={actionLoading || queue?.status === "closed"}
                  className="h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ChevronRight className="mr-2 h-5 w-5" />
                  পরবর্তী রোগী
                </Button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Next patient in queue
                </p>
              </CardContent>
            </Card>

            {/* Queue Status Toggle */}
            <Card>
              <CardContent className="p-6 flex flex-col justify-center gap-2">
                {queue?.status === "closed" ? (
                  <Button
                    onClick={() => doQueueAction("open")}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Queue চালু করুন
                  </Button>
                ) : (
                  <Button
                    onClick={() => doQueueAction("close")}
                    disabled={actionLoading}
                    variant="destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Queue বন্ধ করুন
                  </Button>
                )}
                <div className="flex gap-2">
                  {queue?.status === "paused" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doQueueAction("resume")}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Resume
                    </Button>
                  ) : queue?.status !== "closed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doQueueAction("pause")}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </Button>
                  ) : null}
                </div>
                <Badge
                  variant={
                    queue?.status === "open"
                      ? "success"
                      : queue?.status === "paused"
                        ? "warning"
                        : "secondary"
                  }
                  className="w-fit mx-auto mt-1"
                >
                  {queue?.status || "no queue"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Patient Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Serial #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        নাম
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        ধরন
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        স্ট্যাটাস
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-gray-400"
                        >
                          No appointments today
                        </td>
                      </tr>
                    ) : (
                      appointments.map((apt) => (
                        <tr
                          key={apt._id}
                          className={`border-b last:border-0 ${
                            apt.status === "serving"
                              ? "bg-blue-50"
                              : apt.status === "completed"
                                ? "bg-green-50/50"
                                : ""
                          }`}
                        >
                          <td className="py-3 px-4 font-bold">
                            #{apt.serialNumber}
                          </td>
                          <td className="py-3 px-4">
                            {apt.patientId?.userId?.name || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {apt.type === "new" ? "নতুন" : "ফলো-আপ"}
                          </td>
                          <td className="py-3 px-4">
                            {statusBadge(apt.status)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1">
                              {apt.status === "confirmed" ||
                              apt.status === "serving" ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateAppointmentStatus(
                                        apt._id,
                                        "completed"
                                      )
                                    }
                                    className="h-7 text-xs"
                                  >
                                    সম্পন্ন
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateAppointmentStatus(
                                        apt._id,
                                        "no-show"
                                      )
                                    }
                                    className="h-7 text-xs text-amber-600"
                                  >
                                    No-Show
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateAppointmentStatus(
                                        apt._id,
                                        "cancelled"
                                      )
                                    }
                                    className="h-7 text-xs text-red-600"
                                  >
                                    বাতিল
                                  </Button>
                                </>
                              ) : (
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
        </>
      )}
    </div>
  );
}

export default function QueuePage() {
  return (
    <RoleGuard allowedRoles={["receptionist", "admin"]}>
      <QueueManagerContent />
    </RoleGuard>
  );
}
