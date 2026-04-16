import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Playlist from "@/models/Playlist";
import User from "@/models/User";
import { cacheHelper } from "@/lib/cacheHelper";

// GET - Fetch all playlists for admin (with status filter)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, rejected, or all
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Build query (exclude deleted playlists)
    const query = { deleted: { $ne: true } };
    if (status && status !== "all") {
      query.status = status;
    }

    // Fetch playlists
    const playlists = await Playlist.find(query)
      .populate("instructor", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    // Import Purchase model
    const Purchase = (await import("@/models/Purchase")).default;

    // Get viewer counts for all playlists
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

    // Create a map for quick lookup
    const viewerCountMap = new Map();
    viewerCounts.forEach(item => {
      viewerCountMap.set(item._id.toString(), item.totalViewers);
    });

    return NextResponse.json({
      success: true,
      playlists: playlists.map((playlist) => ({
        _id: playlist._id,
        title: playlist.title,
        description: playlist.description,
        videos: playlist.videos || [],
        content: playlist.content || [],
        instructor: playlist.instructor,
        status: playlist.status || "pending",
        reviewedBy: playlist.reviewedBy,
        reviewedAt: playlist.reviewedAt,
        rejectionReason: playlist.rejectionReason,
        price: playlist.price || 0,
        currency: playlist.currency || "PKR",
        totalViewers: viewerCountMap.get(playlist._id.toString()) || 0,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch playlists error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject playlist
export async function PATCH(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { playlistId, adminId, action, rejectionReason } = body;

    if (!playlistId || !adminId || !action) {
      return NextResponse.json(
        { message: "Playlist ID, Admin ID, and action are required" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { message: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Find playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    // Handle approval of updated versions
    if (action === "approve" && playlist.parentPlaylist) {
      // This is an updated version - mark parent as not latest
      await Playlist.findByIdAndUpdate(playlist.parentPlaylist, {
        isLatestVersion: false,
      });
      
      // Save approved snapshot
      playlist.approvedSnapshot = {
        title: playlist.title,
        description: playlist.description,
        videos: playlist.videos,
        content: playlist.content,
        price: playlist.price,
        currency: playlist.currency,
        approvedAt: new Date(),
      };
    }

    // Update playlist status
    const updateData = {
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: adminId,
      reviewedAt: new Date(),
    };

    if (action === "reject" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (action === "approve") {
      updateData.rejectionReason = "";
      updateData.approvedSnapshot = playlist.approvedSnapshot;
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      updateData,
      { new: true }
    )
      .populate("instructor", "name email")
      .populate("reviewedBy", "name email");

    // Invalidate caches when playlist is approved or rejected
    if (action === "approve") {
      // Invalidate approved playlists cache (all pages)
      await cacheHelper.delPattern('playlists:approved:*');
      // Invalidate specific playlist cache
      await cacheHelper.del(cacheHelper.keys.playlistDetails(playlistId));
      // Invalidate instructor's playlists cache
      await cacheHelper.del(cacheHelper.keys.instructorPlaylists(updatedPlaylist.instructor._id));
    } else if (action === "reject") {
      // Invalidate specific playlist cache
      await cacheHelper.del(cacheHelper.keys.playlistDetails(playlistId));
      // Invalidate instructor's playlists cache
      await cacheHelper.del(cacheHelper.keys.instructorPlaylists(updatedPlaylist.instructor._id));
    }

    return NextResponse.json({
      success: true,
      message: `Playlist ${action === "approve" ? "approved" : "rejected"} successfully`,
      playlist: {
        _id: updatedPlaylist._id,
        title: updatedPlaylist.title,
        description: updatedPlaylist.description,
        videos: updatedPlaylist.videos || [],
        content: updatedPlaylist.content || [],
        instructor: updatedPlaylist.instructor,
        status: updatedPlaylist.status,
        reviewedBy: updatedPlaylist.reviewedBy,
        reviewedAt: updatedPlaylist.reviewedAt,
        rejectionReason: updatedPlaylist.rejectionReason,
        version: updatedPlaylist.version,
        parentPlaylist: updatedPlaylist.parentPlaylist,
        createdAt: updatedPlaylist.createdAt,
        updatedAt: updatedPlaylist.updatedAt,
      },
    });
  } catch (error) {
    console.error("Approve/Reject playlist error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

