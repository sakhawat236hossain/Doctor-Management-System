import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET: all receptionists
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const receptionists = await User.find({ role: "receptionist" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: receptionists,
    });
  } catch (error) {
    console.error("Admin receptionists GET error:", error);
    return NextResponse.json(
      { success: false, error: "রিসেপশনিস্টদের তথ্য লোড করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}

// POST: create User (role: receptionist)
const createReceptionistSchema = z.object({
  name: z.string().min(1, "নাম প্রয়োজন"),
  email: z.string().email("সঠিক ইমেইল দিন"),
  phone: z.string().min(1, "ফোন নম্বর প্রয়োজন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parsed = createReceptionistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "ভুল তথ্য" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "এই ইমেইল আগে থেকে ব্যবহৃত" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: hashedPassword,
      role: "receptionist",
    });

    const result = JSON.parse(JSON.stringify(user.toObject()));
    delete result.password;

    return NextResponse.json(
      { success: true, data: result, message: "রিসেপশনিস্ট সফলভাবে যোগ হয়েছে" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin receptionists POST error:", error);
    return NextResponse.json(
      { success: false, error: "রিসেপশনিস্ট যোগ করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}

// PATCH: toggle isActive
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "ইউজার আইডি প্রয়োজন" }, { status: 400 });
    }

    await User.findByIdAndUpdate(userId, { isActive });

    return NextResponse.json({
      success: true,
      message: isActive === false ? "রিসেপশনিস্ট নিষ্ক্রিয় করা হয়েছে" : "রিসেপশনিস্ট সক্রিয় করা হয়েছে",
    });
  } catch (error) {
    console.error("Admin receptionists PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "আপডেট করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
