"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Check,
  AlertCircle,
  Lock,
  User,
  Phone,
  Calendar,
  MapPin,
  Heart,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

interface PatientProfile {
  _id: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function ProfileContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileStatus, setProfileStatus] = useState<SaveStatus>("idle");
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const u = res.data.user;
          const p = res.data.patient;
          setUser(u);
          setPatient(p);
          setName(u.name || "");
          setPhone(u.phone || "");
          if (p) {
            setDateOfBirth(
              p.dateOfBirth
                ? new Date(p.dateOfBirth).toISOString().split("T")[0]
                : ""
            );
            setGender(p.gender || "");
            setBloodGroup(p.bloodGroup || "");
            setAddress(p.address || "");
            setEmergencyContact(p.emergencyContact || "");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setProfileStatus("saving");

    // Optimistic update
    const prevName = user?.name;
    const prevPhone = user?.phone;
    setUser((prev) => (prev ? { ...prev, name, phone } : prev));

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          dateOfBirth,
          gender,
          bloodGroup,
          address,
          emergencyContact,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileStatus("saved");
        setUser(data.data.user);
        setPatient(data.data.patient);
        setTimeout(() => setProfileStatus("idle"), 2500);
      } else {
        // Revert on error
        setUser((prev) =>
          prev ? { ...prev, name: prevName || "", phone: prevPhone || "" } : prev
        );
        setProfileStatus("error");
        setErrorMessage(data.error || "Failed to save");
        setTimeout(() => setProfileStatus("idle"), 3000);
      }
    } catch {
      setUser((prev) =>
        prev ? { ...prev, name: prevName || "", phone: prevPhone || "" } : prev
      );
      setProfileStatus("error");
      setErrorMessage("Network error");
      setTimeout(() => setProfileStatus("idle"), 3000);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setErrorMessage("Passwords do not match");
      setTimeout(() => setPasswordStatus("idle"), 3000);
      return;
    }

    setPasswordStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordStatus("saved");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordStatus("idle"), 2500);
      } else {
        setPasswordStatus("error");
        setErrorMessage(data.error || "Failed to change password");
        setTimeout(() => setPasswordStatus("idle"), 3000);
      }
    } catch {
      setPasswordStatus("error");
      setErrorMessage("Network error");
      setTimeout(() => setPasswordStatus("idle"), 3000);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="mt-3 text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">আমার প্রোফাইল</h1>

      {/* Profile Edit Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 text-sm mb-1.5">
                <User className="h-3.5 w-3.5" /> Name
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm mb-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm mb-1.5 block">Email (read-only)</Label>
            <Input value={user?.email || ""} disabled className="bg-gray-50" />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 text-sm mb-1.5">
                <Calendar className="h-3.5 w-3.5" /> Date of Birth
              </Label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Gender</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm mb-1.5">
                <Heart className="h-3.5 w-3.5" /> Blood Group
              </Label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-sm mb-1.5">
              <MapPin className="h-3.5 w-3.5" /> Address
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-sm mb-1.5">
              <Phone className="h-3.5 w-3.5" /> Emergency Contact
            </Label>
            <Input
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Emergency phone number"
            />
          </div>

          {/* Status + Save */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={saveProfile}
              disabled={profileStatus === "saving"}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {profileStatus === "saving" ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            {profileStatus === "saved" && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <Check className="h-4 w-4" /> Saved ✓
              </span>
            )}
            {profileStatus === "error" && (
              <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                <AlertCircle className="h-4 w-4" /> {errorMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm mb-1.5 block">Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-1.5 block">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={changePassword}
              disabled={
                passwordStatus === "saving" ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {passwordStatus === "saving" ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent mr-2" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>

            {passwordStatus === "saved" && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <Check className="h-4 w-4" /> Password changed ✓
              </span>
            )}
            {passwordStatus === "error" && (
              <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                <AlertCircle className="h-4 w-4" /> {errorMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <ProfileContent />
    </RoleGuard>
  );
}
