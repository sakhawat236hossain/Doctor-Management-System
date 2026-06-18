import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DoctorModel from "@/models/Doctor";
import UserModel from "@/models/User";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const speciality = searchParams.get("speciality") || "";
    const availableToday = searchParams.get("availableToday") === "true";
    const minFee = searchParams.get("minFee");
    const maxFee = searchParams.get("maxFee");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = { isActive: true };

    // Search by doctor name or speciality
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      // We need to find doctors whose userId has matching name, or speciality matches
      // First find matching user IDs
      const matchingUsers = await UserModel.find({ name: searchRegex, role: "doctor" }).select("_id");
      const matchingUserIds = matchingUsers.map((u) => u._id);
      filter.$or = [
        { userId: { $in: matchingUserIds } },
        { speciality: searchRegex },
      ];
    }

    if (speciality) {
      filter.speciality = speciality;
    }

    // Fee range
    if (minFee || maxFee) {
      const feeFilter: Record<string, number> = {};
      if (minFee) feeFilter.$gte = parseInt(minFee, 10);
      if (maxFee) feeFilter.$lte = parseInt(maxFee, 10);
      filter.visitFee = feeFilter;
    }

    // Available today: check if today's day name is in doctor.schedule
    if (availableToday) {
      const today = new Date();
      const dayName = DAY_NAMES[today.getDay()];
      filter["schedule.day"] = dayName;
      filter.status = "available";
    }

    const [doctors, total] = await Promise.all([
      DoctorModel.find(filter)
        .populate("userId", "name email phone profileImage isActive")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DoctorModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ success: true, data: doctors, total, page, totalPages });
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

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "doctor",
      isActive: true,
    });

    const doctor = await DoctorModel.create({
      userId: user._id,
      speciality,
      degree,
      visitFee: visitFee || 100,
      followUpFee: followUpFee || 50,
      status: "available",
      schedule: schedule || [],
    });

    const populated = await DoctorModel.findById(doctor._id).populate("userId", "name email phone");

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

    const doctor = await DoctorModel.findByIdAndUpdate(id, updateData, { new: true }).populate(
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
