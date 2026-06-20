"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface ChangeRoleDialogProps {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  onClose: () => void;
}

export function ChangeRoleDialog({ user, onClose }: ChangeRoleDialogProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const [newRole, setNewRole] = useState(user.role);
  const [speciality, setSpeciality] = useState("");
  const [visitFee, setVisitFee] = useState("500");
  const [followUpFee, setFollowUpFee] = useState("200");
  const [doctorConfirmed, setDoctorConfirmed] = useState(false);

  const isSelf = session?.user?.id === user._id;
  const isLeavingDoctor = user.role === "doctor" && newRole !== "doctor";
  const isBecomingDoctor = newRole === "doctor" && user.role !== "doctor";

  const mutation = useMutation({
    mutationFn: async () => {
      if (isSelf) throw new Error(t("users.selfLockout"));
      if (newRole === user.role) throw new Error("Same role selected");

      const body: Record<string, unknown> = { newRole };

      // Doctor fields required when changing TO doctor
      if (isBecomingDoctor) {
        if (!speciality.trim()) throw new Error(t("users.doctorFieldsRequired"));
        body.doctorData = {
          speciality: speciality.trim(),
          visitFee: Number(visitFee) || 0,
          followUpFee: Number(followUpFee) || 0,
        };
      }

      const res = await fetch(`/api/admin/users/${user._id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("users.roleChanged"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canSubmit =
    !isSelf &&
    newRole !== user.role &&
    (!isBecomingDoctor || speciality.trim().length > 0) &&
    (!isLeavingDoctor || doctorConfirmed);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t("users.roleChangeTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User info */}
          <div className="rounded-md border p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium dark:text-white">{user.name}</p>
            <p className="text-xs text-muted-foreground dark:text-slate-400">{user.email}</p>
            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
              Current: <span className="font-semibold">{t(`roles.${user.role}`)}</span>
            </p>
          </div>

          {/* Self lockout warning */}
          {isSelf && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 dark:bg-amber-500/20">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">{t("users.selfLockout")}</p>
            </div>
          )}

          {/* New Role Selector */}
          <div className="space-y-1">
            <Label className="dark:text-slate-300">{t("users.selectNewRole")}</Label>
            <Select value={newRole} onValueChange={setNewRole} disabled={isSelf}>
              <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                <SelectItem value="doctor">{t("roles.doctor")}</SelectItem>
                <SelectItem value="receptionist">{t("roles.receptionist")}</SelectItem>
                <SelectItem value="patient">{t("roles.patient")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Doctor Fields — when changing TO doctor */}
          {isBecomingDoctor && (
            <>
              <Separator className="dark:bg-slate-700" />
              <div className="space-y-3">
                <p className="text-sm font-medium dark:text-white">{t("users.doctorFieldsRequired")}</p>
                <div className="space-y-1">
                  <Label className="dark:text-slate-300">{t("users.speciality")}</Label>
                  <Input
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    placeholder="e.g. Medicine, Cardiology"
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="dark:text-slate-300">{t("users.visitFee")}</Label>
                    <Input
                      type="number"
                      value={visitFee}
                      onChange={(e) => setVisitFee(e.target.value)}
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="dark:text-slate-300">{t("users.followUpFee")}</Label>
                    <Input
                      type="number"
                      value={followUpFee}
                      onChange={(e) => setFollowUpFee(e.target.value)}
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Warning when changing FROM doctor */}
          {isLeavingDoctor && (
            <>
              <Separator className="dark:bg-slate-700" />
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{t("users.doctorChangeWarning")}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doctorConfirmed}
                    onChange={(e) => setDoctorConfirmed(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm dark:text-slate-300">{t("users.confirmDoctorChange")}</span>
                </label>
              </div>
            </>
          )}

          {/* Last admin warning — shown when current role is admin and changing away */}
          {user.role === "admin" && newRole !== "admin" && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 dark:bg-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">{t("users.lastAdminWarning")}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
