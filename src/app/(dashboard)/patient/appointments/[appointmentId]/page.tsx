"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { LiveQueueWidget } from "@/components/patient/LiveQueueWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Stethoscope,
  XCircle,
  CreditCard,
} from "lucide-react";

interface AppointmentDetail {
  _id: string;
  serialNumber: number;
  appointmentDate: string;
  status: string;
  type: string;
  notes: string;
  timeSlot: string;
  doctorId?: {
    _id: string;
    userId?: { name: string };
    speciality: string;
    visitFee: number;
    followUpFee: number;
    chamberAddress: string;
    chamberPhone: string;
    degree: string[];
  };
  patientId?: {
    userId?: { name: string; phone: string };
  };
}

interface PaymentDetail {
  _id: string;
  amount: number;
  status: string;
  method: string;
  paidAt?: string;
}

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

function AppointmentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  useEffect(() => {
    fetch(`/api/appointments`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const apt = res.data.find(
            (a: AppointmentDetail) => a._id === appointmentId
          );
          setAppointment(apt || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch payment for this appointment
    fetch("/api/payments")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const pay = res.data.find(
            (p: PaymentDetail & { appointmentId: string }) =>
              p.appointmentId === appointmentId
          );
          if (pay) setPayment(pay);
        }
      })
      .catch(() => {});
  }, [appointmentId]);

  const isToday =
    appointment &&
    new Date(appointment.appointmentDate).toISOString().split("T")[0] ===
      todayStr;
  const canCancel =
    appointment && ["confirmed", "pending"].includes(appointment.status);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setAppointment((prev) =>
          prev ? { ...prev, status: "cancelled" } : null
        );
        setShowConfirm(false);
      } else {
        alert(data.error || "Failed to cancel");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <p className="text-gray-500">Appointment not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/patient/appointments")}
          >
            Back to appointments
          </Button>
        </CardContent>
      </Card>
    );
  }

  const fee =
    appointment.type === "new"
      ? appointment.doctorId?.visitFee
      : appointment.doctorId?.followUpFee;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/patient/appointments")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        ফিরে যান
      </button>

      {/* Appointment Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl">
                Dr. {appointment.doctorId?.userId?.name || "Unknown"}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {appointment.doctorId?.speciality}
                {appointment.doctorId?.degree?.length
                  ? ` — ${appointment.doctorId.degree.join(", ")}`
                  : ""}
              </p>
            </div>
            {statusBadge(appointment.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">তারিখ</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(appointment.appointmentDate).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "short", year: "numeric" }
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Serial</p>
              <p className="text-sm font-bold text-blue-600">
                #{appointment.serialNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ধরন</p>
              <p className="text-sm font-medium">
                {appointment.type === "new" ? "নতুন রোগী" : "ফলো-আপ"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">সময়</p>
              <p className="text-sm font-medium">{appointment.timeSlot}</p>
            </div>
          </div>

          {appointment.notes && (
            <div>
              <p className="text-xs text-gray-500">নোট</p>
              <p className="text-sm text-gray-700">{appointment.notes}</p>
            </div>
          )}

          {/* Cancel button */}
          {canCancel && (
            <div className="pt-2">
              {showConfirm ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-red-600 font-medium">
                    আপনি কি নিশ্চিত বাতিল করতে চান?
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "হ্যাঁ, বাতিল করুন"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConfirm(false)}
                  >
                    না
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="text-red-600"
                  onClick={() => setShowConfirm(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  বাতিল করুন
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <p className="font-medium text-gray-900">Payment</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-bold text-gray-900">
                ৳{payment?.amount || fee || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              {payment?.status === "paid" ? (
                <Badge variant="success">Paid ✓</Badge>
              ) : (
                <Badge variant="warning">Due ✗</Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Method</p>
              <p className="font-medium capitalize">
                {payment?.method || "cash"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Queue (if today's appointment) */}
      {isToday && appointment.doctorId?._id && (
        <LiveQueueWidget
          doctorId={appointment.doctorId._id}
          patientSerial={appointment.serialNumber}
        />
      )}

      {/* Doctor Info Card */}
      {appointment.doctorId && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="h-4 w-4 text-gray-500" />
              <p className="font-medium text-gray-900">Doctor Info</p>
            </div>
            <Separator className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Stethoscope className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">
                    {appointment.doctorId.userId?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {appointment.doctorId.speciality}
                  </p>
                </div>
              </div>
              {appointment.doctorId.chamberAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-gray-700">
                    {appointment.doctorId.chamberAddress}
                  </p>
                </div>
              )}
              {appointment.doctorId.chamberPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-gray-700">
                    {appointment.doctorId.chamberPhone}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AppointmentDetailPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <AppointmentDetailContent />
    </RoleGuard>
  );
}
