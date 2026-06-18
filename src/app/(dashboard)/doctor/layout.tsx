"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX } from "lucide-react";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const userName = session?.user?.name || "Doctor";
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState<"available" | "unavailable" | "on-leave">("available");
  const [speciality, setSpeciality] = useState("");

  // Fetch doctor profile on mount
  useEffect(() => {
    fetch("/api/doctors?search=" + encodeURIComponent(userName) + "&limit=1")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          const doc = res.data[0];
          setDoctorId(doc._id);
          setStatus(doc.status);
          setSpeciality(doc.speciality || "");
        }
      })
      .catch(() => {});
  }, [userName]);

  const isAvailable = status === "available";

  const toggleStatus = async () => {
    if (!doctorId) return;
    const newStatus = isAvailable ? "unavailable" : "available";

    if (!isAvailable) {
      // Going OUT → confirm
      if (!confirm("Queue পজ করা হবে, নিশ্চিত?")) return;
    }

    setStatus(newStatus);
    try {
      await fetch(`/api/doctors/${doctorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setStatus(isAvailable ? "available" : "unavailable");
    }
  };

  return (
    <div className="space-y-4">
      {/* Doctor Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border bg-white p-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{userName}</h2>
          {speciality && (
            <p className="text-sm text-gray-500">{speciality}</p>
          )}
        </div>
        <Button
          onClick={toggleStatus}
          className={`h-11 px-5 text-sm font-medium ${
            isAvailable
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isAvailable ? (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              ভেতরে আছি ✓
            </>
          ) : (
            <>
              <UserX className="mr-2 h-4 w-4" />
              বাইরে আছি ✗
            </>
          )}
        </Button>
      </div>

      {children}
    </div>
  );
}
