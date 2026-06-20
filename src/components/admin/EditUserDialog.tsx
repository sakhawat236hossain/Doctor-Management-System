"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
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

interface EditUserDialogProps {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  onClose: () => void;
}

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
});

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const t = useT();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [customPassword, setCustomPassword] = useState("");

  // Save user info
  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = editSchema.safeParse({ name, email, phone });
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[String(e.path[0])] = e.message;
        });
        setErrors(fieldErrors);
        throw new Error("Validation failed");
      }
      setErrors({});

      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("users.saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (err: Error) => {
      if (err.message !== "Validation failed") {
        toast.error(err.message);
      }
    },
  });

  // Reset password
  const resetPwMutation = useMutation({
    mutationFn: async () => {
      const body: { password?: string } = {};
      if (customPassword.length >= 6) body.password = customPassword;

      const res = await fetch(`/api/admin/users/${user._id}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { tempPassword: string; message: string };
    },
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
      toast.success(t("users.passwordReset"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t("users.editUser")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label className="dark:text-slate-300">{t("common.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label className="dark:text-slate-300">{t("common.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label className="dark:text-slate-300">{t("common.phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Password Reset Section */}
          <div className="space-y-2">
            <Label className="dark:text-slate-300 flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {t("users.resetPassword")}
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("users.newPassword")}
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={resetPwMutation.isPending}
                onClick={() => resetPwMutation.mutate()}
              >
                {resetPwMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("users.resetPassword")
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              Leave blank to auto-generate a temporary password.
            </p>

            {/* Show generated temp password */}
            {tempPassword && (
              <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 dark:bg-amber-500/20">
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-1">
                  {t("users.tempPasswordGenerated")}:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-slate-100 px-2 py-1 text-sm font-mono dark:bg-slate-700 dark:text-white">
                    {tempPassword}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(tempPassword)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
