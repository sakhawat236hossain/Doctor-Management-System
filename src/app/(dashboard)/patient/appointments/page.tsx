"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle,
  RotateCcw,
} from "lucide-react";

interface AppointmentData {
  _id: string;
  serialNumber: number;
  appointmentDate: string;
  status: string;
  type: string;
  doctorId?: {
    _id: string;
    userId?: { name: string };
    speciality: string;
    visitFee: number;
    followUpFee: number;
  };
}

interface PaymentData {
  _id: string;
  appointmentId: string;
  amount: number;
  status: string;
}

type TabKey = "upcoming" | "past" | "cancelled";
const PER_PAGE = 10;

const TABS: { key: TabKey; label: string }[] = [
  { key: "upcoming", label: "আসন্ন" },
  { key: "past", label: "গত" },
  { key: "cancelled", label: "বাতিল" },
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

function AppointmentsContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [payments, setPayments] = useState<Record<string, PaymentData>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = now.toISOString().split("T")[0];

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setAppointments(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch payments for fee status
    fetch("/api/payments")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const map: Record<string, PaymentData> = {};
          for (const p of res.data as PaymentData[]) {
            map[p.appointmentId] = p;
          }
          setPayments(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Filter by tab
  const filtered = appointments.filter((a) => {
    if (activeTab === "cancelled") return a.status === "cancelled";
    if (activeTab === "upcoming")
      return (
        ["confirmed", "pending", "serving"].includes(a.status) &&
        new Date(a.appointmentDate).toISOString().split("T")[0] >= todayStr
      );
    // past
    return (
      a.status === "completed" ||
      a.status === "no-show" ||
      (["confirmed", "pending"].includes(a.status) &&
        new Date(a.appointmentDate).toISOString().split("T")[0] < todayStr)
    );
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page on tab change
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
  };

  const cancelAppointment = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      } else {
        alert(data.error || "Failed to cancel");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">আমার অ্যাপয়েন্টমেন্ট</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">
              (
              {appointments.filter((a) => {
                if (tab.key === "cancelled") return a.status === "cancelled";
                if (tab.key === "upcoming")
                  return (
                    ["confirmed", "pending", "serving"].includes(a.status) &&
                    new Date(a.appointmentDate).toISOString().split("T")[0] >= todayStr
                  );
                return (
                  a.status === "completed" ||
                  a.status === "no-show" ||
                  (["confirmed", "pending"].includes(a.status) &&
                    new Date(a.appointmentDate).toISOString().split("T")[0] < todayStr)
                );
              }).length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
          </CardContent>
        </Card>
      )}

      {/* Appointment Cards */}
      {!loading && paginated.length > 0 && (
        <div className="space-y-3">
          {paginated.map((apt) => {
            const payment = payments[apt._id];
            const isPaid = payment?.status === "paid";
            const fee =
              apt.type === "new"
                ? apt.doctorId?.visitFee
                : apt.doctorId?.followUpFee;
            const canCancel = ["confirmed", "pending"].includes(apt.status);

            return (
              <Card
                key={apt._id}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left: Doctor info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/patient/appointments/${apt._id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        <p className="font-semibold text-gray-900">
                          Dr. {apt.doctorId?.userId?.name || "Unknown"}
                        </p>
                      </Link>
                      <p className="text-xs text-gray-500">
                        {apt.doctorId?.speciality}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(apt.appointmentDate).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )}
                        </span>
                        <span>Serial #{apt.serialNumber}</span>
                        <span>{apt.type === "new" ? "নতুন" : "ফলো-আপ"}</span>
                        {statusBadge(apt.status)}
                      </div>
                    </div>

                    {/* Right: Fee + Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {payment && (
                        <div className="text-xs">
                          <span className="text-gray-500">ফি: ৳{payment.amount} </span>
                          {isPaid ? (
                            <span className="text-green-600 font-medium">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="text-orange-600 font-medium">
                              ✗ Due
                            </span>
                          )}
                        </div>
                      )}
                      {!payment && fee !== undefined && (
                        <div className="text-xs text-gray-500">
                          ফি: ৳{fee}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {canCancel && (
                          <>
                            {confirmCancelId === apt._id ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => cancelAppointment(apt._id)}
                                  disabled={cancellingId === apt._id}
                                  className="h-7 text-xs"
                                >
                                  {cancellingId === apt._id
                                    ? "..."
                                    : "নিশ্চিত"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmCancelId(null)}
                                  className="h-7 text-xs"
                                >
                                  না
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmCancelId(apt._id)}
                                className="h-7 text-xs text-red-600"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                বাতিল করুন
                              </Button>
                            )}
                          </>
                        )}

                        {apt.status === "completed" && apt.doctorId?._id && (
                          <Link href={`/patient/doctors`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              আবার বুক করুন
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <AppointmentsContent />
    </RoleGuard>
  );
}
