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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface DeleteUserDialogProps {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  onClose: () => void;
}

export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const [confirmEmail, setConfirmEmail] = useState("");

  const isSelf = session?.user?.id === user._id;
  const emailMatches = confirmEmail === user.email;

  const mutation = useMutation({
    mutationFn: async () => {
      if (isSelf) throw new Error("Cannot delete your own account");
      if (!emailMatches) throw new Error(t("users.emailMismatch"));

      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("users.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white text-destructive">
            {t("users.confirmDelete")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User info */}
          <div className="rounded-md border p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium dark:text-white">{user.name}</p>
            <p className="text-xs text-muted-foreground dark:text-slate-400">{user.email}</p>
            <Badge variant="outline" className="mt-1 text-[10px] dark:border-slate-600 dark:text-slate-300">
              {t(`roles.${user.role}`)}
            </Badge>
          </div>

          {/* Self delete warning */}
          {isSelf && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 dark:bg-amber-500/20">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You cannot delete your own account.
              </p>
            </div>
          )}

          {/* Warning */}
          {!isSelf && (
            <>
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{t("users.deleteWarning")}</p>
              </div>

              {/* Doctor-specific warning */}
              {user.role === "doctor" && (
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  {t("users.doctorChangeWarning")} Pending appointments will be cancelled.
                </p>
              )}

              {/* Email confirmation */}
              <div className="space-y-1">
                <Label className="dark:text-slate-300">{t("users.typeEmailToConfirm")}</Label>
                <Input
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user.email}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  autoFocus
                />
                {confirmEmail.length > 0 && !emailMatches && (
                  <p className="text-xs text-destructive">{t("users.emailMismatch")}</p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={isSelf || !emailMatches || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("users.deleteUser")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
