import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { PatientModel } from "@/models/Patient";
import { DoctorModel } from "@/models/Doctor";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      role = "patient",
      profileImage,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      speciality,
      degree,
      visitFee,
      followUpFee,
      chamberAddress,
      chamberPhone,
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
      role: role || "patient",
      profileImage: profileImage || "",
      isActive: true,
    });

    if (role === "patient") {
      await PatientModel.create({
        userId: user._id,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
        gender: gender || "male",
        bloodGroup: bloodGroup || "O+",
        address: address || "",
        emergencyContact: emergencyContact || "",
      });
    }

    if (role === "doctor") {
      await DoctorModel.create({
        userId: user._id,
        speciality: speciality || "",
        degree: degree ? (Array.isArray(degree) ? degree : [degree]) : [],
        bio: body.bio || "",
        profileImage: profileImage || "",
        visitFee: visitFee || 0,
        followUpFee: followUpFee || 0,
        chamberAddress: chamberAddress || "",
        chamberPhone: chamberPhone || "",
        schedule: [],
        offDays: [],
        status: "available",
        isActive: true,
      });
    }

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
