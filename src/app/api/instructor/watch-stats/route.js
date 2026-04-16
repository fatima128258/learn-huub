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
    const monthOffset = parseInt(searchParams.get("monthOffset") || "0");

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Unauthorized: Instructor access required" },
        { status: 403 }
      );
    }

   
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + monthOffset; // Apply offset
    
    // Calculate the target month and year
    const targetDate = new Date(year, month, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Get all days in the target month
    const daysInMonth = endOfMonth.getDate();
    const dailyStats = {};

    // Initialize all days with 0
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth, day);
      const dateKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyStats[dateKey] = {
        date: date,
        label: `${day}`,
        studentIds: new Set(), 
      };
    }

  
    const instructorPlaylists = await Playlist.find({
      instructor: instructorId,
      deleted: { $ne: true }
    }).select("_id");

    const playlistIds = instructorPlaylists.map((p) => p._id);

    if (playlistIds.length === 0) {
      // No playlists, return empty data
      const chartData = Object.values(dailyStats).map((item) => ({
        label: item.label,
        value: 0,
      }));

      return NextResponse.json({
        success: true,
        data: chartData,
        monthName: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      });
    }

    
    const progressRecords = await StudentPlaylistProgress.find({
      playlist: { $in: playlistIds },
      lastAccessedAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    })
      .select("student lastAccessedAt videoProgress")
      .populate("student", "_id");

    // Count unique students per day who have watched at least one video
    progressRecords.forEach((progress) => {
     
      const videoProgressMap = progress.videoProgress || new Map();
      const hasWatched = Array.from(videoProgressMap.values()).some(
        (video) => video.watched === true || (video.maxProgress || video.progress || 0) >= 40
      );

      if (hasWatched && progress.lastAccessedAt) {
        const accessedAt = new Date(progress.lastAccessedAt);
        const dateKey = `${accessedAt.getFullYear()}-${String(accessedAt.getMonth() + 1).padStart(2, '0')}-${String(accessedAt.getDate()).padStart(2, '0')}`;
        
        if (dailyStats[dateKey]) {
          if (progress.student && progress.student._id) {
            dailyStats[dateKey].studentIds.add(progress.student._id.toString());
          }
        }
      }
    });

    // Convert to array format with unique student counts
    const chartData = Object.values(dailyStats).map((item) => ({
      label: item.label,
      value: item.studentIds.size,
    }));

    return NextResponse.json({
      success: true,
      data: chartData,
      monthName: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
    });
  } catch (error) {
    console.error("Fetch watch stats error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

