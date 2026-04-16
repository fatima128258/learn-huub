import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    await connectDB();

  
    await User.deleteMany({ role: "admin" });

   
    const hashedPassword = await bcrypt.hash("Admin123", 10);
    const admin = await User.create({
      name: "Admin User",
      email: "Admin@learnhub.com",
      password: hashedPassword,
      role: "admin",
    });

    return NextResponse.json({
      success: true,
      message: "Admin user fixed successfully",
      admin: {
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Fix admin error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
