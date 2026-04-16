import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Playlist from "@/models/Playlist";
import User from "@/models/User";
import StudentPlaylistProgress from "@/models/StudentPlaylistProgress";
import Purchase from "@/models/Purchase";

// GET - Fetch all approved playlists for students
export async function GET(request) {
  const startTime = Date.now();
  try {
    await connectDB();
    console.log(`[Student Playlists] DB connected in ${Date.now() - startTime}ms`);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      console.error("[Student Playlists] No studentId provided");
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }

    console.log(`[Student Playlists] Looking up student with ID: ${studentId}`);

    // Verify student exists - optimized query
    let student;
    try {
      student = await User.findById(studentId).select("role").lean();
    } catch (error) {
      console.error("[Student Playlists] Error finding student:", error);
      return NextResponse.json(
        { message: "Invalid student ID format" },
        { status: 400 }
      );
    }

    if (!student) {
      console.error(`[Student Playlists] Student not found with ID: ${studentId}`);
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "student") {
      console.error(`[Student Playlists] User role is '${student.role}', expected 'student'`);
      return NextResponse.json(
        { message: "Unauthorized: Student access required" },
        { status: 403 }
      );
    }
    console.log(`[Student Playlists] Student verified in ${Date.now() - startTime}ms`);

    // First, get playlists that the student has purchased (including deleted ones)
    const purchasedPlaylistIds = await Purchase.find({
      student: studentId,
    }).select("playlist purchasedContent playlistVersion").lean();

    const purchasedIds = purchasedPlaylistIds.map(p => p.playlist);
    
    // Create a map of purchased playlist content
    const purchasedContentMap = new Map();
    purchasedPlaylistIds.forEach(purchase => {
      if (purchase.purchasedContent) {
        purchasedContentMap.set(purchase.playlist.toString(), {
          ...purchase.purchasedContent,
          version: purchase.playlistVersion || 1,
        });
      }
    });

    // Fetch playlists with two conditions:
    // 1. Latest approved playlists NOT purchased by this student (for browsing)
    // 2. Playlists purchased by this student (we'll use snapshot, not DB data)
    const playlists = await Playlist.find({
      $or: [
        { 
          status: "approved", 
          deleted: { $ne: true }, 
          isLatestVersion: true,
          _id: { $nin: purchasedIds } // NOT purchased by this student
        },
        { 
          _id: { $in: purchasedIds } // Purchased by this student (any version)
        }
      ]
    })
      .populate("instructor", "name email")
      .select("title description videos content instructor status price currency createdAt updatedAt deleted version isLatestVersion")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[Student Playlists] Found ${playlists.length} playlists in ${Date.now() - startTime}ms`);

    // Fetch all progress records for this student and these playlists
    // Only fetch if there are playlists to avoid unnecessary queries
    const playlistIds = playlists.map(p => p._id);
    
    // Get viewer counts for all playlists
    const viewerCounts = playlistIds.length > 0 
      ? await Purchase.aggregate([
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
        ])
      : [];

    // Create a map for quick lookup
    const viewerCountMap = new Map();
    viewerCounts.forEach(item => {
      viewerCountMap.set(item._id.toString(), item.totalViewers);
    });
    
    // Execute both queries in parallel for better performance
    const [progressRecords, purchaseRecords] = await Promise.all([
      playlistIds.length > 0 
        ? StudentPlaylistProgress.find({
            student: studentId,
            playlist: { $in: playlistIds },
          }).lean()
        : Promise.resolve([]),
      playlistIds.length > 0
        ? Purchase.find({
            student: studentId,
            playlist: { $in: playlistIds },
          }).lean()
        : Promise.resolve([])
    ]);

    // Create a map of playlistId -> progress for quick lookup
    const progressMap = new Map();
    progressRecords.forEach((progress) => {
      const playlistIdStr = progress.playlist.toString();
      const videoProgressObj = {};
      if (progress.videoProgress && progress.videoProgress instanceof Map) {
        progress.videoProgress.forEach((value, key) => {
          videoProgressObj[key] = value;
        });
      } else if (progress.videoProgress && typeof progress.videoProgress === 'object') {
        Object.assign(videoProgressObj, progress.videoProgress);
      }
      progressMap.set(playlistIdStr, {
        videoProgress: videoProgressObj,
        overallProgress: progress.overallProgress || 0,
        completed: progress.completed || false,
        lastAccessedAt: progress.lastAccessedAt,
      });
    });

    // Create a map of playlistId -> purchase for quick lookup
    const purchaseMap = new Map();
    purchaseRecords.forEach((purchase) => {
      const playlistIdStr = purchase.playlist.toString();
      const now = new Date();
      const expiresAt = purchase.expiresAt ? new Date(purchase.expiresAt) : null;
      
      // Check if purchase is still valid
      let hasAccess = false;
      let isExpired = false;
      
      if (purchase.status === "lifetime") {
        hasAccess = true;
      } else if (purchase.status === "active") {
        if (expiresAt && now > expiresAt) {
          isExpired = true;
          hasAccess = false;
        } else {
          hasAccess = true;
        }
      }
      
      purchaseMap.set(playlistIdStr, {
        purchased: true,
        hasAccess: hasAccess,
        isExpired: isExpired,
        status: isExpired ? "expired" : purchase.status,
        expiresAt: purchase.expiresAt,
        quizAttempts: purchase.quizAttempts || 0,
        quizPassed: purchase.quizPassed || false,
        quizPassedAt: purchase.quizPassedAt || null,
      });
    });

    // Transform data efficiently - handle ObjectId conversion properly
    const transformedPlaylists = playlists.map((playlist) => {
      // Convert _id to string if it's an ObjectId
      const playlistId = playlist._id ? (playlist._id.toString ? playlist._id.toString() : String(playlist._id)) : null;
      
      // Check if student purchased this playlist and has a snapshot
      const purchasedSnapshot = purchasedContentMap.get(playlistId);
      
      // IMPORTANT: If student purchased this playlist, ALWAYS use the snapshot
      // This ensures they see the version they paid for, not any updates
      let playlistData;
      if (purchasedSnapshot) {
        playlistData = {
          title: purchasedSnapshot.title,
          description: purchasedSnapshot.description,
          videos: purchasedSnapshot.videos || [],
          content: purchasedSnapshot.content || [],
          price: purchasedSnapshot.price,
          currency: purchasedSnapshot.currency,
        };
      } else {
        playlistData = {
          title: playlist.title,
          description: playlist.description,
          videos: playlist.videos,
          content: playlist.content,
          price: playlist.price,
          currency: playlist.currency,
        };
      }
      
      // Handle instructor population
      // Check if instructor is populated (has name/email) or just an ObjectId
      let instructorData = null;
      if (playlist.instructor) {
        // If instructor is populated (has name property), use it
        if (playlist.instructor.name || playlist.instructor.email) {
          const instructorId = playlist.instructor._id ? (playlist.instructor._id.toString ? playlist.instructor._id.toString() : String(playlist.instructor._id)) : null;
          instructorData = {
            _id: instructorId,
            name: playlist.instructor.name || "Unknown",
            email: playlist.instructor.email || ""
          };
        } else {
          // If instructor is just an ObjectId (not populated), convert it to string
          const instructorId = playlist.instructor.toString ? playlist.instructor.toString() : String(playlist.instructor);
          instructorData = {
            _id: instructorId,
            name: "Unknown",
            email: ""
          };
        }
      }

      // Get progress for this playlist
      const progress = progressMap.get(playlistId) || {
        videoProgress: {},
        overallProgress: 0,
        completed: false,
        lastAccessedAt: null,
      };
      
      // Get purchase status for this playlist
      const purchase = purchaseMap.get(playlistId) || {
        purchased: false,
        hasAccess: false,
        isExpired: false,
        status: null,
      };
      
      return {
        _id: playlistId,
        title: playlistData.title || "",
        description: playlistData.description || "",
        videos: playlistData.videos || [],
        content: playlistData.content || [],
        price: playlistData.price || 0,
        currency: playlistData.currency || "PKR",
        totalViewers: viewerCountMap.get(playlistId) || 0,
        instructor: instructorData,
        status: playlist.status || "approved",
        deleted: playlist.deleted || false, // Include deleted flag
        version: purchasedSnapshot ? purchasedSnapshot.version : (playlist.version || 1),
        isLockedVersion: !!purchasedSnapshot, // Flag to indicate if showing purchased version
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        progress: progress, // Add student-specific progress
        purchase: purchase, // Add purchase status
      };
    });

    console.log(`[Student Playlists] Total time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      playlists: transformedPlaylists,
    });
  } catch (error) {
    console.error("Fetch student playlists error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

