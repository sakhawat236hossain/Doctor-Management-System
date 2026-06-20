"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Phone, Shield, Calendar, Globe } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/shared/Loading";

interface UserDetailDialogProps {
  userId: string;
  onClose: () => void;
}

interface DetailData {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    profileImage: string;
    authProviders: string[];
    hasPassword: boolean;
    createdAt: string;
  };
  doctorData: {
    _id: string;
    speciality: string;
    degree: string[];
    bio: string;
    visitFee: number;
    followUpFee: number;
    chamberAddress: string;
    chamberPhone: string;
    status: string;
    schedule: Array<{ day: string; startTime: string; endTime: string; maxPatients: number }>;
  } | null;
  patientData: {
    _id: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    address: string;
    emergencyContact: string;
  } | null;
  appointments: Array<{
    _id: string;
    appointmentDate: string;
    status: string;
    serialNumber: number;
    type: string;
    doctorId?: { userId?: { name: string }; speciality?: string };
    patientId?: { userId?: { name: string } };
  }>;
}

const ROLE_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  admin: "destructive",
  doctor: "success",
  receptionist: "warning",
  patient: "default",
};

export function UserDetailDialog({ userId, onClose }: UserDetailDialogProps) {
  const t = useT();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as DetailData;
    },
  });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t("users.viewDetails")}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {data.user.profileImage && <AvatarImage src={data.user.profileImage} />}
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {getInitials(data.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold dark:text-white">{data.user.name}</h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant={ROLE_COLORS[data.user.role] || "secondary"}>
                    {t(`roles.${data.user.role}`)}
                  </Badge>
                  <Badge variant={data.user.isActive ? "success" : "destructive"}>
                    {data.user.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="dark:bg-slate-700" />

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{data.user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{data.user.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(data.user.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
            </div>

            <Separator className="dark:bg-slate-700" />

            {/* Login Methods */}
            <div>
              <h3 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t("users.loginMethod")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.user.hasPassword && (
                  <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                    <Mail className="h-3 w-3 mr-1" /> Email/Password
                  </Badge>
                )}
                {data.user.authProviders?.map((p) => (
                  <Badge key={p} variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                    {p === "credentials" ? "Email" : p === "google" ? "Google" : "Facebook"}
                  </Badge>
                ))}
                {!data.user.hasPassword && (!data.user.authProviders || data.user.authProviders.length === 0) && (
                  <span className="text-sm text-muted-foreground dark:text-slate-400">—</span>
                )}
              </div>
            </div>

            {/* Doctor Data */}
            {data.user.role === "doctor" && data.doctorData && (
              <>
                <Separator className="dark:bg-slate-700" />
                <div>
                  <h3 className="text-sm font-semibold mb-3 dark:text-white flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t("users.doctorDetails")}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("users.speciality")}</p>
                      <p className="text-sm font-medium dark:text-white">{data.doctorData.speciality}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.status")}</p>
                      <Badge variant={data.doctorData.status === "available" ? "success" : "secondary"}>
                        {data.doctorData.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("users.visitFee")}</p>
                      <p className="text-sm font-medium dark:text-white">৳ {data.doctorData.visitFee}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("users.followUpFee")}</p>
                      <p className="text-sm font-medium dark:text-white">৳ {data.doctorData.followUpFee}</p>
                    </div>
                    {data.doctorData.degree.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground dark:text-slate-400">Degree</p>
                        <p className="text-sm font-medium dark:text-white">{data.doctorData.degree.join(", ")}</p>
                      </div>
                    )}
                    {data.doctorData.chamberAddress && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground dark:text-slate-400">Chamber</p>
                        <p className="text-sm font-medium dark:text-white">{data.doctorData.chamberAddress}</p>
                      </div>
                    )}
                    {data.doctorData.schedule.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground dark:text-slate-400 mb-1">Schedule</p>
                        <div className="flex flex-wrap gap-1">
                          {data.doctorData.schedule.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] dark:border-slate-600 dark:text-slate-300">
                              {s.day}: {s.startTime}-{s.endTime}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Patient Data */}
            {data.user.role === "patient" && data.patientData && (
              <>
                <Separator className="dark:bg-slate-700" />
                <div>
                  <h3 className="text-sm font-semibold mb-3 dark:text-white">
                    {t("users.patientDetails")}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.date")}</p>
                      <p className="text-sm font-medium dark:text-white">
                        {new Date(data.patientData.dateOfBirth).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">Gender</p>
                      <p className="text-sm font-medium dark:text-white">
                        {t(`common.${data.patientData.gender}`)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("common.bloodGroup")}</p>
                      <p className="text-sm font-medium dark:text-white">{data.patientData.bloodGroup}</p>
                    </div>
                    {data.patientData.address && (
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">Address</p>
                        <p className="text-sm font-medium dark:text-white">{data.patientData.address}</p>
                      </div>
                    )}
                    {data.patientData.emergencyContact && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground dark:text-slate-400">Emergency Contact</p>
                        <p className="text-sm font-medium dark:text-white">{data.patientData.emergencyContact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Appointment History */}
            {(data.user.role === "patient" || data.user.role === "receptionist") && data.appointments.length > 0 && (
              <>
                <Separator className="dark:bg-slate-700" />
                <div>
                  <h3 className="text-sm font-semibold mb-3 dark:text-white">
                    {t("users.appointmentHistory")}
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.appointments.map((apt) => (
                      <div
                        key={apt._id}
                        className="flex items-center justify-between rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div>
                          <p className="font-medium dark:text-white">
                            {new Date(apt.appointmentDate).toLocaleDateString("bn-BD")}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">
                            Serial: {apt.serialNumber} | {apt.type === "new" ? "New" : "Follow-up"}
                            {apt.doctorId?.userId?.name && ` | Dr. ${apt.doctorId.userId.name}`}
                            {apt.patientId?.userId?.name && ` | ${apt.patientId.userId.name}`}
                          </p>
                        </div>
                        <Badge
                          variant={
                            apt.status === "completed" ? "success" :
                            apt.status === "cancelled" ? "destructive" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* No Appointments */}
            {(data.user.role === "patient" || data.user.role === "receptionist") && data.appointments.length === 0 && (
              <>
                <Separator className="dark:bg-slate-700" />
                <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-2">
                  {t("users.noAppointments")}
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
