import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Doctor from "@/models/Doctor";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const speciality = searchParams.get("speciality");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (speciality) filter.speciality = speciality;

    const doctors = await Doctor.find(filter).populate("userId", "name email phone isActive");

    return NextResponse.json({ success: true, data: doctors });
  } catch (error) {
    console.error("Get doctors error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch doctors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, phone, speciality, degree, visitFee, followUpFee, schedule } = body;

    if (!name || !email || !password || !phone || !speciality || !degree) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "doctor",
      isActive: true,
    });

    const doctor = await Doctor.create({
      userId: user._id,
      speciality,
      degree,
      visitFee: visitFee || 100,
      followUpFee: followUpFee || 50,
      status: "available",
      schedule: schedule || [],
    });

    const populated = await Doctor.findById(doctor._id).populate("userId", "name email phone");

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error("Create doctor error:", error);
    return NextResponse.json({ success: false, error: "Failed to create doctor" }, { status: 500 });
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
    const { id, status, visitFee, followUpFee, schedule } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Doctor ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (visitFee !== undefined) updateData.visitFee = visitFee;
    if (followUpFee !== undefined) updateData.followUpFee = followUpFee;
    if (schedule) updateData.schedule = schedule;

    const doctor = await Doctor.findByIdAndUpdate(id, updateData, { new: true }).populate(
      "userId",
      "name email phone"
    );

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error("Update doctor error:", error);
    return NextResponse.json({ success: false, error: "Failed to update doctor" }, { status: 500 });
  }
}
