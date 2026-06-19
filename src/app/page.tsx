"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  Search,
  CalendarCheck,
  ClipboardList,
  Ticket,
  Star,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DoctorCard } from "@/components/shared/DoctorCard";
import { SiteSettings } from "@/components/shared/SiteSettings";
import { useT } from "@/lib/i18n";
import type { IDoctor, IUser } from "@/types";

/* ─── Count-up hook ─── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const stepTime = duration / target;
          let current = 0;
          const timer = setInterval(() => {
            current += Math.ceil(target / 100);
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, stepTime * (target / 100));
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

/* ─── Stat Item Component ─── */
function StatItem({ label, value, suffix, display }: { label: string; value: number; suffix: string; display?: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center text-white">
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
        {display ? display : count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-blue-100">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const t = useT();
  const [doctors, setDoctors] = useState<(IDoctor & { userId: IUser })[]>([]);

  useEffect(() => {
    fetch("/api/doctors?limit=6")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDoctors(res.data);
      })
      .catch(() => {});
  }, []);

  const stats = [
    { label: t("landing.doctors"), value: 50, suffix: "+" },
    { label: t("landing.patients"), value: 10000, suffix: "+", display: "10,000" },
    { label: t("landing.specialities"), value: 15, suffix: "+" },
    { label: t("landing.satisfied"), value: 98, suffix: "%" },
  ];

  const steps = [
    { icon: Search, title: t("landing.searchDoctor"), desc: t("landing.searchDoctorDesc") },
    { icon: CalendarCheck, title: t("landing.selectTime"), desc: t("landing.selectTimeDesc") },
    { icon: ClipboardList, title: t("landing.giveBooking"), desc: t("landing.giveBookingDesc") },
    { icon: Ticket, title: t("landing.getToken"), desc: t("landing.getTokenDesc") },
  ];

  const testimonials = [
    { name: "Rashida Begum", text: "MediFlow made booking appointments so easy. I no longer have to wait in long queues!", rating: 5, location: "Dhaka" },
    { name: "Abdul Karim", text: "The real-time queue updates are amazing. I knew exactly when to go to the chamber.", rating: 5, location: "Chittagong" },
    { name: "Fatema Akter", text: "Very professional service. The doctors are experienced and the platform is reliable.", rating: 4, location: "Sylhet" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ━━━ Navbar ━━━ */}
      <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur dark:border-slate-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">MediFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-slate-400">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t("landing.home")}</a>
            <Link href="/doctors" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t("landing.doctors")}</Link>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t("landing.howItWorks")}</a>
          </nav>
          <div className="flex items-center gap-3">
            <SiteSettings />
            <Button variant="ghost" asChild className="hidden sm:inline-flex dark:text-slate-300 dark:hover:text-white">
              <Link href="/login">{t("auth.login")}</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/doctors">{t("appointment.bookNow")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ━━━ Hero ━━━ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge variant="outline" className="mb-4 border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950">
            {t("landing.trustedBy")}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            {t("landing.tagline").split(",")[0]},{" "}
            <span className="text-blue-600 dark:text-blue-400">{t("landing.tagline").split(",").slice(1).join(",").trim()}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg text-gray-600 dark:text-slate-400">
            {t("landing.heroDesc")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 h-12">
              <Link href="/doctors">
                <Search className="mr-2 h-4 w-4" />
                {t("landing.findDoctor")}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 border-teal-500 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-950">
              <Link href="/register">
                {t("landing.registerAsPatient")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-100 dark:bg-blue-900/20 opacity-40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-100 dark:bg-teal-900/20 opacity-40 blur-3xl" />
      </section>

      {/* ━━━ Stats Bar ━━━ */}
      <section className="bg-blue-600 dark:bg-blue-800 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <StatItem key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ How It Works ━━━ */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-300">
              {t("landing.simpleProcess")}
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {t("landing.howItWorksTitle")}
            </h2>
            <p className="mt-3 text-gray-600 dark:text-slate-400 max-w-xl mx-auto">
              {t("landing.howItWorksDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card key={step.title} className="relative text-center border border-gray-100 dark:border-slate-800 dark:bg-slate-900 hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6 px-5">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="mx-auto mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                    <step.icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Featured Doctors ━━━ */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300">
                {t("landing.ourSpecialists")}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t("landing.featuredDoctors")}</h2>
            </div>
            <Button variant="outline" asChild className="hidden sm:inline-flex dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Link href="/doctors">
                {t("appointment.viewAll")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {doctors.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="snap-start w-[320px] sm:w-[360px] shrink-0">
                  <DoctorCard doctor={doctor} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild className="dark:border-slate-700 dark:text-slate-300">
              <Link href="/doctors">{t("landing.viewAllDoctors")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ━━━ Testimonials ━━━ */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-300">
              {t("landing.patientReviews")}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t("landing.whatPatientsSay")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((tw) => (
              <Card key={tw.name} className="border border-gray-100 dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < tw.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-slate-700"}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">&ldquo;{tw.text}&rdquo;</p>
                  <Separator className="my-4 dark:bg-slate-700" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                      {tw.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{tw.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500">{tw.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Activity className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold text-white">MediFlow</span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t("landing.footerDesc")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("landing.quickLinks")}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{t("landing.home")}</a></li>
                <li><Link href="/doctors" className="hover:text-white transition-colors">{t("landing.doctors")}</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{t("landing.howItWorks")}</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">{t("auth.register")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("landing.specialitiesTitle")}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/doctors?speciality=Medicine" className="hover:text-white transition-colors">Medicine</Link></li>
                <li><Link href="/doctors?speciality=Cardiology" className="hover:text-white transition-colors">Cardiology</Link></li>
                <li><Link href="/doctors?speciality=Dental" className="hover:text-white transition-colors">Dental</Link></li>
                <li><Link href="/doctors?speciality=Neurology" className="hover:text-white transition-colors">Neurology</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("landing.contact")}</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-400" /> +880 1700-000000</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-400" /> support@mediflow.com</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-400" /> Dhaka, Bangladesh</li>
              </ul>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700 dark:bg-slate-800" />
          <p className="text-center text-sm text-gray-500 dark:text-slate-600">
            &copy; 2024 MediFlow. {t("landing.rightsReserved")}
          </p>
        </div>
      </footer>
    </div>
  );
}
