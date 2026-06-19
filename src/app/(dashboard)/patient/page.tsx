"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { LiveQueueWidget } from "@/components/patient/LiveQueueWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
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

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  switch (status) {
    case "confirmed":
      return <Badge variant="secondary">{t("status.confirmed")}</Badge>;
    case "serving":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{t("status.serving")}</Badge>;
    case "completed":
      return <Badge variant="success">{t("status.completed")}</Badge>;
    case "cancelled":
      return <Badge variant="destructive">{t("status.cancelled")}</Badge>;
    case "no-show":
      return <Badge variant="outline">{t("status.noShow")}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PatientDashboardContent() {
  const t = useT();
  const { session } = useAuth();
  const userName = session?.user?.name || t("roles.patient");

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
      label: t("appointment.newBooking"),
      icon: CalendarPlus,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      href: "/patient/appointments",
      label: t("appointment.history"),
      icon: History,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-900/30",
    },
    {
      href: "/patient/doctors",
      label: t("doctor.findDoctor"),
      icon: Search,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t("patient.welcome", { name: userName })}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {new Date().toLocaleDateString("bn-BD", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Upcoming Appointment Card */}
      {loading ? (
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-6 text-center text-gray-400 dark:text-slate-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-slate-600 animate-pulse" />
            <p className="text-sm">{t("common.loading")}</p>
          </CardContent>
        </Card>
      ) : upcoming ? (
        <Card className="border-blue-200 dark:border-blue-800 dark:bg-slate-800">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">
                  {t("appointment.upcomingAppointment")}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  Dr. {upcoming.doctorId?.userId?.name || t("common.unknown")}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {upcoming.doctorId?.speciality}
                </p>
              </div>
              <StatusBadge status={upcoming.status} t={t} />
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                <Calendar className="h-4 w-4" />
                {new Date(upcoming.appointmentDate).toLocaleDateString("bn-BD", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4" />
                {t("appointment.serial")} #{upcoming.serialNumber}
              </div>
            </div>

            {isTodayAppointment && upcoming.doctorId?._id && (
              <LiveQueueWidget
                doctorId={upcoming.doctorId._id}
                patientSerial={upcoming.serialNumber}
              />
            )}

            <Link
              href={`/patient/appointments/${upcoming._id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              {t("common.viewDetails")} →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400 mb-3">
              {t("appointment.noUpcoming")}
            </p>
            <Link
              href="/patient/doctors"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <CalendarPlus className="h-4 w-4" />
              {t("appointment.bookNow")}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        {quickLinks.map((link) => (
          <Link key={link.label} href={link.href}>
            <Card className="hover:shadow-md transition-shadow h-full dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div
                  className={`h-10 w-10 rounded-full ${link.bg} flex items-center justify-center`}
                >
                  <link.icon className={`h-5 w-5 ${link.color}`} />
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-slate-300">
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
