import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import NotificationModel from "@/models/Notification";

export const dynamic = "force-dynamic";

// PATCH: mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "নোটিফিকেশন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error("Notification read PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "আপডেট করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
