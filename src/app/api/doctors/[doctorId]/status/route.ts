import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DoctorModel from "@/models/Doctor";
import { emitServerEvent, SOCKET_EVENTS } from "@/lib/socket";

const statusSchema = z.object({
  status: z.enum(["available", "unavailable", "on-leave"]),
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

    // Only doctor, receptionist, or admin can update status
    const allowed = ["doctor", "receptionist", "admin"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const doctor = await DoctorModel.findByIdAndUpdate(
      params.doctorId,
      { status: parsed.data.status },
      { new: true }
    ).populate("userId", "name");

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    // Emit socket event for real-time updates
    emitServerEvent(SOCKET_EVENTS.DOCTOR_STATUS, {
      doctorId: params.doctorId,
      status: parsed.data.status,
    });

    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error("Update doctor status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
  }
}
