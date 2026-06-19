import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET: all doctors with today's stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const speciality = searchParams.get("speciality") || "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const matchStage: Record<string, unknown> = {};
    if (search) {
      matchStage["user.name"] = { $regex: search, $options: "i" };
    }
    if (speciality) {
      matchStage["speciality"] = speciality;
    }

    const doctors = await Doctor.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
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
          as: "todayPatients",
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
          as: "todayIncome",
        },
      },
      {
        $project: {
          _id: 1,
          speciality: 1,
          degree: 1,
          visitFee: 1,
          followUpFee: 1,
          status: 1,
          isActive: 1,
          schedule: 1,
          chamberAddress: 1,
          chamberPhone: 1,
          bio: 1,
          profileImage: 1,
          createdAt: 1,
          "user._id": 1,
          "user.name": 1,
          "user.email": 1,
          "user.phone": 1,
          "user.isActive": 1,
          todayPatientCount: {
            $ifNull: [{ $arrayElemAt: ["$todayPatients.count", 0] }, 0],
          },
          todayIncomeTotal: {
            $ifNull: [{ $arrayElemAt: ["$todayIncome.total", 0] }, 0],
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // Get unique specialities for filter
    const specialities = await Doctor.distinct("speciality");

    return NextResponse.json({
      success: true,
      data: { doctors, specialities },
    });
  } catch (error) {
    console.error("Admin doctors GET error:", error);
    return NextResponse.json(
      { success: false, error: "ডাক্তারদের তথ্য লোড করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}

// POST: create User (role: doctor) + Doctor profile atomically
const createDoctorSchema = z.object({
  name: z.string().min(1, "নাম প্রয়োজন"),
  email: z.string().email("সঠিক ইমেইল দিন"),
  phone: z.string().min(1, "ফোন নম্বর প্রয়োজন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর"),
  speciality: z.string().min(1, "বিশেষজ্ঞতা প্রয়োজন"),
  degree: z.array(z.string()).min(1, "কমপক্ষে একটি ডিগ্রি দিন"),
  visitFee: z.number().min(0),
  followUpFee: z.number().min(0),
  chamberAddress: z.string().optional(),
  chamberPhone: z.string().optional(),
  bio: z.string().optional(),
  schedule: z
    .array(
      z.object({
        day: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        maxPatients: z.number().min(1),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parsed = createDoctorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "ভুল তথ্য" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "এই ইমেইল আগে থেকে ব্যবহৃত" },
        { status: 409 }
      );
    }

    // Create user + doctor atomically
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: hashedPassword,
      role: "doctor",
    });

    const doctor = await Doctor.create({
      userId: user._id,
      speciality: data.speciality,
      degree: data.degree,
      bio: data.bio || "",
      visitFee: data.visitFee,
      followUpFee: data.followUpFee,
      chamberAddress: data.chamberAddress || "",
      chamberPhone: data.chamberPhone || "",
      schedule: data.schedule || [],
    });

    return NextResponse.json(
      { success: true, data: { user: { ...user.toObject(), password: undefined }, doctor }, message: "ডাক্তার সফলভাবে যোগ হয়েছে" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin doctors POST error:", error);
    return NextResponse.json(
      { success: false, error: "ডাক্তার যোগ করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}

// PATCH: update doctor isActive / profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { doctorId, userId, isActive, ...updateData } = body;

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "ডাক্তার আইডি প্রয়োজন" }, { status: 400 });
    }

    if (userId && updateData.name) {
      await User.findByIdAndUpdate(userId, {
        name: updateData.name,
        phone: updateData.phone,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    }

    const doctorUpdate: Record<string, unknown> = {};
    if (updateData.speciality) doctorUpdate.speciality = updateData.speciality;
    if (updateData.degree) doctorUpdate.degree = updateData.degree;
    if (updateData.visitFee !== undefined) doctorUpdate.visitFee = updateData.visitFee;
    if (updateData.followUpFee !== undefined) doctorUpdate.followUpFee = updateData.followUpFee;
    if (updateData.schedule) doctorUpdate.schedule = updateData.schedule;
    if (updateData.chamberAddress !== undefined) doctorUpdate.chamberAddress = updateData.chamberAddress;
    if (updateData.chamberPhone !== undefined) doctorUpdate.chamberPhone = updateData.chamberPhone;
    if (updateData.bio !== undefined) doctorUpdate.bio = updateData.bio;
    if (isActive !== undefined) doctorUpdate.isActive = isActive;

    await Doctor.findByIdAndUpdate(doctorId, doctorUpdate);

    return NextResponse.json({
      success: true,
      message: isActive === false ? "ডাক্তার নিষ্ক্রিয় করা হয়েছে" : "ডাক্তার আপডেট হয়েছে",
    });
  } catch (error) {
    console.error("Admin doctors PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "আপডেট করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
