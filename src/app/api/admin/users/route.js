import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

    const admin = await User.findById(adminId).select("_id role");
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const users = await User.find({})
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

