import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import QueueModel from "@/models/Queue";
import AppointmentModel from "@/models/Appointment";
import { emitServerEvent, SOCKET_EVENTS } from "@/lib/socket";

const patchSchema = z.object({
  action: z.enum(["next", "pause", "resume", "close", "open"]),
  doctorId: z.string().min(1),
  date: z.string().min(1),
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
    const date = searchParams.get("date");

    const filter: Record<string, unknown> = {};
    if (doctorId) filter.doctorId = doctorId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const queues = await QueueModel.find(filter)
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

    const existing = await QueueModel.findOne({ doctorId, date: queueDate });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const queue = await QueueModel.create({
      doctorId,
      date: queueDate,
      currentSerial: 0,
      totalBooked: 0,
      status: "open",
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

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid action", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action, doctorId, date } = parsed.data;
    const queueDate = new Date(date);
    queueDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let queue = await QueueModel.findOne({ doctorId, date: queueDate });

    if (!queue && action === "next") {
      // Auto-create queue if it doesn't exist
      queue = await QueueModel.create({
        doctorId,
        date: queueDate,
        currentSerial: 0,
        totalBooked: 0,
        status: "open",
      });
    }

    if (!queue) {
      return NextResponse.json({ success: false, error: "Queue not found for this date" }, { status: 404 });
    }

    switch (action) {
      case "next": {
        const newSerial = queue.currentSerial + 1;

        // Mark previous serial as serving/completed
        if (queue.currentSerial > 0) {
          await AppointmentModel.findOneAndUpdate(
            {
              doctorId,
              appointmentDate: { $gte: queueDate, $lte: endOfDay },
              serialNumber: queue.currentSerial,
              status: { $in: ["confirmed", "serving"] },
            },
            { status: "completed" }
          );
        }

        // Mark new serial as serving
        await AppointmentModel.findOneAndUpdate(
          {
            doctorId,
            appointmentDate: { $gte: queueDate, $lte: endOfDay },
            serialNumber: newSerial,
            status: "confirmed",
          },
          { status: "serving" }
        );

        queue.currentSerial = newSerial;
        if (queue.status === "paused") queue.status = "open";
        await queue.save();
        break;
      }

      case "pause":
        queue.status = "paused";
        await queue.save();
        break;

      case "resume":
      case "open":
        queue.status = "open";
        await queue.save();
        break;

      case "close":
        // Mark all remaining as no-show
        await AppointmentModel.updateMany(
          {
            doctorId,
            appointmentDate: { $gte: queueDate, $lte: endOfDay },
            serialNumber: { $gt: queue.currentSerial },
            status: { $in: ["confirmed", "pending"] },
          },
          { status: "no-show" }
        );
        // Mark current as completed
        if (queue.currentSerial > 0) {
          await AppointmentModel.findOneAndUpdate(
            {
              doctorId,
              appointmentDate: { $gte: queueDate, $lte: endOfDay },
              serialNumber: queue.currentSerial,
              status: "serving",
            },
            { status: "completed" }
          );
        }
        queue.status = "closed";
        await queue.save();
        break;
    }

    const populated = await QueueModel.findById(queue._id).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name" },
    });

    // Emit socket event
    emitServerEvent(SOCKET_EVENTS.QUEUE_UPDATED, {
      doctorId,
      currentSerial: queue.currentSerial,
      status: queue.status,
      totalBooked: queue.totalBooked,
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error("Update queue error:", error);
    return NextResponse.json({ success: false, error: "Failed to update queue" }, { status: 500 });
  }
}
