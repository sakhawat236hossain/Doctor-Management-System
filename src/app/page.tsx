import Link from "next/link";
import { Activity, Calendar, CreditCard, Users, Stethoscope, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Appointment Management",
    description: "Schedule, track, and manage patient appointments with real-time queue updates.",
  },
  {
    icon: Users,
    title: "Patient Records",
    description: "Maintain comprehensive patient profiles with medical history and demographics.",
  },
  {
    icon: Stethoscope,
    title: "Doctor Scheduling",
    description: "Manage doctor availability, specialties, and consultation schedules.",
  },
  {
    icon: CreditCard,
    title: "Payment Processing",
    description: "Track payments, generate invoices, and manage billing efficiently.",
  },
  {
    icon: Activity,
    title: "Live Queue System",
    description: "Real-time patient queue management with Socket.io powered updates.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure access control for admins, doctors, receptionists, and patients.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-primary">MediFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Streamline Your{" "}
          <span className="text-primary">Medical Practice</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          MediFlow is a comprehensive doctor management system that helps clinics and hospitals
          manage appointments, patients, payments, and real-time queues — all in one platform.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/register">Start Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <feature.icon className="mb-2 h-8 w-8 text-accent" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Transform Your Practice?</h2>
          <p className="mt-4 text-muted-foreground">
            Join clinics already using MediFlow to deliver better patient care.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MediFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
