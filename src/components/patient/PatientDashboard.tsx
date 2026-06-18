"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, CreditCard, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Appointment {
  _id: string;
  serialNumber: number;
  appointmentDate: string;
  status: string;
  type: string;
  doctorId?: { userId?: { name: string }; speciality?: string };
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  method: string;
  appointmentId?: {
    appointmentDate: string;
    doctorId?: { userId?: { name: string } };
  };
}

export function PatientDashboard() {
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["patient-appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments");
      const json = await res.json();
      return json.success ? (json.data as Appointment[]) : [];
    },
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["patient-payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments");
      const json = await res.json();
      return json.success ? (json.data as Payment[]) : [];
    },
  });

  if (appointmentsLoading || paymentsLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  const upcoming = appointments?.filter((a) => a.status === "scheduled") || [];
  const completed = appointments?.filter((a) => a.status === "completed") || [];
  const duePayments = payments?.filter((p) => p.status === "due") || [];
  const totalDue = duePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <p className="text-muted-foreground">View your appointments and payment history</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcoming.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {!appointments || appointments.length === 0 ? (
              <p className="text-muted-foreground">No appointments found.</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">
                        Dr. {apt.doctorId?.userId?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {apt.doctorId?.speciality} &middot; {formatDate(apt.appointmentDate)} &middot; #{apt.serialNumber}
                      </p>
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

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {!payments || payments.length === 0 ? (
              <p className="text-muted-foreground">No payment records.</p>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">
                        Dr. {payment.appointmentId?.doctorId?.userId?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.method} &middot; {formatDate(payment.appointmentId?.appointmentDate || new Date())}
                      </p>
                    </div>
                    <Badge variant={payment.status === "paid" ? "success" : "warning"}>
                      {formatCurrency(payment.amount)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
