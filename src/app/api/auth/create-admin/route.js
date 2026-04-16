import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    await connectDB();

    const adminEmail = "Admin@learnhub.com";
    const adminPassword = "Admin123";
    const adminName = "Admin User";

   
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        user: {
          id: adminExists._id.toString(),
          email: adminExists.email,
          role: adminExists.role,
        },
      });
    }

    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);


    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      bankAccountNumber: "123456789019",
      bankName: "Mezan",
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      },
      credentials: {
        email: adminEmail,
        password: adminPassword,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

