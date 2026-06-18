"use client";

import { RoleGuard } from "@/components/shared/RoleGuard";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Banknote, User } from "lucide-react";

function DoctorProfileContent() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">প্রোফাইল</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Doctor Profile</p>
              <p className="text-sm text-gray-500">Manage your settings from the schedule page</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/doctor/schedule">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <Calendar className="h-4 w-4" />
                সময়সূচী ও ছুটি
              </Button>
            </Link>
            <Link href="/doctor/schedule">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <Banknote className="h-4 w-4" />
                ফি ও চেম্বার সেটিংস
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DoctorProfilePage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <DoctorProfileContent />
    </RoleGuard>
  );
}
