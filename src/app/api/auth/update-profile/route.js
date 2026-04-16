import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PATCH(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, name, email, currentPassword, newPassword } = body;

    
    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

   
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Current password is required to change password" },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 401 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: "New password must be at least 6 characters long" },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    
    if (email && email !== user.email) {
      // Strict case-sensitive email check
      const existingUser = await User.findOne({ email: { $regex: `^${email}$`, $options: '' } });
      if (existingUser) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        );
      }
      user.email = email;
    }

    // Update name if provided
    if (name && name !== user.name) {
      user.name = name;
    }

   
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

