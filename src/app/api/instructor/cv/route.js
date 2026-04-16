import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import InstructorCV from "@/models/InstructorCV";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";


export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get("instructorId");

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

  
    const instructor = await User.findById(instructorId).select('_id name email role').lean();
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    
    const cv = await InstructorCV.findOne({ user: instructorId }).lean();

    return NextResponse.json({
      success: true,
      instructor: {
        _id: instructor._id.toString(),
        name: instructor.name || "",
        email: instructor.email || "",
      },
      cv: cv ? {
        _id: cv._id.toString(),
        about: cv.about || "",
        experience: cv.experience || "",
        skills: cv.skills || "",
        education: cv.education || "",
        contact: cv.contact || "",
        address: cv.address || "",
        languages: cv.languages || "",
        profileImage: cv.profileImage || "",
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
      } : null,
      message: cv ? "CV found" : "CV not found",
    });
  } catch (error) {
    console.error("Fetch instructor CV error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


export async function PUT(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const instructorId = formData.get("instructorId");
    const about = formData.get("about") || "";
    const experience = formData.get("experience") || "";
    const skills = formData.get("skills") || "";
    const education = formData.get("education") || "";
    const contact = formData.get("contact") || "";
    const address = formData.get("address") || "";
    const languages = formData.get("languages") || "";
    const imageFile = formData.get("image");

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    
    const instructor = await User.findById(instructorId).select('_id role').lean();
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

   
    let cv = await InstructorCV.findOne({ user: instructorId });

  
    let profileImagePath = cv?.profileImage || "";
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

   
    if (cv) {
      
      cv.about = about;
      cv.experience = experience;
      cv.skills = skills;
      cv.education = education;
      cv.contact = contact;
      cv.address = address;
      cv.languages = languages;
      if (profileImagePath) {
        cv.profileImage = profileImagePath;
      }
      await cv.save();
    } else {
     
      cv = await InstructorCV.create({
        user: instructorId,
        about,
        experience,
        skills,
        education,
        contact,
        address,
        languages,
        profileImage: profileImagePath,
      });
    }

    return NextResponse.json({
      success: true,
      message: "CV updated successfully",
      cv: {
        _id: cv._id,
        about: cv.about || "",
        experience: cv.experience || "",
        skills: cv.skills || "",
        education: cv.education || "",
        contact: cv.contact || "",
        address: cv.address || "",
        languages: cv.languages || "",
        profileImage: cv.profileImage || "",
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update instructor CV error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

