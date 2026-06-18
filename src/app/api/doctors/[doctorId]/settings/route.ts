import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DoctorModel from "@/models/Doctor";

const scheduleSlotSchema = z.object({
  day: z.enum(["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  maxPatients: z.number().int().min(1),
});

const settingsSchema = z.object({
  schedule: z.array(scheduleSlotSchema).optional(),
  offDays: z.array(z.string()).optional(),
  visitFee: z.number().min(0).optional(),
  followUpFee: z.number().min(0).optional(),
  chamberAddress: z.string().optional(),
  chamberPhone: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only the doctor themselves, or admin can update settings
    if (session.user.role !== "admin" && session.user.role !== "doctor") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.schedule) updateData.schedule = parsed.data.schedule;
    if (parsed.data.offDays) updateData.offDays = parsed.data.offDays.map((d) => new Date(d));
    if (parsed.data.visitFee !== undefined) updateData.visitFee = parsed.data.visitFee;
    if (parsed.data.followUpFee !== undefined) updateData.followUpFee = parsed.data.followUpFee;
    if (parsed.data.chamberAddress !== undefined) updateData.chamberAddress = parsed.data.chamberAddress;
    if (parsed.data.chamberPhone !== undefined) updateData.chamberPhone = parsed.data.chamberPhone;

    const doctor = await DoctorModel.findByIdAndUpdate(
      params.doctorId,
      updateData,
      { new: true }
    ).populate("userId", "name email phone");

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error("Update doctor settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
