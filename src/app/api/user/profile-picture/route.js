import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// POST - Upload profile picture
export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const userId = formData.get("userId");
    const imageFile = formData.get("image");

    if (!userId || !imageFile) {
      return NextResponse.json(
        { message: "User ID and image file are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Validate file type (only images)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { message: "Only image files (JPEG, PNG, GIF, WebP) are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { message: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Handle file upload
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = imageFile.name.split(".").pop();
    const filename = `profile_${userId}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);
    const profilePicturePath = `/uploads/${filename}`;

    // Update user profile picture
    user.profilePicture = profilePicturePath;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile picture uploaded successfully",
      profilePicture: profilePicturePath,
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

