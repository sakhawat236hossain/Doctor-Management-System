import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AppointmentModel from "@/models/Appointment";
import PatientModel from "@/models/Patient";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const appointment = await AppointmentModel.findById(params.appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Authorization: patient can cancel own, receptionist/admin can cancel any
    const role = session.user.role;
    if (role === "patient") {
      const patient = await PatientModel.findOne({ userId: session.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return NextResponse.json(
          { success: false, error: "You can only cancel your own appointments" },
          { status: 403 }
        );
      }
    } else if (!["receptionist", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Only allow cancelling confirmed or pending appointments
    if (!["confirmed", "pending"].includes(appointment.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel appointment with status: ${appointment.status}` },
        { status: 400 }
      );
    }

    appointment.status = "cancelled";
    await appointment.save();

    const populated = await AppointmentModel.findById(appointment._id)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name phone" },
      });

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
