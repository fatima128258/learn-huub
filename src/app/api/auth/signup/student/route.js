import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    
    
    const existingUser = await User.findOne({ email: { $regex: `^${email}$`, $options: '' } });
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

  
    const hashedPassword = await bcrypt.hash(password, 10);

 
    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Student account created successfully",
        user: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          role: student.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Student signup error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

