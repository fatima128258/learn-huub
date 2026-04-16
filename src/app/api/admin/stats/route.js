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

    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Get counts (exclude admins from total users)
    const instructors = await User.countDocuments({ role: "instructor" });
    const students = await User.countDocuments({ role: "student" });
    const admins = await User.countDocuments({ role: "admin" });
    const totalUsers = instructors + students; // Total users without admins

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        instructors,
        students,
        admins,
      },
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

