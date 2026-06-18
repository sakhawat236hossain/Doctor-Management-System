"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import type { IScheduleSlot } from "@/types";

const ALL_DAYS: { key: string; label: string }[] = [
  { key: "Sat", label: "শনিবার" },
  { key: "Sun", label: "রবিবার" },
  { key: "Mon", label: "সোমবার" },
  { key: "Tue", label: "মঙ্গলবার" },
  { key: "Wed", label: "বুধবার" },
  { key: "Thu", label: "বৃহস্পতিবার" },
  { key: "Fri", label: "শুক্রবার" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

function ScheduleContent() {
  const { session } = useAuth();
  const [doctorId, setDoctorId] = useState("");
  const [loading, setLoading] = useState(true);

  // Schedule slots
  const [schedule, setSchedule] = useState<IScheduleSlot[]>([]);
  // Off days
  const [offDays, setOffDays] = useState<string[]>([]);
  const [offDayInput, setOffDayInput] = useState("");
  // Fee + chamber
  const [visitFee, setVisitFee] = useState(0);
  const [followUpFee, setFollowUpFee] = useState(0);
  const [chamberAddress, setChamberAddress] = useState("");
  const [chamberPhone, setChamberPhone] = useState("");

  const [scheduleStatus, setScheduleStatus] = useState<SaveStatus>("idle");
  const [settingsStatus, setSettingsStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch doctor profile
  useEffect(() => {
    fetch(`/api/doctors?search=${encodeURIComponent(session?.user?.name || "")}&limit=1`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          const doc = res.data[0];
          setDoctorId(doc._id);
          setSchedule(doc.schedule || []);
          setOffDays((doc.offDays || []).map((d: string) => new Date(d).toISOString().split("T")[0]));
          setVisitFee(doc.visitFee || 0);
          setFollowUpFee(doc.followUpFee || 0);
          setChamberAddress(doc.chamberAddress || "");
          setChamberPhone(doc.chamberPhone || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.name]);

  const getSlot = (day: string): IScheduleSlot | undefined =>
    schedule.find((s) => s.day === day);

  const updateSlot = (day: string, field: keyof IScheduleSlot, value: string | number) => {
    setSchedule((prev) => {
      const existing = prev.find((s) => s.day === day);
      if (existing) {
        return prev.map((s) =>
          s.day === day ? { ...s, [field]: value } : s
        );
      }
      return [...prev, { day: day as IScheduleSlot["day"], startTime: "09:00", endTime: "14:00", maxPatients: 20, [field]: value }];
    });
  };

  const toggleDayActive = (day: string) => {
    setSchedule((prev) => {
      const existing = prev.find((s) => s.day === day);
      if (existing) {
        return prev.filter((s) => s.day !== day);
      }
      return [...prev, { day: day as IScheduleSlot["day"], startTime: "09:00", endTime: "14:00", maxPatients: 20 }];
    });
  };

  const addOffDay = () => {
    if (!offDayInput) return;
    if (!offDays.includes(offDayInput)) {
      setOffDays((prev) => [...prev, offDayInput].sort());
    }
    setOffDayInput("");
  };

  const removeOffDay = (date: string) => {
    setOffDays((prev) => prev.filter((d) => d !== date));
  };

  const saveSchedule = async () => {
    if (!doctorId) return;
    setScheduleStatus("saving");
    try {
      const res = await fetch(`/api/doctors/${doctorId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });
      const data = await res.json();
      if (data.success) {
        setScheduleStatus("saved");
        setTimeout(() => setScheduleStatus("idle"), 2500);
      } else {
        setScheduleStatus("error");
        setErrorMsg(data.error);
        setTimeout(() => setScheduleStatus("idle"), 3000);
      }
    } catch {
      setScheduleStatus("error");
      setErrorMsg("Network error");
      setTimeout(() => setScheduleStatus("idle"), 3000);
    }
  };

  const saveSettings = async () => {
    if (!doctorId) return;
    setSettingsStatus("saving");
    try {
      const res = await fetch(`/api/doctors/${doctorId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offDays,
          visitFee,
          followUpFee,
          chamberAddress,
          chamberPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsStatus("saved");
        setTimeout(() => setSettingsStatus("idle"), 2500);
      } else {
        setSettingsStatus("error");
        setErrorMsg(data.error);
        setTimeout(() => setSettingsStatus("idle"), 3000);
      }
    } catch {
      setSettingsStatus("error");
      setErrorMsg("Network error");
      setTimeout(() => setSettingsStatus("idle"), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">আমার সময়সূচী</h1>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ALL_DAYS.map((day) => {
            const slot = getSlot(day.key);
            const isActive = !!slot;

            return (
              <div
                key={day.key}
                className={`flex flex-col md:flex-row md:items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isActive ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <label className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleDayActive(day.key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                    {day.label}
                  </span>
                </label>

                {isActive && slot && (
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(day.key, "startTime", e.target.value)}
                      className="h-9 w-[110px]"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(day.key, "endTime", e.target.value)}
                      className="h-9 w-[110px]"
                    />
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-gray-500">Max:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={slot.maxPatients}
                        onChange={(e) => updateSlot(day.key, "maxPatients", parseInt(e.target.value) || 1)}
                        className="h-9 w-[70px]"
                      />
                    </div>
                  </div>
                )}

                {!isActive && (
                  <span className="text-xs text-gray-400">Off day</span>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-3">
            <Button onClick={saveSchedule} disabled={scheduleStatus === "saving"} className="bg-blue-600 hover:bg-blue-700 text-white">
              {scheduleStatus === "saving" ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Schedule</>
              )}
            </Button>
            {scheduleStatus === "saved" && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> Saved ✓</span>}
            {scheduleStatus === "error" && <span className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errorMsg}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Off Days */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Off Days (ছুটির দিন)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="date"
              value={offDayInput}
              onChange={(e) => setOffDayInput(e.target.value)}
              className="max-w-[200px]"
            />
            <Button variant="outline" onClick={addOffDay} disabled={!offDayInput}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {offDays.length === 0 && <p className="text-sm text-gray-400">No off days selected</p>}
            {offDays.map((d) => (
              <Badge key={d} variant="outline" className="gap-1 px-2 py-1">
                {new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                <button onClick={() => removeOffDay(d)} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fee & Chamber Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-teal-600" />
            Fee & Chamber Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-1.5 block">New Visit Fee (৳)</Label>
              <Input
                type="number"
                min={0}
                value={visitFee}
                onChange={(e) => setVisitFee(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Follow-up Fee (৳)</Label>
              <Input
                type="number"
                min={0}
                value={followUpFee}
                onChange={(e) => setFollowUpFee(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="flex items-center gap-1.5 text-sm mb-1.5">
              <MapPin className="h-3.5 w-3.5" /> Chamber Address
            </Label>
            <Input
              value={chamberAddress}
              onChange={(e) => setChamberAddress(e.target.value)}
              placeholder="Enter chamber address"
            />
          </div>
          <div>
            <Label className="flex items-center gap-1.5 text-sm mb-1.5">
              <Phone className="h-3.5 w-3.5" /> Chamber Phone
            </Label>
            <Input
              value={chamberPhone}
              onChange={(e) => setChamberPhone(e.target.value)}
              placeholder="Enter chamber phone"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={saveSettings} disabled={settingsStatus === "saving"} className="bg-teal-600 hover:bg-teal-700 text-white">
              {settingsStatus === "saving" ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Settings</>
              )}
            </Button>
            {settingsStatus === "saved" && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> Saved ✓</span>}
            {settingsStatus === "error" && <span className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errorMsg}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <ScheduleContent />
    </RoleGuard>
  );
}
