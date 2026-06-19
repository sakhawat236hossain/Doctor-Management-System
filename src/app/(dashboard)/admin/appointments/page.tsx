"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/shared/Loading";
import { useT } from "@/lib/i18n";
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
  { value: "all", labelKey: "appointment.allStatus" },
  { value: "pending", labelKey: "status.pending" },
  { value: "confirmed", labelKey: "status.confirmed" },
  { value: "serving", labelKey: "status.serving" },
  { value: "completed", labelKey: "status.completed" },
  { value: "cancelled", labelKey: "status.cancelled" },
  { value: "no-show", labelKey: "status.noShow" },
];

const TYPE_OPTIONS = [
  { value: "all", labelKey: "appointment.allTypes" },
  { value: "new", labelKey: "appointment.newVisit" },
  { value: "follow-up", labelKey: "appointment.followUp" },
];

const STATUS_MAP: Record<string, { labelKey: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  pending: { labelKey: "status.pending", variant: "warning" },
  confirmed: { labelKey: "status.confirmed", variant: "default" },
  serving: { labelKey: "status.serving", variant: "default" },
  completed: { labelKey: "status.completed", variant: "success" },
  cancelled: { labelKey: "status.cancelled", variant: "destructive" },
  "no-show": { labelKey: "status.noShow", variant: "secondary" },
};

export default function AdminAppointmentsPage() {
  const t = useT();
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

  if (isLoading) return <Loading message={t("common.loading")} />;

  const appointments = data?.appointments || [];
  const doctors = data?.doctors || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">{t("appointment.management")}</h1>
        <p className="text-muted-foreground dark:text-slate-400">{t("appointment.viewAllAppointments")}</p>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="min-w-[180px]">
            <Label className="text-xs dark:text-slate-300">{t("roles.doctor")}</Label>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("appointment.allDoctors")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("appointment.allDoctors")}</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs dark:text-slate-300">{t("common.startDate")}</Label>
            <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs dark:text-slate-300">{t("common.endDate")}</Label>
            <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <div className="min-w-[150px]">
            <Label className="text-xs dark:text-slate-300">{t("common.status")}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{t(s.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[150px]">
            <Label className="text-xs dark:text-slate-300">{t("common.type")}</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((tp) => (
                  <SelectItem key={tp.value} value={tp.value}>{t(tp.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 dark:border-slate-700">
                <tr>
                  <th className="py-3 pl-4 text-left font-medium dark:text-slate-300">{t("appointment.serial")} #</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("roles.patient")}</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("roles.doctor")}</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("common.date")}</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("common.type")}</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("common.status")}</th>
                  <th className="py-3 text-right font-medium dark:text-slate-300">{t("common.fee")}</th>
                  <th className="py-3 pr-4 text-right font-medium dark:text-slate-300">{t("appointment.payment")}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                      {t("appointment.noAppointmentsFound")}
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => {
                    const st = STATUS_MAP[apt.status] || { labelKey: "common.unknown", variant: "secondary" as const };
                    const fee = apt.type === "follow-up"
                      ? apt.doctorId?.followUpFee || 0
                      : apt.doctorId?.visitFee || 0;
                    return (
                      <tr
                        key={apt._id}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/30 dark:border-slate-700 dark:hover:bg-slate-700/50"
                        onClick={() => setSelectedApt(apt)}
                      >
                        <td className="py-3 pl-4 font-medium dark:text-white">{apt.serialNumber}</td>
                        <td className="py-3 dark:text-slate-300">{apt.patientId?.userId?.name || t("common.unknown")}</td>
                        <td className="py-3 dark:text-slate-300">{apt.doctorId?.userId?.name || t("common.unknown")}</td>
                        <td className="py-3">
                          {new Date(apt.appointmentDate).toLocaleDateString("bn-BD", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </td>
                        <td className="py-3">
                          {apt.type === "new" ? t("appointment.newVisit") : t("appointment.followUp")}
                        </td>
                        <td className="py-3">
                          <Badge variant={st.variant}>{t(st.labelKey)}</Badge>
                        </td>
                        <td className="py-3 text-right">৳{fee.toLocaleString("bn-BD")}</td>
                        <td className="py-3 pr-4 text-right">
                          {apt.payment ? (
                            <Badge variant={apt.payment.status === "paid" ? "success" : "warning"}>
                              {apt.payment.status === "paid" ? t("status.paid") : t("status.due")} ৳{apt.payment.amount}
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
            <DialogTitle className="dark:text-white">{t("appointment.appointmentDetails")}</DialogTitle>
            <DialogDescription>{t("appointment.serialNumber")}: {selectedApt?.serialNumber}</DialogDescription>
          </DialogHeader>
          {selectedApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("roles.patient")}</p>
                  <p className="font-medium dark:text-white">{selectedApt.patientId?.userId?.name || t("common.unknown")}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {selectedApt.patientId?.userId?.phone} · {selectedApt.patientId?.gender === "male" ? t("common.male") : selectedApt.patientId?.gender === "female" ? t("common.female") : t("common.other")}
                  </p>
                  {selectedApt.patientId?.bloodGroup && (
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{t("common.bloodGroup")}: {selectedApt.patientId.bloodGroup}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("roles.doctor")}</p>
                  <p className="font-medium dark:text-white">{selectedApt.doctorId?.userId?.name || t("common.unknown")}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{selectedApt.doctorId?.speciality}</p>
                  {selectedApt.doctorId?.chamberAddress && (
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{selectedApt.doctorId.chamberAddress}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 rounded border dark:border-slate-700 p-3">
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.date")}</p>
                  <p className="font-medium dark:text-white">
                    {new Date(selectedApt.appointmentDate).toLocaleDateString("bn-BD", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.time")}</p>
                  <p className="font-medium">{selectedApt.timeSlot}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.type")}</p>
                  <p className="font-medium dark:text-white">{selectedApt.type === "new" ? t("appointment.newVisit") : t("appointment.followUp")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.status")}</p>
                  <Badge variant={(STATUS_MAP[selectedApt.status] || { variant: "secondary" as const }).variant}>
                    {t((STATUS_MAP[selectedApt.status] || { labelKey: "common.unknown" }).labelKey)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("appointment.payment")}</p>
                  {selectedApt.payment ? (
                    <p className="font-medium dark:text-white">
                      ৳{selectedApt.payment.amount} — {selectedApt.payment.status === "paid" ? t("status.paid") : t("status.due")} ({selectedApt.payment.method})
                    </p>
                  ) : (
                    <p className="text-muted-foreground dark:text-slate-400">{t("appointment.noPaymentInfo")}</p>
                  )}
                </div>
              </div>
              {selectedApt.notes && (
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.notes")}</p>
                  <p className="text-sm">{selectedApt.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground dark:text-slate-400">{t("appointment.bookingDate")}</p>
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
