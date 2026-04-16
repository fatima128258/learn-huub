import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StudentPlaylistProgress from "@/models/StudentPlaylistProgress";
import User from "@/models/User";
import Playlist from "@/models/Playlist";


export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      instructorId,
      studentId,
      playlistId,
      contentOrder,
      type,
      grade,
      feedback,
    } = body;

   
    if (!instructorId || !studentId || !playlistId || contentOrder === undefined || !type) {
      return NextResponse.json(
        { message: "Instructor ID, Student ID, Playlist ID, content order, and type are required" },
        { status: 400 }
      );
    }

    if (grade === undefined || grade === null) {
      return NextResponse.json(
        { message: "Grade is required" },
        { status: 400 }
      );
    }

    if (grade < 0 || grade > 100) {
      return NextResponse.json(
        { message: "Grade must be between 0 and 100" },
        { status: 400 }
      );
    }

    
    const instructor = await User.findById(instructorId).select("role").lean();
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Invalid instructor" },
        { status: 404 }
      );
    }

   
    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    if (playlist.instructor.toString() !== instructorId) {
      return NextResponse.json(
        { message: "You don't have permission to grade submissions for this playlist" },
        { status: 403 }
      );
    }

   
    const student = await User.findById(studentId).select("role").lean();
    if (!student || student.role !== "student") {
      return NextResponse.json(
        { message: "Invalid student" },
        { status: 404 }
      );
    }

  
    const progress = await StudentPlaylistProgress.findOne({
      student: studentId,
      playlist: playlistId,
    });

    if (!progress) {
      return NextResponse.json(
        { message: "Progress record not found" },
        { status: 404 }
      );
    }

   
    const mapToObject = (map) => {
      const obj = {};
      if (map && map instanceof Map) {
        map.forEach((value, key) => {
          obj[key] = value;
        });
      } else if (map && typeof map === "object") {
        Object.assign(obj, map);
      }
      return obj;
    };

    
    if (type === "lab") {
      const labProgressObj = mapToObject(progress.labProgress);
      const contentOrderStr = contentOrder.toString();
      
      if (!labProgressObj[contentOrderStr] || !labProgressObj[contentOrderStr].completed) {
        return NextResponse.json(
          { message: "Lab submission not found or not completed" },
          { status: 404 }
        );
      }

      
      const labProgressMap = progress.labProgress || new Map();
      const existingLabData = labProgressObj[contentOrderStr] || {};
      
      labProgressMap.set(contentOrderStr, {
        contentOrder: parseInt(contentOrder),
        completed: existingLabData.completed || false,
        submittedAt: existingLabData.submittedAt ? new Date(existingLabData.submittedAt) : new Date(),
        uploadedFilePath: existingLabData.uploadedFilePath || null,
        grade: grade,
        gradedAt: new Date(),
        feedback: feedback || null,
      });

      progress.labProgress = labProgressMap;
    } else if (type === "activity") {
      const activityProgressObj = mapToObject(progress.activityProgress);
      const contentOrderStr = contentOrder.toString();
      
      if (!activityProgressObj[contentOrderStr] || !activityProgressObj[contentOrderStr].completed) {
        return NextResponse.json(
          { message: "Activity submission not found or not completed" },
          { status: 404 }
        );
      }

     
      const activityProgressMap = progress.activityProgress || new Map();
      const existingActivityData = activityProgressObj[contentOrderStr] || {};
      
      activityProgressMap.set(contentOrderStr, {
        contentOrder: parseInt(contentOrder),
        completed: existingActivityData.completed || false,
        submittedAt: existingActivityData.submittedAt ? new Date(existingActivityData.submittedAt) : new Date(),
        uploadedFilePath: existingActivityData.uploadedFilePath || null,
        grade: grade,
        gradedAt: new Date(),
        feedback: feedback || null,
      });

      progress.activityProgress = activityProgressMap;
    } else {
      return NextResponse.json(
        { message: "Invalid type. Must be 'lab' or 'activity'" },
        { status: 400 }
      );
    }

    await progress.save();

   
    const updatedProgressObj = type === "lab" 
      ? mapToObject(progress.labProgress)
      : mapToObject(progress.activityProgress);

    return NextResponse.json({
      success: true,
      message: "Submission graded successfully",
      progress: updatedProgressObj,
    });
  } catch (error) {
    console.error("Grade submission error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

