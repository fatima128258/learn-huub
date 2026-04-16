import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Case-insensitive email check
    const existingUser = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    
    if (existingUser) {
      const roleLabel =
        existingUser.role === "student"
          ? "Student"
          : existingUser.role === "instructor"
          ? "Instructor"
          : "Admin";
      return NextResponse.json(
        { message: `Email is already registered as ${roleLabel}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Email is available" });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
