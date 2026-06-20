import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { PatientModel } from "@/models/Patient";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      profileImage,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
    } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "patient",
      profileImage: profileImage || "",
      isActive: true,
    });

    await PatientModel.create({
      userId: user._id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      gender: gender || "male",
      bloodGroup: bloodGroup || "O+",
      address: address || "",
      emergencyContact: emergencyContact || "",
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 }
    );
  }
}
