"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  UserPlus,
  Calendar,
  Stethoscope,
  CheckCircle2,
  X,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PrintToken } from "@/components/receptionist/PrintToken";
import { useT } from "@/lib/i18n";
import type { IDoctor, IUser, IPatient } from "@/types";

interface DoctorWithUser extends Omit<IDoctor, "userId"> {
  userId: IUser;
}

interface PatientWithUser extends Omit<IPatient, "userId"> {
  userId: IUser;
}

interface BookingResult {
  serialNumber: number;
  appointment: { _id: string };
  payment: { amount: number; status: string; method: string };
}

export function QuickBookForm() {
  const t = useT();
  // Patient search
  const [phoneInput, setPhoneInput] = useState("");
  const [patientResults, setPatientResults] = useState<PatientWithUser[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");

  // Doctor
  const [doctors, setDoctors] = useState<DoctorWithUser[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  // Booking
  const [visitType, setVisitType] = useState<"new" | "follow-up">("new");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch available doctors
  useEffect(() => {
    fetch("/api/doctors?availableToday=true&limit=50")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDoctors(res.data);
      })
      .catch(() => {});
  }, []);

  // Phone search with debounce
  const searchPatient = useCallback((phone: string) => {
    if (phone.length < 3) {
      setPatientResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/patients?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPatientResults(res.data);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, []);

  const handlePhoneChange = (value: string) => {
    setPhoneInput(value);
    setSelectedPatient(null);
    setNewPatientMode(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPatient(value), 400);
  };

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
  const fee = selectedDoctor
    ? visitType === "new"
      ? selectedDoctor.visitFee
      : selectedDoctor.followUpFee
    : 0;

  const handleSubmit = async () => {
    if (!selectedDoctorId) return;

    const patientName = selectedPatient
      ? selectedPatient.userId?.name
      : newPatientName;
    const phone = selectedPatient
      ? selectedPatient.userId?.phone
      : newPatientPhone;

    if (!patientName || !phone) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          appointmentDate: new Date(appointmentDate).toISOString(),
          type: visitType,
          patientName,
          phone,
          notes: "",
          paymentMethod: "cash",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert(data.error || "Booking failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setPhoneInput("");
    setSelectedPatient(null);
    setPatientResults([]);
    setSelectedDoctorId("");
    setVisitType("new");
    setAppointmentDate(new Date().toISOString().split("T")[0]);
    setNewPatientMode(false);
    setNewPatientName("");
    setNewPatientPhone("");
  };

  // ━━━ SUCCESS VIEW ━━━
  if (result) {
    const doctorName = selectedDoctor?.userId?.name || "Doctor";
    const patientName = selectedPatient
      ? selectedPatient.userId?.name
      : newPatientName;

    return (
      <Card className="border-green-200">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {t("appointment.bookingComplete")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            {t("appointment.bookingSuccessMsg")}
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-5 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">{t("appointment.serialNumber")}</p>
            <p className="text-5xl font-bold text-blue-600">
              #{result.serialNumber}
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            <PrintToken
              doctorName={doctorName}
              patientName={patientName}
              serialNumber={result.serialNumber}
              date={new Date(appointmentDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              type={visitType}
              fee={fee}
            />
          </div>

          <Button onClick={resetForm} variant="outline">
            {t("token.newBookingBtn")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ━━━ BOOKING FORM ━━━
  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <Calendar className="h-5 w-5 text-blue-600" />
          {t("receptionist.quickBook")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Step 1: Patient Search */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
            <Phone className="h-3.5 w-3.5" />
            {t("patient.patientPhone")}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("patient.searchPhonePlaceholder")}
              value={phoneInput}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searching && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{t("patient.searching")}</p>
          )}

          {selectedPatient && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {selectedPatient.userId?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {selectedPatient.userId?.phone} · {selectedPatient.userId?.email}
                </p>
              </div>
              <Badge variant="success">{t("common.found")}</Badge>
            </div>
          )}

          {phoneInput.length >= 3 &&
            !searching &&
            !selectedPatient &&
            patientResults.length === 0 &&
            !newPatientMode && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-2">
                  {t("patient.noPatientFound")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewPatientMode(true);
                    setNewPatientPhone(phoneInput);
                  }}
                >
                  <UserPlus className="mr-1 h-3.5 w-3.5" />
                  {t("patient.addNewPatient")}
                </Button>
              </div>
            )}

          {/* Patient Results Dropdown */}
          {patientResults.length > 0 && !selectedPatient && (
            <div className="mt-1 border rounded-lg divide-y max-h-40 overflow-y-auto">
              {patientResults.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(p);
                    setPatientResults([]);
                    setPhoneInput(p.userId?.phone || "");
                    setNewPatientMode(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <p className="font-medium text-sm dark:text-white">{p.userId?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{p.userId?.phone}</p>
                </button>
              ))}
            </div>
          )}

          {/* New Patient Inline Form */}
          {newPatientMode && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {t("patient.newPatientInfo")}
                </span>
                <button
                  type="button"
                  onClick={() => setNewPatientMode(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input
                placeholder={t("common.name")}
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
              />
              <Input
                placeholder={t("common.phone")}
                value={newPatientPhone}
                onChange={(e) => setNewPatientPhone(e.target.value)}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Step 2: Doctor Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
            <Stethoscope className="h-3.5 w-3.5" />
            {t("roles.doctor")}
          </Label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background dark:bg-slate-700 dark:border-slate-600 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("token.selectDoctor")}</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.userId?.name} — {d.speciality} (৳{d.visitFee})
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Visit Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-2 block">
            {t("token.visitType")}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisitType("new")}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                visitType === "new"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
              }`}
            >
              <p className="font-medium text-sm dark:text-white">{t("appointment.newVisit")}</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                ৳{selectedDoctor?.visitFee || "—"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setVisitType("follow-up")}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                visitType === "follow-up"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
              }`}
            >
              <p className="font-medium text-sm dark:text-white">{t("appointment.followUp")}</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                ৳{selectedDoctor?.followUpFee || "—"}
              </p>
            </button>
          </div>
        </div>

        {/* Step 4: Date */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1 block">
            {t("common.date")}
          </Label>
          <Input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <Separator />

        {/* Fee summary */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-slate-400">{t("token.totalFee")}</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">৳{fee}</span>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            !selectedDoctorId ||
            (!selectedPatient && !newPatientMode) ||
            (newPatientMode && (!newPatientName || !newPatientPhone))
          }
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              {t("appointment.booking")}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t("appointment.confirmBooking")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
