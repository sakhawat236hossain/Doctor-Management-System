import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import NotificationModel from "@/models/Notification";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET: fetch notifications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      NotificationModel.countDocuments({ userId: session.user.id, isRead: false }),
    ]);

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { success: false, error: "নোটিফিকেশন লোড করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}

// POST: create notification (internal helper — call from API routes)
const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["info", "warning", "success", "alert"]).default("info"),
  link: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parsed = createNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "ভুল তথ্য" },
        { status: 400 }
      );
    }

    const notification = await NotificationModel.create(parsed.data);

    // Emit socket event for real-time
    const io = (globalThis as Record<string, unknown>).io as
      | { to?: (room: string) => { emit: (event: string, data: unknown) => void } }
      | undefined;
    if (io?.to) {
      io.to(`user:${parsed.data.userId}`).emit("notification:new", {
        id: notification._id,
        title: parsed.data.title,
      });
    }

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { success: false, error: "নোটিফিকেশন তৈরি করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
