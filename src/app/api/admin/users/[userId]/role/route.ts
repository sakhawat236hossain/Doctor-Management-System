import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { DoctorModel } from "@/models/Doctor";
import { PatientModel } from "@/models/Patient";
import { z } from "zod";

export const dynamic = "force-dynamic";

// PATCH: Change user role with linked document creation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error, session } = await requireRole(["admin"]);
  if (error) return error;

  await connectDB();

  const body = await request.json();
  const schema = z.object({
    newRole: z.enum(["admin", "doctor", "receptionist", "patient"]),
    // Doctor-specific fields (required when changing to doctor)
    doctorData: z
      .object({
        speciality: z.string().min(1),
        visitFee: z.number().min(0),
        followUpFee: z.number().min(0),
      })
      .optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { newRole, doctorData } = parsed.data;

  const user = await UserModel.findById(params.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Prevent self-role-change
  if (user._id.toString() === session!.user.id) {
    return NextResponse.json(
      { success: false, error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  // Last admin protection
  if (user.role === "admin" && newRole !== "admin") {
    const adminCount = await UserModel.countDocuments({ role: "admin", isActive: true });
    if (adminCount <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot demote the last admin" },
        { status: 400 }
      );
    }
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  // Create linked documents if needed
  if (newRole === "doctor" && oldRole !== "doctor") {
    if (!doctorData) {
      return NextResponse.json(
        { success: false, error: "Doctor fields required when changing to doctor role" },
        { status: 400 }
      );
    }

    const existingDoctor = await DoctorModel.findOne({ userId: user._id });
    if (!existingDoctor) {
      await DoctorModel.create({
        userId: user._id,
        speciality: doctorData.speciality,
        degree: [],
        bio: "",
        profileImage: user.profileImage || "",
        visitFee: doctorData.visitFee,
        followUpFee: doctorData.followUpFee,
        chamberAddress: "",
        chamberPhone: "",
        schedule: [],
        offDays: [],
        status: "available",
        isActive: true,
      });
    }
  }

  if (newRole === "patient" && oldRole !== "patient") {
    const existingPatient = await PatientModel.findOne({ userId: user._id });
    if (!existingPatient) {
      await PatientModel.create({
        userId: user._id,
        dateOfBirth: new Date("2000-01-01"),
        gender: "other",
        bloodGroup: "O+",
        address: "",
        emergencyContact: "",
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: { message: "Role changed successfully" },
  });
}
