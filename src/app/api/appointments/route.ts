import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Appointment from "@/models/Appointment";
import Queue from "@/models/Queue";

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

    const appointments = await Appointment.find(filter)
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
    const { doctorId, patientId, appointmentDate, type, notes } = body;

    if (!doctorId || !patientId || !appointmentDate || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const date = new Date(appointmentDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const lastAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ serialNumber: -1 });

    const serialNumber = lastAppointment ? lastAppointment.serialNumber + 1 : 1;

    const appointment = await Appointment.create({
      doctorId,
      patientId,
      serialNumber,
      appointmentDate: date,
      type,
      status: "scheduled",
      notes,
    });

    let queue = await Queue.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!queue) {
      queue = await Queue.create({
        doctorId,
        date: startOfDay,
        currentSerial: 0,
        totalBooked: 1,
        status: "active",
      });
    } else {
      queue.totalBooked += 1;
      await queue.save();
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create appointment" }, { status: 500 });
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

    const appointment = await Appointment.findByIdAndUpdate(id, updateData, { new: true });

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

    const appointment = await Appointment.findByIdAndUpdate(
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
