import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
 
    await connectDB();

    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { message: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: { $regex: `^${email}$`, $options: '' } });
    if (!user) {
      return NextResponse.json(
        { message: "User with this email does not exist" },
        { status: 404 }
      );
    }

    // Block admin from using forget password
    if (user.role === "admin") {
      return NextResponse.json(
        { message: "Admin cannot reset password using forget password. Please use admin panel settings." },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Forget password error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

