"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Search, Phone, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PatientWithUser {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
}

interface AppointmentRow {
  _id: string;
  serialNumber: number;
  appointmentDate: string;
  type: string;
  status: string;
  doctorId?: {
    userId?: { name: string };
    speciality: string;
  };
}

function PatientSearchContent() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<PatientWithUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithUser | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setSelectedPatient(null);
      setAppointments([]);
    }, 400);
  };

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/patients?search=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data.success) setPatients(data.data);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, []);

  // Trigger search when debounced value changes
  const prevSearch = useRef("");
  useEffect(() => {
    if (search !== prevSearch.current) {
      prevSearch.current = search;
      searchPatients(search);
    }
  }, [search, searchPatients]);

  // Fetch appointment history for selected patient
  const selectPatient = async (patient: PatientWithUser) => {
    setSelectedPatient(patient);
    setLoadingAppts(true);
    try {
      const res = await fetch(
        `/api/appointments?patientId=${patient._id}`
      );
      const data = await res.json();
      if (data.success) setAppointments(data.data);
    } catch {
      // ignore
    } finally {
      setLoadingAppts(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="secondary">নিশ্চিত</Badge>;
      case "serving":
        return <Badge className="bg-blue-100 text-blue-800">চলমান</Badge>;
      case "completed":
        return <Badge variant="success">সম্পন্ন</Badge>;
      case "cancelled":
        return <Badge variant="destructive">বাতিল</Badge>;
      case "no-show":
        return <Badge variant="outline">No-Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">রোগী খুঁজুন</h1>

      {/* Search Bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or phone number..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {searching && (
        <p className="text-sm text-gray-500">Searching...</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1 space-y-3">
          {patients.length === 0 && search.length >= 2 && !searching && (
            <Card>
              <CardContent className="p-8 text-center text-gray-400">
                <User className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">কোনো রোগী পাওয়া যায়নি</p>
              </CardContent>
            </Card>
          )}

          {patients.map((p) => (
            <Card
              key={p._id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPatient?._id === p._id
                  ? "border-blue-600 ring-1 ring-blue-200"
                  : ""
              }`}
              onClick={() => selectPatient(p)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-600">
                      {p.userId?.name?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {p.userId?.name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {p.userId?.phone}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {p.bloodGroup}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {p.gender}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Appointment History */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">
                    {selectedPatient.userId?.name} — Appointment History
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedPatient.userId?.phone} ·{" "}
                    {selectedPatient.userId?.email}
                  </p>
                </div>

                {loadingAppts ? (
                  <div className="p-8 text-center text-gray-400">
                    Loading history...
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No appointment history</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="text-left py-2.5 px-4 font-medium text-gray-500">
                            Serial
                          </th>
                          <th className="text-left py-2.5 px-4 font-medium text-gray-500">
                            Date
                          </th>
                          <th className="text-left py-2.5 px-4 font-medium text-gray-500">
                            Doctor
                          </th>
                          <th className="text-left py-2.5 px-4 font-medium text-gray-500">
                            Type
                          </th>
                          <th className="text-left py-2.5 px-4 font-medium text-gray-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((apt) => (
                          <tr key={apt._id} className="border-b last:border-0">
                            <td className="py-2.5 px-4 font-medium">
                              #{apt.serialNumber}
                            </td>
                            <td className="py-2.5 px-4 text-gray-600">
                              {new Date(apt.appointmentDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              <p className="text-gray-900">
                                {apt.doctorId?.userId?.name || "—"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {apt.doctorId?.speciality}
                              </p>
                            </td>
                            <td className="py-2.5 px-4">
                              {apt.type === "new" ? "নতুন" : "ফলো-আপ"}
                            </td>
                            <td className="py-2.5 px-4">
                              {statusBadge(apt.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {appointments.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-3 text-xs text-gray-500">
                      Total visits: {appointments.length} · Last visit:{" "}
                      {new Date(
                        appointments[0]?.appointmentDate
                      ).toLocaleDateString("en-GB")}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-400">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Select a patient to view history</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <RoleGuard allowedRoles={["receptionist", "admin"]}>
      <PatientSearchContent />
    </RoleGuard>
  );
}
