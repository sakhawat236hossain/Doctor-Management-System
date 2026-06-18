"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorCard } from "@/components/shared/DoctorCard";
import type { IDoctor, IUser } from "@/types";

/* ─── Specialities ─── */
const SPECIALITIES = [
  "Medicine",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Dental",
  "Dermatology",
  "Gynecology",
  "Pediatrics",
  "ENT",
  "Ophthalmology",
];

interface DoctorResponse {
  success: boolean;
  data: (IDoctor & { userId: IUser })[];
  total: number;
  page: number;
  totalPages: number;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<(IDoctor & { userId: IUser })[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [availableToday, setAvailableToday] = useState(false);
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [page, setPage] = useState(1);

  // Mobile filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  }, []);

  // Fetch doctors
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (specialities.length === 1) params.set("speciality", specialities[0]);
    if (availableToday) params.set("availableToday", "true");
    if (minFee) params.set("minFee", minFee);
    if (maxFee) params.set("maxFee", maxFee);
    params.set("page", String(page));
    params.set("limit", "10");

    fetch(`/api/doctors?${params.toString()}`)
      .then((r) => r.json())
      .then((res: DoctorResponse) => {
        if (res.success) {
          setDoctors(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, specialities, availableToday, minFee, maxFee, page]);

  // Toggle speciality
  const toggleSpeciality = (spec: string) => {
    setSpecialities((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [spec]
    );
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSpecialities([]);
    setAvailableToday(false);
    setMinFee("");
    setMaxFee("");
    setPage(1);
  };

  const hasActiveFilters = search || specialities.length > 0 || availableToday || minFee || maxFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">MediFlow 🏥</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Page header */}
      <section className="bg-white border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Find Your Doctor
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            {total > 0 ? `${total} doctors found` : "Browse our doctor directory"}
          </p>
          {/* Search bar */}
          <div className="mt-4 flex gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by doctor name or speciality..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-10"
              />
              {searchInput && (
                <button
                  onClick={() => { handleSearchInput(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* ━━━ Filter Sidebar ━━━ */}
          <aside
            className={`${
              showFilters ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto md:static md:inset-auto md:z-auto md:bg-transparent md:p-0" : "hidden"
            } md:block w-full md:w-64 shrink-0`}
          >
            <div className="flex items-center justify-between md:hidden mb-4">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <Card>
              <CardContent className="p-5 space-y-6">
                {/* Active filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear all filters
                  </Button>
                )}

                {/* Speciality */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Speciality</h4>
                  <div className="space-y-2">
                    {SPECIALITIES.map((spec) => (
                      <label key={spec} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={specialities.includes(spec)}
                          onChange={() => toggleSpeciality(spec)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Available Today */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">Available Today</span>
                    <button
                      role="switch"
                      aria-checked={availableToday}
                      onClick={() => { setAvailableToday(!availableToday); setPage(1); }}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        availableToday ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          availableToday ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                <Separator />

                {/* Fee Range */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Fee Range (৳)</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minFee}
                      onChange={(e) => { setMinFee(e.target.value); setPage(1); }}
                      className="h-9"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxFee}
                      onChange={(e) => { setMaxFee(e.target.value); setPage(1); }}
                      className="h-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {showFilters && (
              <Button
                className="w-full mt-4 md:hidden bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowFilters(false)}
              >
                Show Results ({total})
              </Button>
            )}
          </aside>

          {/* ━━━ Doctor Grid ━━━ */}
          <main className="flex-1 min-w-0">
            {loading ? (
              /* Skeleton loading */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {doctors.map((doctor) => (
                    <DoctorCard key={doctor._id} doctor={doctor} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button
                          key={i}
                          variant={page === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(i + 1)}
                          className={page === i + 1 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                  <Stethoscope className="h-12 w-12 text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  কোনো ডাক্তার পাওয়া যায়নি
                </h3>
                <p className="mt-2 text-gray-500 max-w-sm">
                  No doctors match your current filters. Try adjusting your search criteria.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={clearFilters}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
