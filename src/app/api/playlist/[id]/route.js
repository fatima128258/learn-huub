import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Playlist from "@/models/Playlist";
import { cacheHelper } from "@/lib/cacheHelper";
import { CACHE_TTL } from "@/lib/redis";

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Playlist ID is required" },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = cacheHelper.keys.playlistDetails(id);
    
    // Try to get from cache
    let playlist = await cacheHelper.get(cacheKey);
    let cached = false;
    
    if (!playlist) {
      playlist = await Playlist.findById(id)
        .select('_id title description price currency videos content instructor status createdAt updatedAt')
        .populate("instructor", "name email")
        .lean();

      if (!playlist) {
        return NextResponse.json(
          { success: false, message: "Playlist not found" },
          { status: 404 }
        );
      }

      // Cache the result (only cache approved playlists)
      if (playlist.status === 'approved') {
        await cacheHelper.set(cacheKey, playlist, CACHE_TTL.PLAYLIST_DETAILS);
      }
    } else {
      cached = true;
    }

    return NextResponse.json({
      success: true,
      playlist,
      cached
    });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}
