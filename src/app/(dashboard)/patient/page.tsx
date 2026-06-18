"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { LiveQueueWidget } from "@/components/patient/LiveQueueWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus,
  History,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface UpcomingAppointment {
  _id: string;
  serialNumber: number;
  appointmentDate: string;
  status: string;
  type: string;
  doctorId?: {
    _id: string;
    userId?: { name: string };
    speciality: string;
  };
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

function PatientDashboardContent() {
  const { session } = useAuth();
  const userName = session?.user?.name || "রোগী";

  const [upcoming, setUpcoming] = useState<UpcomingAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const now = new Date();
          // Find next upcoming (confirmed/serving) appointment
          const next = res.data.find(
            (a: UpcomingAppointment) =>
              ["confirmed", "serving", "pending"].includes(a.status) &&
              new Date(a.appointmentDate) >= new Date(todayStr)
          );
          setUpcoming(next || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [todayStr]);

  const isTodayAppointment =
    upcoming &&
    new Date(upcoming.appointmentDate).toISOString().split("T")[0] === todayStr;

  const quickLinks = [
    {
      href: "/patient/doctors",
      label: "নতুন বুকিং",
      icon: CalendarPlus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      href: "/patient/appointments",
      label: "ইতিহাস",
      icon: History,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      href: "/patient/doctors",
      label: "ডাক্তার খুঁজুন",
      icon: Search,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          স্বাগতম, {userName}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Upcoming Appointment Card */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-400">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
            <p className="text-sm">Loading appointments...</p>
          </CardContent>
        </Card>
      ) : upcoming ? (
        <Card className="border-blue-200">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  পরবর্তী অ্যাপয়েন্টমেন্ট
                </p>
                <p className="text-lg font-bold text-gray-900">
                  Dr. {upcoming.doctorId?.userId?.name || "Unknown"}
                </p>
                <p className="text-sm text-gray-500">
                  {upcoming.doctorId?.speciality}
                </p>
              </div>
              {statusBadge(upcoming.status)}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar className="h-4 w-4" />
                {new Date(upcoming.appointmentDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle2 className="h-4 w-4" />
                Serial #{upcoming.serialNumber}
              </div>
            </div>

            {/* Live Queue Widget for today's appointment */}
            {isTodayAppointment && upcoming.doctorId?._id && (
              <LiveQueueWidget
                doctorId={upcoming.doctorId._id}
                patientSerial={upcoming.serialNumber}
              />
            )}

            <Link
              href={`/patient/appointments/${upcoming._id}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              বিস্তারিত দেখুন →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-3">
              কোনো আসন্ন অ্যাপয়েন্টমেন্ট নেই
            </p>
            <Link
              href="/patient/doctors"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <CalendarPlus className="h-4 w-4" />
              নতুন বুকিং করুন
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        {quickLinks.map((link) => (
          <Link key={link.label} href={link.href}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div
                  className={`h-10 w-10 rounded-full ${link.bg} flex items-center justify-center`}
                >
                  <link.icon className={`h-5 w-5 ${link.color}`} />
                </div>
                <p className="text-xs font-medium text-gray-700">
                  {link.label}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PatientPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <PatientDashboardContent />
    </RoleGuard>
  );
}
