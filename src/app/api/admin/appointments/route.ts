import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: Record<string, unknown> = {};
    if (doctorId && doctorId !== "all") filter.doctorId = doctorId;
    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.appointmentDate = dateFilter;
    }

    const appointments = await Appointment.find(filter)
      .populate({
        path: "doctorId",
        select: "speciality visitFee followUpFee chamberAddress userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate({
        path: "patientId",
        select: "gender bloodGroup dateOfBirth userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .sort({ appointmentDate: -1, serialNumber: 1 })
      .limit(200)
      .lean();

    // Get payments for these appointments
    const appointmentIds = appointments.map((a: { _id: unknown }) => a._id);
    const payments = await Payment.find({ appointmentId: { $in: appointmentIds } })
      .select("appointmentId amount status method")
      .lean();

    const paymentMap = new Map<string, { amount: number; status: string; method: string }>();
    payments.forEach((p: { appointmentId: { toString(): string }; amount: number; status: string; method: string }) => {
      paymentMap.set(p.appointmentId.toString(), {
        amount: p.amount,
        status: p.status,
        method: p.method,
      });
    });

    const result = appointments.map((a: Record<string, unknown>) => ({
      ...a,
      payment: paymentMap.get((a._id as { toString(): string }).toString()) || null,
    }));

    // Get all doctors for filter dropdown
    const allDoctors = await Doctor.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          name: "$user.name",
        },
      },
      { $sort: { name: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        appointments: result,
        doctors: allDoctors,
      },
    });
  } catch (error) {
    console.error("Admin appointments error:", error);
    return NextResponse.json(
      { success: false, error: "অ্যাপয়েন্টমেন্ট লোড করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
