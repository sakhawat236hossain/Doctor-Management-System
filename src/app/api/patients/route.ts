import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Patient from "@/models/Patient";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender");
    const bloodGroup = searchParams.get("bloodGroup");

    const filter: Record<string, unknown> = {};
    if (gender) filter.gender = gender;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const patients = await Patient.find(filter).populate("userId", "name email phone isActive");

    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch patients" }, { status: 500 });
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
    const { name, email, password, phone, dateOfBirth, gender, bloodGroup } = body;

    if (!name || !email || !password || !phone || !dateOfBirth || !gender || !bloodGroup) {
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
      role: "patient",
      isActive: true,
    });

    const patient = await Patient.create({
      userId: user._id,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      bloodGroup,
    });

    const populated = await Patient.findById(patient._id).populate("userId", "name email phone");

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json({ success: false, error: "Failed to create patient" }, { status: 500 });
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
    const { id, dateOfBirth, gender, bloodGroup } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Patient ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (bloodGroup) updateData.bloodGroup = bloodGroup;

    const patient = await Patient.findByIdAndUpdate(id, updateData, { new: true }).populate(
      "userId",
      "name email phone"
    );

    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error("Update patient error:", error);
    return NextResponse.json({ success: false, error: "Failed to update patient" }, { status: 500 });
  }
}
