import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DoctorModel from "@/models/Doctor";

export async function GET(
  _request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    await connectDB();

    const doctor = await DoctorModel.findById(params.doctorId).populate(
      "userId",
      "name email phone profileImage isActive"
    );

    if (!doctor || !doctor.isActive) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error("Get doctor error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor" },
      { status: 500 }
    );
  }
}
