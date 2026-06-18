"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  Activity,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  User,
  Phone,
  FileText,
  Banknote,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookingSteps } from "@/components/patient/BookingSteps";
import type { IDoctor, IUser, IScheduleSlot } from "@/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface AvailabilityData {
  available: boolean;
  bookedCount: number;
  maxPatients: number;
  remainingSlots: number;
  timeSlot?: string;
  reason?: string;
}

export default function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // Redirect if not logged in
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/doctors/${doctorId}/book`);
    }
  }, [sessionStatus, router, doctorId]);

  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState<(IDoctor & { userId: IUser }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  // Step 2
  const [apptType, setApptType] = useState<"new" | "follow-up">("new");
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bkash" | "nagad" | "rocket" | "card">("cash");

  // Step 3
  const [result, setResult] = useState<{
    serialNumber: number;
    appointment: { _id: string };
    payment: { amount: number; status: string; method: string };
  } | null>(null);

  // Fetch doctor info
  useEffect(() => {
    fetch(`/api/doctors/${doctorId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setDoctor(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId]);

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      setPatientName(session.user.name || "");
    }
  }, [session]);

  // Check availability when date is selected
  const checkAvailability = useCallback(
    (date: Date) => {
      setCheckingAvail(true);
      setAvailability(null);
      fetch(`/api/appointments/availability?doctorId=${doctorId}&date=${date.toISOString()}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setAvailability(res.data);
        })
        .catch(() => {})
        .finally(() => setCheckingAvail(false));
    },
    [doctorId]
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) checkAvailability(date);
  };

  // Disabled day function
  const isDayDisabled = (date: Date): boolean => {
    // Past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    if (!doctor) return true;

    const dayName = DAY_NAMES[date.getDay()];

    // Check if day is in schedule
    const hasSchedule = doctor.schedule.some((s: IScheduleSlot) => s.day === dayName);
    if (!hasSchedule) return true;

    // Check offDays
    const dateOnly = date.toISOString().split("T")[0];
    const isOff = doctor.offDays.some(
      (off: Date) => new Date(off).toISOString().split("T")[0] === dateOnly
    );
    return isOff;
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!selectedDate || !doctor) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          appointmentDate: selectedDate.toISOString(),
          type: apptType,
          patientName,
          phone,
          notes,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setStep(3);
      } else {
        alert(data.error || "Booking failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const fee = apptType === "new" ? (doctor?.visitFee || 0) : (doctor?.followUpFee || 0);

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Doctor not found</h1>
          <Button asChild className="mt-4">
            <Link href="/doctors">Browse Doctors</Link>
          </Button>
        </div>
      </div>
    );
  }

  const doctorName = doctor.userId?.name || "Doctor";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">MediFlow 🏥</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href={`/doctors/${doctorId}`}>
              Doctor Profile
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Appointment</h1>
        <p className="text-gray-500 text-sm mb-8">
          with <span className="font-medium text-blue-600">{doctorName}</span> — {doctor.speciality}
        </p>

        <BookingSteps
          currentStep={step}
          showActions={false}
        />

        {/* ━━━ STEP 1: Date Selection ━━━ */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                তারিখ বেছে নিন
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDayDisabled}
                  showOutsideDays={false}
                  className="rounded-lg border p-4"
                />
              </div>

              {/* Availability info */}
              {selectedDate && (
                <div className="mt-4">
                  <Separator className="mb-4" />
                  {checkingAvail ? (
                    <p className="text-center text-sm text-gray-500">Checking availability...</p>
                  ) : availability ? (
                    <div className="text-center">
                      {availability.available ? (
                        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">
                          আজ <span className="font-bold">{availability.remainingSlots}</span> টি সিট বাকি আছে
                          {availability.timeSlot && (
                            <span className="block text-xs text-gray-500 mt-1">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {availability.timeSlot}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-2">
                          {availability.reason || "No slots available for this date"}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Next button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedDate || !availability?.available}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ━━━ STEP 2: Details Form ━━━ */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                বিস্তারিত দিন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Selected date */}
              <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg px-4 py-2.5">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {availability?.timeSlot && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {availability.timeSlot}
                  </Badge>
                )}
              </div>

              {/* Appointment Type */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Appointment Type
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApptType("new")}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      apptType === "new"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">New Visit</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">৳{doctor.visitFee}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApptType("follow-up")}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      apptType === "follow-up"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">Follow-up</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">৳{doctor.followUpFee}</p>
                  </button>
                </div>
              </div>

              {/* Patient Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Patient Name
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full name"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any symptoms or special requirements..."
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Payment Method
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "cash" as const, label: "Cash at Chamber", icon: Banknote },
                    { value: "bkash" as const, label: "bKash", icon: CreditCard },
                    { value: "nagad" as const, label: "Nagad", icon: CreditCard },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-colors ${
                        paymentMethod === m.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <m.icon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Summary */}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Fee</span>
                <span className="text-xl font-bold text-gray-900">৳{fee}</span>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!patientName || !phone || submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <CheckCircle2 className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ━━━ STEP 3: Confirmation ━━━ */}
        {step === 3 && result && (
          <Card className="border-green-200">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে!
              </h2>
              <p className="text-sm text-gray-500 mb-6">Your appointment has been successfully booked</p>

              {/* Serial Number */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-blue-700 mb-1">আপনার সিরিয়াল নম্বর</p>
                <p className="text-5xl font-bold text-blue-600">#{result.serialNumber}</p>
              </div>

              {/* Summary */}
              <div className="text-left space-y-3 bg-gray-50 rounded-lg p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Doctor</span>
                  <span className="font-medium text-gray-900">{doctorName}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-900">
                    {selectedDate?.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">
                    {apptType === "new" ? "New Visit" : "Follow-up"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium text-gray-900">{availability?.timeSlot}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fee</span>
                  <span className="font-bold text-gray-900">৳{result.payment.amount}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment</span>
                  <Badge variant={result.payment.status === "paid" ? "success" : "warning"}>
                    {result.payment.method.toUpperCase()} — {result.payment.status}
                  </Badge>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/patient/appointments">
                    আমার অ্যাপয়েন্টমেন্ট দেখুন
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/doctors">Browse More Doctors</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
