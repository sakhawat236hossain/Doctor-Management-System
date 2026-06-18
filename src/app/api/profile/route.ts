import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import PatientModel from "@/models/Patient";

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id).select("-password");
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    let patient = null;
    if (user.role === "patient") {
      patient = await PatientModel.findOne({ userId: user._id });
    }

    return NextResponse.json({ success: true, data: { user, patient } });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact } = parsed.data;

    // Update User fields
    const userUpdate: Record<string, unknown> = {};
    if (name) userUpdate.name = name;
    if (phone) userUpdate.phone = phone;

    if (Object.keys(userUpdate).length > 0) {
      await UserModel.findByIdAndUpdate(session.user.id, userUpdate);
    }

    // Update Patient fields
    if (session.user.role === "patient") {
      const patientUpdate: Record<string, unknown> = {};
      if (dateOfBirth) patientUpdate.dateOfBirth = new Date(dateOfBirth);
      if (gender) patientUpdate.gender = gender;
      if (bloodGroup) patientUpdate.bloodGroup = bloodGroup;
      if (address !== undefined) patientUpdate.address = address;
      if (emergencyContact !== undefined) patientUpdate.emergencyContact = emergencyContact;

      if (Object.keys(patientUpdate).length > 0) {
        await PatientModel.findOneAndUpdate({ userId: session.user.id }, patientUpdate);
      }
    }

    const user = await UserModel.findById(session.user.id).select("-password");
    const patient = await PatientModel.findOne({ userId: session.user.id });

    return NextResponse.json({ success: true, data: { user, patient } });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await UserModel.findById(session.user.id).select("+password");
    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 12);
    await user.save();

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 });
  }
}
