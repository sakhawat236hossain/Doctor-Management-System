"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/shared/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AppointmentRow {
  _id: string;
  serialNumber: number;
  appointmentDate: string;
  timeSlot: string;
  type: string;
  status: string;
  notes: string;
  createdAt: string;
  doctorId?: {
    _id: string;
    userId?: { name: string; email: string; phone: string };
    speciality: string;
    visitFee: number;
    followUpFee: number;
    chamberAddress: string;
  };
  patientId?: {
    _id: string;
    userId?: { name: string; email: string; phone: string };
    gender: string;
    bloodGroup: string;
    dateOfBirth: string;
  };
  payment?: {
    amount: number;
    status: string;
    method: string;
  };
}

interface DoctorOption {
  _id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "সকল স্ট্যাটাস" },
  { value: "pending", label: "অপেক্ষমান" },
  { value: "confirmed", label: "নিশ্চিত" },
  { value: "serving", label: "চিকিৎসাধীন" },
  { value: "completed", label: "সম্পন্ন" },
  { value: "cancelled", label: "বাতিল" },
  { value: "no-show", label: "আসেনি" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "সকল ধরন" },
  { value: "new", label: "নতুন" },
  { value: "follow-up", label: "ফলো-আপ" },
];

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  pending: { label: "অপেক্ষমান", variant: "warning" },
  confirmed: { label: "নিশ্চিত", variant: "default" },
  serving: { label: "চিকিৎসাধীন", variant: "default" },
  completed: { label: "সম্পন্ন", variant: "success" },
  cancelled: { label: "বাতিল", variant: "destructive" },
  "no-show": { label: "আসেনি", variant: "secondary" },
};

export default function AdminAppointmentsPage() {
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedApt, setSelectedApt] = useState<AppointmentRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-appointments", doctorFilter, statusFilter, typeFilter, dateStart, dateEnd],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (doctorFilter !== "all") params.set("doctorId", doctorFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (dateStart) params.set("startDate", dateStart);
      if (dateEnd) params.set("endDate", dateEnd);
      const res = await fetch(`/api/admin/appointments?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { appointments: AppointmentRow[]; doctors: DoctorOption[] };
    },
  });

  if (isLoading) return <Loading message="অ্যাপয়েন্টমেন্ট লোড হচ্ছে..." />;

  const appointments = data?.appointments || [];
  const doctors = data?.doctors || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">অ্যাপয়েন্টমেন্ট ব্যবস্থাপনা</h1>
        <p className="text-muted-foreground">সকল ডাক্তারের অ্যাপয়েন্টমেন্ট দেখুন</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="min-w-[180px]">
            <Label className="text-xs">ডাক্তার</Label>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="সকল ডাক্তার" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল ডাক্তার</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">শুরু তারিখ</Label>
            <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">শেষ তারিখ</Label>
            <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <div className="min-w-[150px]">
            <Label className="text-xs">স্ট্যাটাস</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[150px]">
            <Label className="text-xs">ধরন</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="py-3 pl-4 text-left font-medium">সিরিয়াল #</th>
                  <th className="py-3 text-left font-medium">রোগী</th>
                  <th className="py-3 text-left font-medium">ডাক্তার</th>
                  <th className="py-3 text-left font-medium">তারিখ</th>
                  <th className="py-3 text-left font-medium">ধরন</th>
                  <th className="py-3 text-left font-medium">স্ট্যাটাস</th>
                  <th className="py-3 text-right font-medium">ফি</th>
                  <th className="py-3 pr-4 text-right font-medium">পেমেন্ট</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => {
                    const st = STATUS_MAP[apt.status] || { label: apt.status, variant: "secondary" as const };
                    const fee = apt.type === "follow-up"
                      ? apt.doctorId?.followUpFee || 0
                      : apt.doctorId?.visitFee || 0;
                    return (
                      <tr
                        key={apt._id}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                        onClick={() => setSelectedApt(apt)}
                      >
                        <td className="py-3 pl-4 font-medium">{apt.serialNumber}</td>
                        <td className="py-3">{apt.patientId?.userId?.name || "অজানা"}</td>
                        <td className="py-3">{apt.doctorId?.userId?.name || "অজানা"}</td>
                        <td className="py-3">
                          {new Date(apt.appointmentDate).toLocaleDateString("bn-BD", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </td>
                        <td className="py-3">
                          {apt.type === "new" ? "নতুন" : "ফলো-আপ"}
                        </td>
                        <td className="py-3">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="py-3 text-right">৳{fee.toLocaleString("bn-BD")}</td>
                        <td className="py-3 pr-4 text-right">
                          {apt.payment ? (
                            <Badge variant={apt.payment.status === "paid" ? "success" : "warning"}>
                              {apt.payment.status === "paid" ? "পরিশোধিত" : "বাকি"} ৳{apt.payment.amount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>অ্যাপয়েন্টমেন্ট বিস্তারিত</DialogTitle>
            <DialogDescription>সিরিয়াল নম্বর: {selectedApt?.serialNumber}</DialogDescription>
          </DialogHeader>
          {selectedApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">রোগী</p>
                  <p className="font-medium">{selectedApt.patientId?.userId?.name || "অজানা"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApt.patientId?.userId?.phone} · {selectedApt.patientId?.gender === "male" ? "পুরুষ" : selectedApt.patientId?.gender === "female" ? "মহিলা" : "অন্যান্য"}
                  </p>
                  {selectedApt.patientId?.bloodGroup && (
                    <p className="text-sm text-muted-foreground">রক্তের গ্রুপ: {selectedApt.patientId.bloodGroup}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ডাক্তার</p>
                  <p className="font-medium">{selectedApt.doctorId?.userId?.name || "অজানা"}</p>
                  <p className="text-sm text-muted-foreground">{selectedApt.doctorId?.speciality}</p>
                  {selectedApt.doctorId?.chamberAddress && (
                    <p className="text-sm text-muted-foreground">{selectedApt.doctorId.chamberAddress}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 rounded border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">তারিখ</p>
                  <p className="font-medium">
                    {new Date(selectedApt.appointmentDate).toLocaleDateString("bn-BD", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">সময়</p>
                  <p className="font-medium">{selectedApt.timeSlot}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ধরন</p>
                  <p className="font-medium">{selectedApt.type === "new" ? "নতুন" : "ফলো-আপ"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">স্ট্যাটাস</p>
                  <Badge variant={(STATUS_MAP[selectedApt.status] || { variant: "secondary" as const }).variant}>
                    {(STATUS_MAP[selectedApt.status] || { label: selectedApt.status }).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">পেমেন্ট</p>
                  {selectedApt.payment ? (
                    <p className="font-medium">
                      ৳{selectedApt.payment.amount} — {selectedApt.payment.status === "paid" ? "পরিশোধিত" : "বাকি"} ({selectedApt.payment.method})
                    </p>
                  ) : (
                    <p className="text-muted-foreground">পেমেন্ট তথ্য নেই</p>
                  )}
                </div>
              </div>
              {selectedApt.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">নোট</p>
                  <p className="text-sm">{selectedApt.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">বুকিং তারিখ</p>
                <p className="text-sm">
                  {new Date(selectedApt.createdAt).toLocaleDateString("bn-BD", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
