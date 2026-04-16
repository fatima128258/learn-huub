import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Playlist from "@/models/Playlist";
import User from "@/models/User";
import fs from "fs";
import { join } from "path";


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

    
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    
    const playlists = await Playlist.find({
      instructor: instructorId,
      status: "approved",
      deleted: { $ne: true }
    })
      .populate("instructor", "name email")
      .select("title description videos content instructor status createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();


    const Purchase = (await import("@/models/Purchase")).default;

    const playlistIds = playlists.map(p => p._id);
    const viewerCounts = await Purchase.aggregate([
      {
        $match: {
          playlist: { $in: playlistIds },
          status: { $in: ["active", "lifetime"] }
        }
      },
      {
        $group: {
          _id: "$playlist",
          totalViewers: { $sum: 1 }
        }
      }
    ]);

    
    const viewerCountMap = new Map();
    viewerCounts.forEach(item => {
      viewerCountMap.set(item._id.toString(), item.totalViewers);
    });

    return NextResponse.json({
      success: true,
      playlists: playlists.map((playlist) => ({
        _id: playlist._id.toString(),
        title: playlist.title || "",
        description: playlist.description || "",
        videos: playlist.videos || [],
        content: playlist.content || [],
        instructor: {
          _id: playlist.instructor._id.toString(),
          name: playlist.instructor.name || "Unknown",
          email: playlist.instructor.email || "",
        },
        status: playlist.status || "approved",
        totalViewers: viewerCountMap.get(playlist._id.toString()) || 0,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch instructor playlists error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("playlistId");
    const instructorId = searchParams.get("instructorId");

    if (!playlistId || !instructorId) {
      return NextResponse.json(
        { message: "Playlist ID and Instructor ID are required" },
        { status: 400 }
      );
    }

    
    const playlist = await Playlist.findOne({
      _id: playlistId,
      instructor: instructorId,
    });

    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found or unauthorized" },
        { status: 404 }
      );
    }

   
    playlist.deleted = true;

   
    if (playlist.thumbnail) {
      try {
        const filePath = join(process.cwd(), playlist.thumbnail);
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("File delete warning:", err.message);
      }
    }

    await playlist.save();

    return NextResponse.json({
      success: true,
      message: "Playlist deleted successfully",
    });

  } catch (error) {
    console.error("Delete playlist error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}