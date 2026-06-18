"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowLeft,
  GraduationCap,
  MapPin,
  Phone,
  Clock,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { IDoctor, IUser, IScheduleSlot } from "@/types";

const DAY_FULL: Record<string, string> = {
  Sat: "Saturday",
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
};

export default function DoctorDetailPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<(IDoctor & { userId: IUser }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/doctors/${doctorId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDoctor(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardContent className="p-8">
              <div className="flex gap-6">
                <Skeleton className="h-28 w-28 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Doctor not found</h1>
          <p className="mt-2 text-gray-500">The doctor you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild className="mt-4">
            <Link href="/doctors">Back to Doctors</Link>
          </Button>
        </div>
      </div>
    );
  }

  const user = doctor.userId;
  const name = user?.name || "Unknown Doctor";
  const profileImage = doctor.profileImage || user?.profileImage;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isAvailable = doctor.status === "available";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">MediFlow 🏥</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/doctors">
                <ArrowLeft className="mr-1 h-4 w-4" />
                All Doctors
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/doctors" className="hover:text-blue-600">Doctors</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{name}</span>
        </div>

        {/* Doctor Hero */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-blue-100 mx-auto sm:mx-0">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-blue-600">
                    {initials}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                  <Badge variant={isAvailable ? "success" : "secondary"}>
                    {isAvailable ? "Available" : doctor.status}
                  </Badge>
                </div>
                <p className="text-blue-600 font-medium mb-2">{doctor.speciality}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-600 mb-3">
                  <GraduationCap className="h-4 w-4" />
                  {doctor.degree.join(", ")}
                </div>
                {doctor.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed max-w-lg">{doctor.bio}</p>
                )}
                {doctor.chamberAddress && (
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {doctor.chamberAddress}
                  </div>
                )}
                {doctor.chamberPhone && (
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-600 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {doctor.chamberPhone}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fee Card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Consultation Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Visit</span>
                <span className="text-lg font-bold text-gray-900">৳{doctor.visitFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Follow-up</span>
                <span className="text-lg font-bold text-gray-900">৳{doctor.followUpFee}</span>
              </div>
              <Separator />
              <Button
                asChild
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                size="lg"
              >
                <Link href={`/doctors/${doctorId}/book`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doctor.schedule.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Day</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Time</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-500">Max Patients</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctor.schedule.map((slot: IScheduleSlot, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {DAY_FULL[slot.day] || slot.day}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {slot.startTime} — {slot.endTime}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant="outline">{slot.maxPatients}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No schedule available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
