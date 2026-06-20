import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { DoctorModel } from "@/models/Doctor";

export const dynamic = "force-dynamic";

// GET: List all users with pagination, search, filters
export async function GET(request: NextRequest) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const provider = searchParams.get("provider") || "";
  const sort = searchParams.get("sort") || "newest";

  const skip = (page - 1) * limit;

  // Build query
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  if (role) {
    query.role = role;
  }

  if (status === "active") {
    query.isActive = true;
  } else if (status === "inactive") {
    query.isActive = false;
  }

  if (provider) {
    query.authProviders = provider;
  }

  // Sort
  let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "oldest") sortObj = { createdAt: 1 };
  if (sort === "name") sortObj = { name: 1 };

  // Get total count
  const total = await UserModel.countDocuments(query);

  // Get users
  const users = await UserModel.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .select("+password") // need password field to check if credentials login is available
    .lean();

  // Get doctor summaries for users who are doctors
  const doctorIds = users.filter((u) => u.role === "doctor").map((u) => u._id);
  let doctorsMap: Record<string, { speciality: string; status: string }> = {};

  if (doctorIds.length > 0) {
    const doctors = await DoctorModel.find({ userId: { $in: doctorIds } })
      .select("userId speciality status")
      .lean();
    for (const doc of doctors) {
      doctorsMap[doc.userId.toString()] = {
        speciality: doc.speciality,
        status: doc.status,
      };
    }
  }

  // Format response
  const formattedUsers = users.map((u) => {
    const hasPassword = !!u.password && u.password.length > 0;
    const providers = u.authProviders || (hasPassword ? ["credentials"] : []);

    return {
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      isActive: u.isActive,
      profileImage: u.profileImage || "",
      authProviders: providers,
      createdAt: u.createdAt,
      doctorInfo: u.role === "doctor" ? doctorsMap[u._id.toString()] || null : null,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
