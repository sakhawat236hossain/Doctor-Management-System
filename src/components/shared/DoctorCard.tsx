import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, MapPin } from "lucide-react";
import type { IDoctor, IUser } from "@/types";

interface DoctorCardProps {
  doctor: IDoctor & { userId: IUser };
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const user = doctor.userId;
  const name = user?.name || "Unknown Doctor";
  const profileImage = doctor.profileImage || user?.profileImage;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isAvailable = doctor.status === "available";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-blue-100">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-blue-600">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                <p className="text-sm text-blue-600 font-medium">{doctor.speciality}</p>
              </div>
              <Badge variant={isAvailable ? "success" : "secondary"} className="shrink-0">
                {isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>

            {/* Degrees */}
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="truncate">{doctor.degree.join(", ")}</span>
            </div>

            {/* Chamber */}
            {doctor.chamberAddress && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{doctor.chamberAddress}</span>
              </div>
            )}

            {/* Fee + CTA */}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-gray-900">৳{doctor.visitFee}</span>
                <span className="text-xs text-muted-foreground ml-1">visit fee</span>
              </div>
              <Button size="sm" asChild>
                <Link href={`/doctors/${doctor._id}`}>Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
