import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// PATCH: Admin resets a user's password
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  await connectDB();

  const body = await request.json();
  // Optional: admin can provide a specific password, or we auto-generate one
  const customPassword = body.password as string | undefined;

  const user = await UserModel.findById(params.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Generate a temp password if none provided
  const newPassword =
    customPassword && customPassword.length >= 6
      ? customPassword
      : crypto.randomBytes(8).toString("hex"); // 16-char hex password

  const hashed = await bcrypt.hash(newPassword, 12);
  user.password = hashed;

  // Also add "credentials" to authProviders if not present
  if (!user.authProviders.includes("credentials")) {
    user.authProviders.push("credentials");
  }

  await user.save();

  return NextResponse.json({
    success: true,
    data: {
      message: "Password reset successfully",
      // Return the plain password ONCE so admin can share it
      tempPassword: newPassword,
    },
  });
}
