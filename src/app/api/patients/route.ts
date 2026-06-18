import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PatientModel from "@/models/Patient";
import UserModel from "@/models/User";

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
    const phone = searchParams.get("phone");
    const search = searchParams.get("search");

    // Phone-based search for receptionist quick book
    if (phone) {
      const matchingUsers = await UserModel.find({ phone: { $regex: phone, $options: "i" }, role: "patient" })
        .select("name email phone isActive");
      if (matchingUsers.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      const userIds = matchingUsers.map((u) => u._id);
      const patients = await PatientModel.find({ userId: { $in: userIds } })
        .populate("userId", "name email phone isActive");
      return NextResponse.json({ success: true, data: patients });
    }

    // Name/phone combined search
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const matchingUsers = await UserModel.find(
        { $or: [{ name: searchRegex }, { phone: searchRegex }], role: "patient" }
      ).select("_id");
      if (matchingUsers.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      const userIds = matchingUsers.map((u) => u._id);
      const patients = await PatientModel.find({ userId: { $in: userIds } })
        .populate("userId", "name email phone isActive");
      return NextResponse.json({ success: true, data: patients });
    }

    const filter: Record<string, unknown> = {};
    if (gender) filter.gender = gender;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const patients = await PatientModel.find(filter).populate("userId", "name email phone isActive");

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
      role: "patient",
      isActive: true,
    });

    const patient = await PatientModel.create({
      userId: user._id,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      bloodGroup,
    });

    const populated = await PatientModel.findById(patient._id).populate("userId", "name email phone");

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

    const patient = await PatientModel.findByIdAndUpdate(id, updateData, { new: true }).populate(
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
