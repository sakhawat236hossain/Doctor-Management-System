"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Receptionist {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

export default function AdminReceptionistsPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<Receptionist | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    autoPassword: true,
  });

  const { data: receptionists, isLoading } = useQuery({
    queryKey: ["admin-receptionists"],
    queryFn: async () => {
      const res = await fetch("/api/admin/receptionists");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Receptionist[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/admin/receptionists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t("receptionist.addSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin-receptionists"] });
      setModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await fetch("/api/admin/receptionists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(target?.isActive ? t("receptionist.deactivateSuccess") : t("receptionist.activateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin-receptionists"] });
      setConfirmOpen(false);
      setTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openModal() {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: generatePassword(),
      autoPassword: true,
    });
    setModalOpen(true);
  }

  function handleSubmit() {
    createMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
  }

  if (isLoading) return <Loading message={t("receptionist.loadingReceptionists")} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">{t("receptionist.management")}</h1>
          <p className="text-muted-foreground dark:text-slate-400">{t("receptionist.manageReceptionists")}</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="mr-2 h-4 w-4" />
          {t("receptionist.addReceptionist")}
        </Button>
      </div>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 dark:border-slate-700">
                <tr>
                  <th className="py-3 pl-4 text-left font-medium dark:text-slate-300">{t("common.name")}</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("common.email")}</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("common.phone")}</th>
                  <th className="py-3 text-left font-medium dark:text-slate-300">{t("receptionist.joiningDate")}</th>
                  <th className="py-3 text-center font-medium dark:text-slate-300">{t("common.status")}</th>
                  <th className="py-3 pr-4 text-right font-medium dark:text-slate-300">{t("common.action")}</th>
                </tr>
              </thead>
              <tbody>
                {(!receptionists || receptionists.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                      {t("receptionist.noReceptionists")}
                    </td>
                  </tr>
                ) : (
                  receptionists.map((r) => (
                    <tr key={r._id} className="border-b last:border-0 hover:bg-muted/30 dark:border-slate-700 dark:hover:bg-slate-700/50">
                      <td className="py-3 pl-4 font-medium dark:text-white">{r.name}</td>
                      <td className="py-3 dark:text-slate-300">{r.email}</td>
                      <td className="py-3 dark:text-slate-300">{r.phone}</td>
                      <td className="py-3">
                        {new Date(r.createdAt).toLocaleDateString("bn-BD", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={r.isActive ? "success" : "secondary"}>
                          {r.isActive ? t("receptionist.active") : t("receptionist.inactive")}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={r.isActive ? "text-destructive" : "text-green-600"}
                          onClick={() => {
                            setTarget(r);
                            setConfirmOpen(true);
                          }}
                        >
                          {r.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Toggle */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{target?.isActive ? t("receptionist.deactivate") : t("receptionist.activate")}</DialogTitle>
            <DialogDescription>
              {t("receptionist.deactivateConfirm", { name: target?.name || "", action: target?.isActive ? t("receptionist.deactivate") : t("receptionist.activate") })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{t("common.cancel")}</Button>
            <Button
              variant={target?.isActive ? "destructive" : "default"}
              onClick={() => target && toggleMutation.mutate({ userId: target._id, isActive: !target.isActive })}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? t("common.processing") : target?.isActive ? t("receptionist.deactivate") : t("receptionist.activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Receptionist Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t("receptionist.addReceptionist")}</DialogTitle>
            <DialogDescription>{t("receptionist.addReceptionistDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("common.name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("receptionist.receptionistName")} />
            </div>
            <div>
              <Label>{t("common.email")} *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="receptionist@example.com" />
            </div>
            <div>
              <Label>{t("common.phone")} *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="০১XXXXXXXXX" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>{t("auth.passwordLabel")} *</Label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.autoPassword}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        autoPassword: e.target.checked,
                        password: e.target.checked ? generatePassword() : "",
                      })
                    }
                  />
                  {t("doctor.autoPassword")}
                </label>
              </div>
              <Input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value, autoPassword: false })}
                placeholder={t("auth.passwordPlaceholder")}
                readOnly={form.autoPassword}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.email || !form.phone || !form.password || createMutation.isPending}
            >
              {createMutation.isPending ? t("common.processing") : t("doctor.addUpdate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
