import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { DoctorModel } from "@/models/Doctor";
import { PatientModel } from "@/models/Patient";
import { AppointmentModel } from "@/models/Appointment";
import { PaymentModel } from "@/models/Payment";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET: Full user detail with linked Doctor/Patient data
export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  await connectDB();

  const user = await UserModel.findById(params.userId).select("+password").lean();
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const hasPassword = !!user.password && user.password.length > 0;
  const providers = user.authProviders || (hasPassword ? ["credentials"] : []);

  // Fetch linked documents
  let doctorData = null;
  let patientData = null;
  let appointments: unknown[] = [];

  if (user.role === "doctor") {
    doctorData = await DoctorModel.findOne({ userId: user._id }).lean();
  }

  if (user.role === "patient") {
    patientData = await PatientModel.findOne({ userId: user._id }).lean();
    // Last 10 appointments
    appointments = await AppointmentModel.find({ patientId: patientData?._id })
      .sort({ appointmentDate: -1 })
      .limit(10)
      .populate("doctorId", "speciality")
      .populate({ path: "doctorId", select: "userId", populate: { path: "userId", select: "name" } })
      .lean();
  }

  if (user.role === "receptionist") {
    // Appointments booked by this receptionist
    appointments = await AppointmentModel.find({ bookedBy: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "doctorId", select: "userId", populate: { path: "userId", select: "name" } })
      .populate({ path: "patientId", select: "userId", populate: { path: "userId", select: "name" } })
      .lean();
  }

  const { password: _, ...safeUser } = user;

  return NextResponse.json({
    success: true,
    data: {
      user: { ...safeUser, authProviders: providers, hasPassword },
      doctorData,
      patientData,
      appointments,
    },
  });
}

// PATCH: Update user info
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  await connectDB();

  const body = await request.json();
  const schema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const user = await UserModel.findById(params.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Check email uniqueness if changing
  if (parsed.data.email && parsed.data.email !== user.email) {
    const existing = await UserModel.findOne({ email: parsed.data.email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 400 }
      );
    }
    user.email = parsed.data.email;
  }

  if (parsed.data.name !== undefined) user.name = parsed.data.name;
  if (parsed.data.phone !== undefined) user.phone = parsed.data.phone;

  await user.save();

  return NextResponse.json({ success: true, data: { message: "User updated" } });
}

// DELETE: Delete user with cascade logic
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error, session } = await requireRole(["admin"]);
  if (error) return error;

  await connectDB();

  const user = await UserModel.findById(params.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Prevent self-delete
  if (user._id.toString() === session!.user.id) {
    return NextResponse.json(
      { success: false, error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  // Prevent deleting last admin
  if (user.role === "admin") {
    const adminCount = await UserModel.countDocuments({ role: "admin", isActive: true });
    if (adminCount <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the last admin account" },
        { status: 400 }
      );
    }
  }

  // Cascade logic: Archive (safer than hard-delete) appointments & payments
  if (user.role === "doctor") {
    const doctor = await DoctorModel.findOne({ userId: user._id });
    if (doctor) {
      // Cancel future pending appointments, keep completed ones as records
      await AppointmentModel.updateMany(
        { doctorId: doctor._id, status: { $in: ["pending", "confirmed"] } },
        { status: "cancelled" }
      );
      await DoctorModel.deleteOne({ userId: user._id });
    }
  }

  if (user.role === "patient") {
    const patient = await PatientModel.findOne({ userId: user._id });
    if (patient) {
      // Cancel future pending appointments
      await AppointmentModel.updateMany(
        { patientId: patient._id, status: { $in: ["pending", "confirmed"] } },
        { status: "cancelled" }
      );
      await PatientModel.deleteOne({ userId: user._id });
    }
  }

  // Delete the user
  await UserModel.deleteOne({ _id: user._id });

  return NextResponse.json({ success: true, data: { message: "User deleted" } });
}
