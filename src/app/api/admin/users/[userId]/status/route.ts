import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";

export const dynamic = "force-dynamic";

// PATCH: Toggle user isActive status
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error, session } = await requireRole(["admin"]);
  if (error) return error;

  await connectDB();

  const user = await UserModel.findById(params.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Prevent self-deactivation
  if (user._id.toString() === session!.user.id) {
    return NextResponse.json(
      { success: false, error: "Cannot deactivate your own account" },
      { status: 400 }
    );
  }

  // Last admin protection
  if (user.role === "admin" && user.isActive) {
    const activeAdminCount = await UserModel.countDocuments({ role: "admin", isActive: true });
    if (activeAdminCount <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate the last active admin" },
        { status: 400 }
      );
    }
  }

  user.isActive = !user.isActive;
  await user.save();

  return NextResponse.json({
    success: true,
    data: { isActive: user.isActive, message: user.isActive ? "User activated" : "User deactivated" },
  });
}
