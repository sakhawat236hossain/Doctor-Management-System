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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Aggregation: Appointment → Payment lookup, group by doctor
    const doctorWiseData = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "doctor.userId",
          foreignField: "_id",
          as: "doctorUser",
        },
      },
      { $unwind: { path: "$doctorUser", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$doctorId",
          doctorName: { $first: "$doctorUser.name" },
          speciality: { $first: "$doctor.speciality" },
          totalPatients: { $addToSet: "$patientId" },
          totalIncome: { $sum: "$amount" },
          collected: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
          },
          due: {
            $sum: { $cond: [{ $eq: ["$status", "due"] }, "$amount", 0] },
          },
        },
      },
      {
        $project: {
          _id: 1,
          doctorName: { $ifNull: ["$doctorName", "অজানা"] },
          speciality: { $ifNull: ["$speciality", ""] },
          patientCount: { $size: "$totalPatients" },
          totalIncome: 1,
          collected: 1,
          due: 1,
        },
      },
      { $sort: { totalIncome: -1 } },
    ]);

    // Daily totals
    const dailyData = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalIncome: { $sum: "$amount" },
          collected: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
          },
          due: {
            $sum: { $cond: [{ $eq: ["$status", "due"] }, "$amount", 0] },
          },
          patientCount: { $addToSet: "$patientId" },
        },
      },
      {
        $project: {
          _id: 1,
          totalIncome: 1,
          collected: 1,
          due: 1,
          patientCount: { $size: "$patientCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Grand totals
    const grandTotal = doctorWiseData.reduce(
      (acc, d) => ({
        totalIncome: acc.totalIncome + d.totalIncome,
        collected: acc.collected + d.collected,
        due: acc.due + d.due,
        patients: acc.patients + d.patientCount,
      }),
      { totalIncome: 0, collected: 0, due: 0, patients: 0 }
    );

    // CSV export
    if (format === "csv") {
      const header = "ডাক্তার,বিশেষজ্ঞতা,রোগী সংখ্যা,মোট আয়,সংগৃহীত,বাকি\n";
      const rows = doctorWiseData
        .map(
          (d) =>
            `${d.doctorName},${d.speciality},${d.patientCount},${d.totalIncome},${d.collected},${d.due}`
        )
        .join("\n");

      const csvContent = "\uFEFF" + header + rows; // BOM for Bengali
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="admin-report-${start.toISOString().split("T")[0]}-to-${end.toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        doctorWise: doctorWiseData,
        daily: dailyData,
        grandTotal,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
      },
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { success: false, error: "রিপোর্ট তৈরি করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
