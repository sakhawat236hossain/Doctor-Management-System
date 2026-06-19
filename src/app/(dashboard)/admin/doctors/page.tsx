"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Edit2, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DayOfWeek, IScheduleSlot } from "@/types";

interface DoctorRow {
  _id: string;
  speciality: string;
  degree: string[];
  visitFee: number;
  followUpFee: number;
  status: string;
  isActive: boolean;
  schedule: IScheduleSlot[];
  chamberAddress: string;
  chamberPhone: string;
  bio: string;
  todayPatientCount: number;
  todayIncomeTotal: number;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
}

interface DoctorsResponse {
  doctors: DoctorRow[];
  specialities: string[];
}

const ALL_DAYS: DayOfWeek[] = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LABELS: Record<DayOfWeek, string> = {
  Sat: "শনিবার", Sun: "রবিবার", Mon: "সোমবার", Tue: "মঙ্গলবার",
  Wed: "বুধবার", Thu: "বৃহদিন", Fri: "শুক্রবার",
};

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editDoctor, setEditDoctor] = useState<DoctorRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<DoctorRow | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    autoPassword: true, speciality: "", degree: [""], visitFee: 0, followUpFee: 0,
    bio: "", chamberAddress: "", chamberPhone: "",
    schedule: [] as IScheduleSlot[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-doctors", search, specialityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (specialityFilter) params.set("speciality", specialityFilter);
      const res = await fetch(`/api/admin/doctors?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as DoctorsResponse;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("ডাক্তার সফলভাবে যোগ হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/admin/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: (_, vars) => {
      if (vars.isActive === false) {
        toast.success("ডাক্তার নিষ্ক্রিয় করা হয়েছে");
        setConfirmOpen(false);
        setDeactivateTarget(null);
      } else {
        toast.success("ডাক্তার আপডেট হয়েছে");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openAddModal() {
    setEditDoctor(null);
    setForm({
      name: "", email: "", phone: "", password: generatePassword(),
      autoPassword: true, speciality: "", degree: [""], visitFee: 0, followUpFee: 0,
      bio: "", chamberAddress: "", chamberPhone: "", schedule: [],
    });
    setStep(1);
    setModalOpen(true);
  }

  function openEditModal(doc: DoctorRow) {
    setEditDoctor(doc);
    setForm({
      name: doc.user.name, email: doc.user.email, phone: doc.user.phone,
      password: "", autoPassword: false,
      speciality: doc.speciality, degree: doc.degree.length ? doc.degree : [""],
      visitFee: doc.visitFee, followUpFee: doc.followUpFee,
      bio: doc.bio, chamberAddress: doc.chamberAddress, chamberPhone: doc.chamberPhone,
      schedule: doc.schedule || [],
    });
    setStep(1);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditDoctor(null);
    setStep(1);
  }

  function handleSubmit() {
    if (editDoctor) {
      updateMutation.mutate({
        doctorId: editDoctor._id,
        userId: editDoctor.user._id,
        name: form.name,
        phone: form.phone,
        speciality: form.speciality,
        degree: form.degree.filter(Boolean),
        visitFee: form.visitFee,
        followUpFee: form.followUpFee,
        bio: form.bio,
        chamberAddress: form.chamberAddress,
        chamberPhone: form.chamberPhone,
        schedule: form.schedule,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        speciality: form.speciality,
        degree: form.degree.filter(Boolean),
        visitFee: form.visitFee,
        followUpFee: form.followUpFee,
        bio: form.bio,
        chamberAddress: form.chamberAddress,
        chamberPhone: form.chamberPhone,
        schedule: form.schedule,
      });
    }
  }

  function toggleDay(day: DayOfWeek) {
    const exists = form.schedule.find((s) => s.day === day);
    if (exists) {
      setForm({ ...form, schedule: form.schedule.filter((s) => s.day !== day) });
    } else {
      setForm({
        ...form,
        schedule: [...form.schedule, { day, startTime: "09:00", endTime: "17:00", maxPatients: 20 }],
      });
    }
  }

  function updateSchedule(day: DayOfWeek, field: keyof IScheduleSlot, value: string | number) {
    setForm({
      ...form,
      schedule: form.schedule.map((s) => (s.day === day ? { ...s, [field]: value } : s)),
    });
  }

  if (isLoading) return <Loading message="ডাক্তারদের তথ্য লোড হচ্ছে..." />;

  const doctors = data?.doctors || [];
  const specialities = data?.specialities || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">ডাক্তার ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">সকল ডাক্তার যোগ, সম্পাদনা ও নিষ্ক্রিয় করুন</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          ডাক্তার যোগ করুন
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ডাক্তারের নাম খুঁজুন..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={specialityFilter} onValueChange={setSpecialityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="বিশেষজ্ঞতা" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল বিশেষজ্ঞতা</SelectItem>
            {specialities.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Doctors Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="py-3 pl-4 text-left font-medium">নাম</th>
                  <th className="py-3 text-left font-medium">বিশেষজ্ঞতা</th>
                  <th className="py-3 text-left font-medium">স্ট্যাটাস</th>
                  <th className="py-3 text-right font-medium">ফি</th>
                  <th className="py-3 text-center font-medium">আজকের রোগী</th>
                  <th className="py-3 pr-4 text-right font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      কোনো ডাক্তার পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  doctors.map((doc) => (
                    <tr key={doc._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pl-4">
                        <div>
                          <p className="font-medium">{doc.user.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3">{doc.speciality}</td>
                      <td className="py-3">
                        <Badge variant={doc.isActive ? "success" : "secondary"}>
                          {doc.isActive
                            ? doc.status === "available" ? "সক্রিয়" : doc.status === "on-leave" ? "ছুটিতে" : "অনুপলব্ধ"
                            : "নিষ্ক্রিয়"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">৳{doc.visitFee.toLocaleString("bn-BD")}</td>
                      <td className="py-3 text-center">{doc.todayPatientCount}</td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(doc)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {doc.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setDeactivateTarget(doc);
                                setConfirmOpen(true);
                              }}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ডাক্তার নিষ্ক্রিয় করুন</DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত <strong>{deactivateTarget?.user.name}</strong> কে নিষ্ক্রিয় করতে চান?
              নিষ্ক্রিয় ডাক্তার নতুন অ্যাপয়েন্টমেন্ট পাবেন না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>বাতিল</Button>
            <Button
              variant="destructive"
              onClick={() =>
                deactivateTarget &&
                updateMutation.mutate({
                  doctorId: deactivateTarget._id,
                  userId: deactivateTarget.user._id,
                  isActive: false,
                })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "প্রক্রিয়াধীন..." : "নিষ্ক্রিয় করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Doctor Modal — 3 Steps */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editDoctor ? "ডাক্তার সম্পাদনা" : "ডাক্তার যোগ করুন"} — ধাপ {step}/৩
            </DialogTitle>
            <DialogDescription>
              {step === 1 && "অ্যাকাউন্ট তথ্য পূরণ করুন"}
              {step === 2 && "প্রোফাইল তথ্য পূরণ করুন"}
              {step === 3 && "সময়সূচী সেট করুন"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {/* Step 1: Account */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>নাম *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ডাক্তারের নাম" />
                  </div>
                  <div>
                    <Label>ফোন *</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="০১XXXXXXXXX" />
                  </div>
                </div>
                <div>
                  <Label>ইমেইল *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="doctor@example.com"
                    disabled={!!editDoctor}
                  />
                </div>
                {!editDoctor && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>পাসওয়ার্ড *</Label>
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
                        অটো-জেনারেট
                      </label>
                    </div>
                    <Input
                      type="text"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value, autoPassword: false })}
                      placeholder="পাসওয়ার্ড"
                      readOnly={form.autoPassword}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Profile */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>বিশেষজ্ঞতা *</Label>
                    <Input value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })} placeholder="যেমন: কার্ডিওলজি" />
                  </div>
                  <div>
                    <Label>ডিগ্রি *</Label>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {form.degree.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                          {d}
                          <button type="button" onClick={() => setForm({ ...form, degree: form.degree.filter((_, j) => j !== i) })}>×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Input
                        id="degree-input"
                        placeholder="ডিগ্রি লিখে Enter চাপুন"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setForm({ ...form, degree: [...form.degree, val] });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>ভিজিট ফি (৳) *</Label>
                    <Input type="number" value={form.visitFee} onChange={(e) => setForm({ ...form, visitFee: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>ফলো-আপ ফি (৳) *</Label>
                    <Input type="number" value={form.followUpFee} onChange={(e) => setForm({ ...form, followUpFee: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>বায়ো</Label>
                  <Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="সংক্ষিপ্ত পরিচিতি" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>চেম্বার ঠিকানা</Label>
                    <Input value={form.chamberAddress} onChange={(e) => setForm({ ...form, chamberAddress: e.target.value })} />
                  </div>
                  <div>
                    <Label>চেম্বার ফোন</Label>
                    <Input value={form.chamberPhone} onChange={(e) => setForm({ ...form, chamberPhone: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const active = form.schedule.some((s) => s.day === day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                          active ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
                {form.schedule.map((slot) => (
                  <div key={slot.day} className="grid grid-cols-4 gap-2 rounded border p-3">
                    <div className="col-span-4 font-medium text-sm">{DAY_LABELS[slot.day]}</div>
                    <div>
                      <Label className="text-xs">শুরুর সময়</Label>
                      <Input type="time" value={slot.startTime} onChange={(e) => updateSchedule(slot.day, "startTime", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">শেষ সময়</Label>
                      <Input type="time" value={slot.endTime} onChange={(e) => updateSchedule(slot.day, "endTime", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">সর্বোচ্চ রোগী</Label>
                      <Input type="number" min={1} value={slot.maxPatients} onChange={(e) => updateSchedule(slot.day, "maxPatients", Number(e.target.value))} />
                    </div>
                  </div>
                ))}
                {form.schedule.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    উপরের দিন থেকে সক্রিয় দিন নির্বাচন করুন
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>পূর্ববর্তী</Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!form.name || !form.email || !form.phone || (!editDoctor && !form.password))) ||
                  (step === 2 && (!form.speciality || form.degree.filter(Boolean).length === 0))
                }
              >
                পরবর্তী
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "প্রক্রিয়াধীন..."
                  : editDoctor ? "আপডেট করুন" : "যোগ করুন"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
