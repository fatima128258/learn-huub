import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StudentPlaylistProgress from "@/models/StudentPlaylistProgress";
import Playlist from "@/models/Playlist";
import User from "@/models/User";


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

    // Verify instructor exists
    const instructor = await User.findById(instructorId).select("role").lean();
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Invalid instructor" },
        { status: 404 }
      );
    }

    
    const playlists = await Playlist.find({ 
      instructor: instructorId,
      deleted: { $ne: true }
    })
      .select("_id title description content")
      .lean();

    if (playlists.length === 0) {
      return NextResponse.json({
        success: true,
        submissions: [],
      });
    }

    const playlistIds = playlists.map((p) => p._id);

    // Get all progress records for these playlists
    const progressRecords = await StudentPlaylistProgress.find({
      playlist: { $in: playlistIds },
    })
      .populate("student", "name email username")
      .populate("playlist", "title description")
      .lean();

    
    const submissions = [];

    progressRecords.forEach((progress) => {
      const playlist = playlists.find(
        (p) => p._id.toString() === progress.playlist._id.toString()
      );

     
      const getContentItem = (order) => {
        return playlist.content?.find((item) => item.order === parseInt(order));
      };

  
      if (progress.labProgress && progress.labProgress instanceof Map) {
        progress.labProgress.forEach((labData, contentOrder) => {
          if (labData.completed && labData.uploadedFilePath) {
            const contentItem = getContentItem(contentOrder);
            submissions.push({
              id: `${progress._id}_lab_${contentOrder}`,
              type: "lab",
              student: {
                id: progress.student._id.toString(),
                name: progress.student.name || progress.student.username || progress.student.email,
                email: progress.student.email,
              },
              playlist: {
                id: playlist._id.toString(),
                title: playlist.title,
                description: playlist.description,
              },
              contentOrder: parseInt(contentOrder),
              submittedAt: labData.submittedAt,
              uploadedFilePath: labData.uploadedFilePath,
              grade: labData.grade || null,
              gradedAt: labData.gradedAt || null,
              feedback: labData.feedback || null,
              totalMarks: contentItem?.totalMarks || null,
            });
          }
        });
      } else if (progress.labProgress && typeof progress.labProgress === "object") {
        Object.keys(progress.labProgress).forEach((contentOrder) => {
          const labData = progress.labProgress[contentOrder];
          if (labData.completed && labData.uploadedFilePath) {
            const contentItem = getContentItem(contentOrder);
            submissions.push({
              id: `${progress._id}_lab_${contentOrder}`,
              type: "lab",
              student: {
                id: progress.student._id.toString(),
                name: progress.student.name || progress.student.username || progress.student.email,
                email: progress.student.email,
              },
              playlist: {
                id: playlist._id.toString(),
                title: playlist.title,
                description: playlist.description,
              },
              contentOrder: parseInt(contentOrder),
              submittedAt: labData.submittedAt,
              uploadedFilePath: labData.uploadedFilePath,
              grade: labData.grade || null,
              gradedAt: labData.gradedAt || null,
              feedback: labData.feedback || null,
              totalMarks: contentItem?.totalMarks || null,
            });
          }
        });
      }

      
      if (progress.activityProgress && progress.activityProgress instanceof Map) {
        progress.activityProgress.forEach((activityData, contentOrder) => {
          if (activityData.completed && activityData.uploadedFilePath) {
            const contentItem = getContentItem(contentOrder);
            submissions.push({
              id: `${progress._id}_activity_${contentOrder}`,
              type: "activity",
              student: {
                id: progress.student._id.toString(),
                name: progress.student.name || progress.student.username || progress.student.email,
                email: progress.student.email,
              },
              playlist: {
                id: playlist._id.toString(),
                title: playlist.title,
                description: playlist.description,
              },
              contentOrder: parseInt(contentOrder),
              submittedAt: activityData.submittedAt,
              uploadedFilePath: activityData.uploadedFilePath,
              grade: activityData.grade || null,
              gradedAt: activityData.gradedAt || null,
              feedback: activityData.feedback || null,
              totalMarks: contentItem?.totalMarks || null,
            });
          }
        });
      } else if (progress.activityProgress && typeof progress.activityProgress === "object") {
        Object.keys(progress.activityProgress).forEach((contentOrder) => {
          const activityData = progress.activityProgress[contentOrder];
          if (activityData.completed && activityData.uploadedFilePath) {
            const contentItem = getContentItem(contentOrder);
            submissions.push({
              id: `${progress._id}_activity_${contentOrder}`,
              type: "activity",
              student: {
                id: progress.student._id.toString(),
                name: progress.student.name || progress.student.username || progress.student.email,
                email: progress.student.email,
              },
              playlist: {
                id: playlist._id.toString(),
                title: playlist.title,
                description: playlist.description,
              },
              contentOrder: parseInt(contentOrder),
              submittedAt: activityData.submittedAt,
              uploadedFilePath: activityData.uploadedFilePath,
              grade: activityData.grade || null,
              gradedAt: activityData.gradedAt || null,
              feedback: activityData.feedback || null,
              totalMarks: contentItem?.totalMarks || null,
            });
          }
        });
      }
    });

    submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

