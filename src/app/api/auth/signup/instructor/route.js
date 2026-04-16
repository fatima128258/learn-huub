import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import InstructorCV from "@/models/InstructorCV";
import Account from "@/models/InstructorAccount";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const about = formData.get("about") || "";
    const experience = formData.get("experience") || "";
    const skills = formData.get("skills") || "";
    const education = formData.get("education") || "";
    const contact = formData.get("contact") || "";
    const address = formData.get("address") || "";
    const languages = formData.get("languages") || "";
    const accountNumber = formData.get("accountNumber");
    const bank = formData.get("bank");
    const imageFile = formData.get("image");

    if (!name || !email || !password || !accountNumber || !bank) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Strict case-sensitive email check
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

    const instructor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "instructor",
    });

  
    let profileImagePath = "";
    if (imageFile && imageFile instanceof File) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

     
      const uploadsDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

     
      const timestamp = Date.now();
      const extension = imageFile.name.split(".").pop();
      const filename = `${timestamp}.${extension}`;
      const filepath = join(uploadsDir, filename);

      // Save file
      await writeFile(filepath, buffer);
      profileImagePath = `/uploads/${filename}`;
    }

    //  Create Account
    await Account.create({
      user: instructor._id,
      userModel: "Instructor",
      accountNumber,
      bank,
    });

    // Create CV
    await InstructorCV.create({
      user: instructor._id,
      about,
      experience,
      skills,
      education,
      contact,
      address,
      languages,
      profileImage: profileImagePath,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Instructor created successfully",
        user: {
          id: instructor._id.toString(),
          name: instructor.name,
          email: instructor.email,
          role: instructor.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Instructor signup error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

