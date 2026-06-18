import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AppointmentModel from "@/models/Appointment";
import PaymentModel from "@/models/Payment";
import PatientModel from "@/models/Patient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "doctorId required" }, { status: 400 });
    }

    const dateFilter: Record<string, Date> = {};
    if (startDate) {
      const d = new Date(startDate);
      d.setHours(0, 0, 0, 0);
      dateFilter.$gte = d;
    }
    if (endDate) {
      const d = new Date(endDate);
      d.setHours(23, 59, 59, 999);
      dateFilter.$lte = d;
    }

    // Find patient IDs for this doctor
    const patientIds = await AppointmentModel.distinct("patientId", {
      doctorId,
      ...(Object.keys(dateFilter).length > 0 ? { appointmentDate: dateFilter } : {}),
    });

    // Get appointments in range
    const aptFilter: Record<string, unknown> = { doctorId };
    if (Object.keys(dateFilter).length > 0) {
      aptFilter.appointmentDate = dateFilter;
    }

    const appointments = await AppointmentModel.find(aptFilter)
      .populate({ path: "patientId", populate: { path: "userId", select: "name phone" } })
      .sort({ appointmentDate: 1, serialNumber: 1 });

    // Get payments for these appointments
    const aptIds = appointments.map((a) => a._id);
    const payments = await PaymentModel.find({ appointmentId: { $in: aptIds } });
    const paymentMap = new Map<string, { amount: number; status: string; method: string }>();
    for (const p of payments) {
      paymentMap.set(p.appointmentId.toString(), {
        amount: p.amount,
        status: p.status,
        method: p.method,
      });
    }

    // Build daily breakdown
    const dailyMap = new Map<string, {
      date: string;
      patients: number;
      newCount: number;
      followUpCount: number;
      income: number;
      collected: number;
    }>();

    for (const apt of appointments) {
      if (apt.status === "cancelled" || apt.status === "no-show") continue;

      const dateKey = new Date(apt.appointmentDate).toISOString().split("T")[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          patients: 0,
          newCount: 0,
          followUpCount: 0,
          income: 0,
          collected: 0,
        });
      }
      const day = dailyMap.get(dateKey)!;
      day.patients += 1;
      if (apt.type === "new") day.newCount += 1;
      else day.followUpCount += 1;

      const pay = paymentMap.get(apt._id.toString());
      if (pay) {
        day.income += pay.amount;
        if (pay.status === "paid") day.collected += pay.amount;
      }
    }

    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Summary
    let totalIncome = 0;
    let totalPaid = 0;
    let totalDue = 0;
    for (const pay of payments) {
      totalIncome += pay.amount;
      if (pay.status === "paid") totalPaid += pay.amount;
      else if (pay.status === "due") totalDue += pay.amount;
    }

    const summary = {
      total: totalIncome,
      paid: totalPaid,
      due: totalDue,
      patients: patientIds.length,
    };

    // CSV export
    if (format === "csv") {
      const headers = ["Date", "Patients", "New", "Follow-up", "Income", "Collected"];
      const rows = daily.map((d) => [d.date, d.patients, d.newCount, d.followUpCount, d.income, d.collected].join(","));
      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="doctor-report-${doctorId}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { summary, daily } });
  } catch (error) {
    console.error("Doctor report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
