import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DoctorModel from "@/models/Doctor";
import AppointmentModel from "@/models/Appointment";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const dateStr = searchParams.get("date");

    if (!doctorId || !dateStr) {
      return NextResponse.json(
        { success: false, error: "doctorId and date are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const dayName = DAY_NAMES[date.getDay()];

    // Get doctor schedule for this day
    const doctor = await DoctorModel.findById(doctorId).select("schedule offDays status isActive");
    if (!doctor || !doctor.isActive) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Check if doctor is on-leave
    if (doctor.status === "on-leave") {
      return NextResponse.json({
        success: true,
        data: { available: false, bookedCount: 0, maxPatients: 0, remainingSlots: 0, reason: "Doctor is on leave" },
      });
    }

    // Check if it's an off day (compare date strings)
    const dateOnly = date.toISOString().split("T")[0];
    const isOffDay = doctor.offDays.some(
      (off: Date) => new Date(off).toISOString().split("T")[0] === dateOnly
    );
    if (isOffDay) {
      return NextResponse.json({
        success: true,
        data: { available: false, bookedCount: 0, maxPatients: 0, remainingSlots: 0, reason: "Doctor is off on this day" },
      });
    }

    // Check if doctor has schedule for this day of week
    const scheduleSlot = doctor.schedule.find(
      (s: { day: string }) => s.day === dayName
    );
    if (!scheduleSlot) {
      return NextResponse.json({
        success: true,
        data: { available: false, bookedCount: 0, maxPatients: 0, remainingSlots: 0, reason: "No schedule for this day" },
      });
    }

    // Count existing appointments for this doctor + date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedCount = await AppointmentModel.countDocuments({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ["cancelled", "no-show"] },
    });

    const maxPatients = scheduleSlot.maxPatients;
    const remainingSlots = Math.max(0, maxPatients - bookedCount);

    return NextResponse.json({
      success: true,
      data: {
        available: remainingSlots > 0,
        bookedCount,
        maxPatients,
        remainingSlots,
        timeSlot: `${scheduleSlot.startTime} - ${scheduleSlot.endTime}`,
      },
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
