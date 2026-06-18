import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    if (type === "overview") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        totalPatients,
        totalDoctors,
        todayAppointments,
        pendingPayments,
        recentAppointments,
      ] = await Promise.all([
        Patient.countDocuments(),
        Doctor.countDocuments(),
        Appointment.countDocuments({
          appointmentDate: { $gte: today, $lt: tomorrow },
          status: { $ne: "cancelled" },
        }),
        Payment.countDocuments({ status: "due" }),
        Appointment.find({
          appointmentDate: { $gte: today, $lt: tomorrow },
        })
          .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
          .populate({ path: "patientId", populate: { path: "userId", select: "name" } })
          .sort({ serialNumber: 1 })
          .limit(10),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalPatients,
            totalDoctors,
            todayAppointments,
            pendingPayments,
          },
          recentAppointments,
        },
      });
    }

    if (type === "appointments") {
      const filter: Record<string, unknown> = {};
      if (Object.keys(dateFilter).length > 0) {
        filter.appointmentDate = dateFilter;
      }

      const appointments = await Appointment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
            },
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return NextResponse.json({ success: true, data: appointments });
    }

    if (type === "revenue") {
      const filter: Record<string, unknown> = { status: "paid" };
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }

      const revenue = await Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const totalRevenue = await Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      return NextResponse.json({
        success: true,
        data: {
          daily: revenue,
          total: totalRevenue[0]?.total || 0,
        },
      });
    }

    if (type === "doctors") {
      const doctors = await Doctor.aggregate([
        {
          $lookup: {
            from: "appointments",
            localField: "_id",
            foreignField: "doctorId",
            as: "appointments",
          },
        },
        {
          $project: {
            speciality: 1,
            appointmentCount: { $size: "$appointments" },
            completedCount: {
              $size: {
                $filter: {
                  input: "$appointments",
                  as: "a",
                  cond: { $eq: ["$$a.status", "completed"] },
                },
              },
            },
          },
        },
        { $sort: { appointmentCount: -1 } },
      ]);

      return NextResponse.json({ success: true, data: doctors });
    }

    if (type === "users") {
      const users = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);

      return NextResponse.json({ success: true, data: users });
    }

    return NextResponse.json({ success: false, error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
