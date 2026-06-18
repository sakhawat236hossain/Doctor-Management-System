import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const appointmentId = searchParams.get("appointmentId");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (appointmentId) filter.appointmentId = appointmentId;

    const payments = await Payment.find(filter)
      .populate({
        path: "appointmentId",
        populate: [
          { path: "doctorId", populate: { path: "userId", select: "name" } },
          { path: "patientId", populate: { path: "userId", select: "name" } },
        ],
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
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
    const { appointmentId, amount, method, status } = body;

    if (!appointmentId || !amount || !method) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const payment = await Payment.create({
      appointmentId,
      amount,
      method,
      status: status || "due",
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create payment" }, { status: 500 });
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
    const { id, status, method, amount } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Payment ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (method) updateData.method = method;
    if (amount !== undefined) updateData.amount = amount;

    const payment = await Payment.findByIdAndUpdate(id, updateData, { new: true });

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update payment" }, { status: 500 });
  }
}
