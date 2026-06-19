import { connectDB } from "@/lib/db";
import NotificationModel from "@/models/Notification";
import User from "@/models/User";

/**
 * Server-side helper to create notifications without auth check.
 * Import and call directly from other API routes.
 */
export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "alert";
  link?: string;
}): Promise<void> {
  try {
    await connectDB();
    await NotificationModel.create({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      link: params.link || "",
    });

    // Emit socket event
    const io = (globalThis as Record<string, unknown>).io as
      | { to?: (room: string) => { emit: (event: string, data: unknown) => void } }
      | undefined;
    if (io?.to) {
      io.to(`user:${params.userId}`).emit("notification:new", {
        title: params.title,
      });
    }
  } catch (err) {
    console.error("createNotification helper error:", err);
  }
}

/**
 * Notify all users of specific roles.
 */
export async function notifyByRole(params: {
  roles: string[];
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "alert";
  link?: string;
}): Promise<void> {
  try {
    await connectDB();
    const users = await User.find({ role: { $in: params.roles }, isActive: true })
      .select("_id")
      .lean();

    const notifications = users.map((u: { _id: unknown }) => ({
      userId: u._id,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      link: params.link || "",
    }));

    if (notifications.length > 0) {
      await NotificationModel.insertMany(notifications);
    }
  } catch (err) {
    console.error("notifyByRole error:", err);
  }
}
