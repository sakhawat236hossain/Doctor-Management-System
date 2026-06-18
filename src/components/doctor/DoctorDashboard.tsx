"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { getTodayDateString } from "@/lib/utils";
import { toast } from "sonner";

interface Appointment {
  _id: string;
  serialNumber: number;
  appointmentDate: string;
  status: string;
  type: string;
  patientId?: { userId?: { name: string; phone: string } };
}

interface QueueData {
  _id: string;
  currentSerial: number;
  totalBooked: number;
  status: string;
}

export function DoctorDashboard() {
  const today = getTodayDateString();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["doctor-appointments", today],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?date=${today}`);
      const json = await res.json();
      return json.success ? (json.data as Appointment[]) : [];
    },
  });

  const { data: queues, refetch: refetchQueue } = useQuery({
    queryKey: ["doctor-queue", today],
    queryFn: async () => {
      const res = await fetch(`/api/queue?date=${today}`);
      const json = await res.json();
      return json.success ? (json.data as QueueData[]) : [];
    },
  });

  const handleNextPatient = async () => {
    const queue = queues?.[0];
    if (!queue) {
      toast.error("No active queue found");
      return;
    }

    const nextSerial = queue.currentSerial + 1;
    if (nextSerial > queue.totalBooked) {
      toast.info("No more patients in queue");
      return;
    }

    const res = await fetch("/api/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: queue._id, currentSerial: nextSerial }),
    });

    const json = await res.json();
    if (json.success) {
      toast.success(`Now serving patient #${nextSerial}`);
      refetchQueue();
    } else {
      toast.error(json.error || "Failed to update queue");
    }
  };

  if (isLoading) return <Loading message="Loading dashboard..." />;

  const queue = queues?.[0];
  const scheduled = appointments?.filter((a) => a.status === "scheduled") || [];
  const inProgress = appointments?.filter((a) => a.status === "in-progress") || [];
  const completed = appointments?.filter((a) => a.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Manage your appointments and patient queue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduled.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>
      </div>

      {queue && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Patient Queue</CardTitle>
            <Button onClick={handleNextPatient} size="sm">
              Next Patient
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Current Serial</p>
                <p className="text-3xl font-bold text-primary">{queue.currentSerial}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Booked</p>
                <p className="text-3xl font-bold">{queue.totalBooked}</p>
              </div>
              <Badge variant={queue.status === "active" ? "success" : "secondary"}>
                {queue.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {!appointments || appointments.length === 0 ? (
            <p className="text-muted-foreground">No appointments for today.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {apt.serialNumber}
                    </span>
                    <div>
                      <p className="font-medium">{apt.patientId?.userId?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.type} &middot; {apt.patientId?.userId?.phone || ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant={apt.status === "completed" ? "success" : "secondary"}>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
