import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";

export const dynamic = "force-dynamic";

const MONTHS_BN = [
  "জানুয়ারী", "ফেব্রুয়ারী", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগাস্ত", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Stats
    const [totalDoctors, totalPatients, todayAppointments, todayPayments] =
      await Promise.all([
        Doctor.countDocuments({ isActive: true }),
        Patient.countDocuments(),
        Appointment.countDocuments({
          appointmentDate: { $gte: today, $lt: tomorrow },
          status: { $ne: "cancelled" },
        }),
        Payment.aggregate([
          {
            $match: {
              status: "paid",
              createdAt: { $gte: today, $lt: tomorrow },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    const todayIncome = todayPayments[0]?.total || 0;

    // Monthly income for current year
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    const monthlyRaw = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: yearStart, $lt: yearEnd },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          income: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthMap = new Map<number, number>();
    monthlyRaw.forEach((m: { _id: number; income: number }) => monthMap.set(m._id, m.income));
    const monthlyIncome = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS_BN[i],
      income: monthMap.get(i + 1) || 0,
    }));

    // Active doctors with today's stats
    const activeDoctors = await Doctor.aggregate([
      { $match: { isActive: true } },
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
        $lookup: {
          from: "appointments",
          let: { docId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$doctorId", "$$docId"] },
                appointmentDate: { $gte: today, $lt: tomorrow },
                status: { $ne: "cancelled" },
              },
            },
            { $count: "count" },
          ],
          as: "todayPatientsArr",
        },
      },
      {
        $lookup: {
          from: "payments",
          let: { docId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$doctorId", "$$docId"] },
                status: "paid",
                createdAt: { $gte: today, $lt: tomorrow },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          as: "todayIncomeArr",
        },
      },
      {
        $project: {
          _id: 1,
          doctorName: "$user.name",
          speciality: 1,
          status: 1,
          todayPatients: {
            $ifNull: [{ $arrayElemAt: ["$todayPatientsArr.count", 0] }, 0],
          },
          todayIncome: {
            $ifNull: [{ $arrayElemAt: ["$todayIncomeArr.total", 0] }, 0],
          },
        },
      },
      { $sort: { doctorName: 1 } },
    ]);

    // Recent appointments (last 10 across all doctors)
    const recentAppointments = await Appointment.find({})
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .populate({ path: "patientId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalDoctors,
          totalPatients,
          todayAppointments,
          todayIncome,
        },
        monthlyIncome,
        activeDoctors,
        recentAppointments,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json(
      { success: false, error: "ড্যাশবোর্ড লোড করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
