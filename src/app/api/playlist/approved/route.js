import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Playlist from "@/models/Playlist";
import { cacheHelper } from "@/lib/cacheHelper";
import { CACHE_TTL } from "@/lib/redis";

// GET - Fetch approved playlists (with caching)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = `${cacheHelper.keys.approvedPlaylists()}:page:${page}:limit:${limit}`;
    
    // Try to get from cache
    let cachedData = await cacheHelper.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        ...cachedData,
        cached: true
      });
    }

    // Query from database with optimizations
    const [playlists, total] = await Promise.all([
      Playlist.find({ 
        status: 'approved',
        deleted: { $ne: true },
        isLatestVersion: true
      })
        .select('title description price instructor createdAt') // Projection - only needed fields
        .populate('instructor', 'name email') // Only needed instructor fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Convert to plain JavaScript objects for better performance
      Playlist.countDocuments({ 
        status: 'approved',
        deleted: { $ne: true },
        isLatestVersion: true
      })
    ]);

    // Get viewer counts
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

    const result = {
      playlists: playlists.map(playlist => ({
        ...playlist,
        totalViewers: viewerCountMap.get(playlist._id.toString()) || 0
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache the results
    await cacheHelper.set(cacheKey, result, CACHE_TTL.APPROVED_PLAYLISTS);

    return NextResponse.json({
      success: true,
      ...result,
      cached: false
    });
  } catch (error) {
    console.error("Fetch approved playlists error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
