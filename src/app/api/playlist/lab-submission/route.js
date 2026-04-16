import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StudentPlaylistProgress from "@/models/StudentPlaylistProgress";
import User from "@/models/User";
import Playlist from "@/models/Playlist";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// POST - Submit lab file for a student
export async function POST(request) {
  try {
    await connectDB();

    // Parse FormData
    const formData = await request.formData();

    const studentId = formData.get("studentId");
    const playlistId = formData.get("playlistId");
    const contentOrder = parseInt(formData.get("contentOrder"));
    const file = formData.get("file");

    // Validation
    if (!studentId || !playlistId || contentOrder === null || contentOrder === undefined || !file) {
      return NextResponse.json(
        { message: "Student ID, Playlist ID, content order, and file are required" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await User.findById(studentId).select("role").lean();
    if (!student || student.role !== "student") {
      return NextResponse.json(
        { message: "Invalid student" },
        { status: 404 }
      );
    }

    // Verify playlist exists
    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    // Verify that the content at this order is a lab
    const contentItem = playlist.content?.find(item => item.order === contentOrder);
    if (!contentItem || contentItem.type !== "lab") {
      return NextResponse.json(
        { message: "Content at this order is not a lab" },
        { status: 400 }
      );
    }

    // Create student submissions directory if it doesn't exist
    const baseUploadsDir = join(process.cwd(), "public", "uploads");
    const studentSubmissionsDir = join(baseUploadsDir, "student-submissions", playlistId.toString(), studentId.toString());
    
    if (!existsSync(studentSubmissionsDir)) {
      await mkdir(studentSubmissionsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `${contentOrder}_${timestamp}_${random}.${extension}`;
    const filepath = join(studentSubmissionsDir, filename);
    const uploadPath = `/uploads/student-submissions/${playlistId}/${studentId}/${filename}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Get or create progress
    let progress = await StudentPlaylistProgress.findOne({
      student: studentId,
      playlist: playlistId,
    });

    if (!progress) {
      progress = await StudentPlaylistProgress.create({
        student: studentId,
        playlist: playlistId,
        videoProgress: new Map(),
        activityProgress: new Map(),
        labProgress: new Map(),
        quizProgress: new Map(),
        overallProgress: 0,
        completed: false,
        lastAccessedAt: new Date(),
      });
    }

    // Update lab progress
    const labProgressMap = progress.labProgress || new Map();
    labProgressMap.set(contentOrder.toString(), {
      contentOrder: contentOrder,
      completed: true,
      submittedAt: new Date(),
      uploadedFilePath: uploadPath,
    });

    progress.labProgress = labProgressMap;
    await progress.save();

    // Convert Map to object for response
    const labProgressObj = {};
    labProgressMap.forEach((value, key) => {
      labProgressObj[key] = {
        contentOrder: value.contentOrder,
        completed: value.completed,
        submittedAt: value.submittedAt,
        uploadedFilePath: value.uploadedFilePath,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Lab submitted successfully",
      labProgress: labProgressObj,
    });
  } catch (error) {
    console.error("Lab submission error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

