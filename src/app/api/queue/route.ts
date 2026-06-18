import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Queue from "@/models/Queue";
import Appointment from "@/models/Appointment";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const queues = await Queue.find(filter)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" },
      })
      .sort({ date: -1 });

    return NextResponse.json({ success: true, data: queues });
  } catch (error) {
    console.error("Get queue error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch queue" }, { status: 500 });
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
    const { doctorId, date } = body;

    if (!doctorId || !date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const queueDate = new Date(date);
    queueDate.setHours(0, 0, 0, 0);

    const existing = await Queue.findOne({ doctorId, date: queueDate });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const queue = await Queue.create({
      doctorId,
      date: queueDate,
      currentSerial: 0,
      totalBooked: 0,
      status: "active",
    });

    return NextResponse.json({ success: true, data: queue }, { status: 201 });
  } catch (error) {
    console.error("Create queue error:", error);
    return NextResponse.json({ success: false, error: "Failed to create queue" }, { status: 500 });
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
    const { id, currentSerial, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Queue ID required" }, { status: 400 });
    }

    const queue = await Queue.findById(id);
    if (!queue) {
      return NextResponse.json({ success: false, error: "Queue not found" }, { status: 404 });
    }

    if (currentSerial !== undefined) {
      queue.currentSerial = currentSerial;

      const startOfDay = new Date(queue.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(queue.date);
      endOfDay.setHours(23, 59, 59, 999);

      await Appointment.findOneAndUpdate(
        {
          doctorId: queue.doctorId,
          appointmentDate: { $gte: startOfDay, $lte: endOfDay },
          serialNumber: currentSerial,
        },
        { status: "in-progress" }
      );

      await Appointment.updateMany(
        {
          doctorId: queue.doctorId,
          appointmentDate: { $gte: startOfDay, $lte: endOfDay },
          serialNumber: { $lt: currentSerial },
          status: { $in: ["scheduled", "in-progress"] },
        },
        { status: "completed" }
      );
    }

    if (status) {
      queue.status = status;
    }

    await queue.save();

    const populated = await Queue.findById(queue._id).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name" },
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error("Update queue error:", error);
    return NextResponse.json({ success: false, error: "Failed to update queue" }, { status: 500 });
  }
}
