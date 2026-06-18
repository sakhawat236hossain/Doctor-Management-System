import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AppointmentModel from "@/models/Appointment";
import QueueModel from "@/models/Queue";
import DoctorModel from "@/models/Doctor";
import PaymentModel from "@/models/Payment";
import PatientModel from "@/models/Patient";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const bookingSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  appointmentDate: z.string().min(1, "Date is required"),
  type: z.enum(["new", "follow-up"]),
  patientName: z.string().min(1, "Patient name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  notes: z.string().optional().default(""),
  paymentMethod: z.enum(["cash", "bkash", "nagad", "rocket", "card"]).default("cash"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await AppointmentModel.find(filter)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name email" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" },
      })
      .sort({ appointmentDate: -1, serialNumber: 1 });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    // Zod validation
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { doctorId, appointmentDate, type, notes, paymentMethod } = parsed.data;
    const date = new Date(appointmentDate);
    const dayName = DAY_NAMES[date.getDay()];

    // 1. Check doctor exists and is active
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    // 2. Check valid working day
    if (doctor.status === "on-leave") {
      return NextResponse.json({ success: false, error: "Doctor is currently on leave" }, { status: 400 });
    }

    const dateOnly = date.toISOString().split("T")[0];
    const isOffDay = doctor.offDays.some(
      (off: Date) => new Date(off).toISOString().split("T")[0] === dateOnly
    );
    if (isOffDay) {
      return NextResponse.json({ success: false, error: "Doctor is off on this day" }, { status: 400 });
    }

    const scheduleSlot = doctor.schedule.find(
      (s: { day: string }) => s.day === dayName
    );
    if (!scheduleSlot) {
      return NextResponse.json({ success: false, error: "Doctor has no schedule for this day" }, { status: 400 });
    }

    // 3. Check slot availability
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedCount = await AppointmentModel.countDocuments({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ["cancelled", "no-show"] },
    });

    if (bookedCount >= scheduleSlot.maxPatients) {
      return NextResponse.json({ success: false, error: "No available slots for this date" }, { status: 400 });
    }

    // 4. Get patient record
    const patient = await PatientModel.findOne({ userId: session.user.id });
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient profile not found" }, { status: 404 });
    }

    // 5. Get next serial number
    const serialNumber = await AppointmentModel.getNextSerial(doctorId, date);
    const timeSlot = `${scheduleSlot.startTime} - ${scheduleSlot.endTime}`;

    // 6. Create appointment
    const appointment = await AppointmentModel.create({
      doctorId,
      patientId: patient._id,
      bookedBy: session.user.id,
      appointmentDate: date,
      serialNumber,
      timeSlot,
      type,
      status: "confirmed",
      notes: notes || "",
    });

    // 7. Create payment
    const feeAmount = type === "new" ? doctor.visitFee : doctor.followUpFee;
    const paymentStatus = paymentMethod === "cash" ? "due" : "paid";
    const payment = await PaymentModel.create({
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId,
      amount: feeAmount,
      status: paymentStatus,
      method: paymentMethod,
      paidAt: paymentMethod !== "cash" ? new Date() : undefined,
      collectedBy: session.user.id,
    });

    // 8. Upsert queue
    await QueueModel.findOneAndUpdate(
      { doctorId, date: startOfDay },
      {
        $setOnInsert: {
          doctorId,
          date: startOfDay,
          currentSerial: 0,
          status: "open",
        },
        $inc: { totalBooked: 1 },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          appointment,
          serialNumber,
          payment,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
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
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Appointment ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const appointment = await AppointmentModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update appointment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Appointment ID required" }, { status: 400 });
    }

    const appointment = await AppointmentModel.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json({ success: false, error: "Failed to cancel appointment" }, { status: 500 });
  }
}
