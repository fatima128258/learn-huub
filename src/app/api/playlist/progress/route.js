import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StudentPlaylistProgress from "@/models/StudentPlaylistProgress";
import User from "@/models/User";
import Playlist from "@/models/Playlist";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const playlistId = searchParams.get("playlistId");

    if (!studentId || !playlistId) {
      return NextResponse.json(
        { message: "Student ID and Playlist ID are required" },
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

    
    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    // Get or create progress
    let progress = await StudentPlaylistProgress.findOne({
      student: studentId,
      playlist: playlistId,
    }).lean();

    if (!progress) {
      // Create initial progress entry
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
      progress = progress.toObject();
    }

    // Helper function to convert Map to object
    const mapToObject = (map) => {
      const obj = {};
      if (map && map instanceof Map) {
        map.forEach((value, key) => {
          obj[key] = value;
        });
      } else if (map && typeof map === 'object') {
        Object.assign(obj, map);
      }
      return obj;
    };

    // Convert Maps to objects for JSON response
    const videoProgressObj = mapToObject(progress.videoProgress);
    const activityProgressObj = mapToObject(progress.activityProgress);
    const labProgressObj = mapToObject(progress.labProgress);
    const quizProgressObj = mapToObject(progress.quizProgress);

    return NextResponse.json({
      success: true,
      progress: {
        _id: progress._id.toString(),
        student: progress.student.toString(),
        playlist: progress.playlist.toString(),
        videoProgress: videoProgressObj,
        activityProgress: activityProgressObj,
        labProgress: labProgressObj,
        quizProgress: quizProgressObj,
        overallProgress: progress.overallProgress || 0,
        completed: progress.completed || false,
        lastAccessedAt: progress.lastAccessedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST/PUT - Save student's progress for a playlist
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { studentId, playlistId, videoProgress, activityProgress, labProgress, quizProgress, overallProgress, completed } = body;

    if (!studentId || !playlistId) {
      return NextResponse.json(
        { message: "Student ID and Playlist ID are required" },
        { status: 400 }
      );
    }

    // Verify student exists (optimized with lean and select)
    const student = await User.findById(studentId).select("role").lean();
    if (!student || student.role !== "student") {
      return NextResponse.json(
        { message: "Invalid student" },
        { status: 404 }
      );
    }

    // Skip playlist verification for performance - trust the client
    // const playlist = await Playlist.findById(playlistId).lean();
    // if (!playlist) {
    //   return NextResponse.json(
    //     { message: "Playlist not found" },
    //     { status: 404 }
    //   );
    // }

    // Get existing progress to preserve status (optimized with lean)
    const existingProgress = await StudentPlaylistProgress.findOne({
      student: studentId,
      playlist: playlistId,
    }).lean();

    // Helper function to convert Map to object
    const mapToObject = (map) => {
      const obj = {};
      if (map && map instanceof Map) {
        map.forEach((value, key) => {
          obj[key] = value;
        });
      } else if (map && typeof map === 'object') {
        Object.assign(obj, map);
      }
      return obj;
    };

    // Helper function to sanitize keys (replace dots with underscores for Mongoose Map compatibility)
    const sanitizeKey = (key) => {
      if (typeof key !== 'string') return key;
      return key.replace(/\./g, '_DOT_');
    };

    const unsanitizeKey = (key) => {
      if (typeof key !== 'string') return key;
      return key.replace(/_DOT_/g, '.');
    };

    // Convert existing progress Maps to objects for easier access
    const existingVideoProgressObj = mapToObject(existingProgress?.videoProgress);
    const existingActivityProgressObj = mapToObject(existingProgress?.activityProgress);
    const existingLabProgressObj = mapToObject(existingProgress?.labProgress);
    const existingQuizProgressObj = mapToObject(existingProgress?.quizProgress);

    // Helper function to merge progress Maps (preserve existing, merge with new)
    const mergeProgressMaps = (existingObj, newObj, mapType = 'video') => {
      const mergedMap = new Map();
      
      // First, preserve all existing progress
      Object.keys(existingObj).forEach((key) => {
        mergedMap.set(key, existingObj[key]);
      });
      
      // Then, update/merge with new progress
      if (newObj && typeof newObj === 'object') {
        Object.keys(newObj).forEach((key) => {
          const sanitizedKey = sanitizeKey(key); // Sanitize key for Mongoose Map
          if (mapType === 'video') {
            const newMaxProgress = newObj[key].maxProgress || newObj[key].progress || 0;
            const existingData = existingObj[key] || {};
            const incomingWatched = newObj[key].watched === true;
            
            // Preserve watched status (once true, always true)
            let isWatched = existingData.watched === true || incomingWatched || newMaxProgress >= 40;
            
            mergedMap.set(sanitizedKey, {
              videoPath: key, // Keep original path in the data
              progress: newObj[key].progress || existingData.progress || 0,
              maxProgress: Math.max(existingData.maxProgress || 0, newMaxProgress),
              lastWatchedAt: newObj[key].lastWatchedAt ? new Date(newObj[key].lastWatchedAt) : (existingData.lastWatchedAt || new Date()),
              completed: newObj[key].completed !== undefined ? newObj[key].completed : (existingData.completed || false),
              watched: isWatched,
            });
          } else if (mapType === 'activity') {
            mergedMap.set(sanitizedKey, {
              contentOrder: parseInt(key),
              completed: newObj[key].completed !== undefined ? newObj[key].completed : (existingObj[key]?.completed || false),
              submittedAt: newObj[key].submittedAt ? new Date(newObj[key].submittedAt) : (existingObj[key]?.submittedAt || null),
              uploadedFilePath: newObj[key].uploadedFilePath || existingObj[key]?.uploadedFilePath || null,
            });
          } else if (mapType === 'lab') {
            mergedMap.set(key, {
              contentOrder: parseInt(key),
              completed: newObj[key].completed !== undefined ? newObj[key].completed : (existingObj[key]?.completed || false),
              submittedAt: newObj[key].submittedAt ? new Date(newObj[key].submittedAt) : (existingObj[key]?.submittedAt || null),
              uploadedFilePath: newObj[key].uploadedFilePath || existingObj[key]?.uploadedFilePath || null,
            });
          } else if (mapType === 'quiz') {
            mergedMap.set(key, {
              contentOrder: parseInt(key),
              completed: newObj[key].completed !== undefined ? newObj[key].completed : (existingObj[key]?.completed || false),
              attemptedAt: newObj[key].attemptedAt ? new Date(newObj[key].attemptedAt) : (existingObj[key]?.attemptedAt || null),
              score: newObj[key].score !== undefined ? newObj[key].score : (existingObj[key]?.score || null),
              attempts: newObj[key].attempts !== undefined ? newObj[key].attempts : (existingObj[key]?.attempts || 0),
              passed: newObj[key].passed !== undefined ? newObj[key].passed : (existingObj[key]?.passed || false),
              passedAt: newObj[key].passedAt ? new Date(newObj[key].passedAt) : (existingObj[key]?.passedAt || null),
            });
          }
        });
      }
      
      return mergedMap;
    };

    // Convert and merge progress objects to Maps
    const videoProgressMap = mergeProgressMaps(existingVideoProgressObj, videoProgress, 'video');
    const activityProgressMap = mergeProgressMaps(existingActivityProgressObj, activityProgress, 'activity');
    const labProgressMap = mergeProgressMaps(existingLabProgressObj, labProgress, 'lab');
    const quizProgressMap = mergeProgressMaps(existingQuizProgressObj, quizProgress, 'quiz');

    // Use existing Maps if new data not provided
    const finalVideoProgressMap = videoProgress && typeof videoProgress === 'object' ? videoProgressMap : (existingProgress?.videoProgress || new Map());
    const finalActivityProgressMap = activityProgress && typeof activityProgress === 'object' ? activityProgressMap : (existingProgress?.activityProgress || new Map());
    const finalLabProgressMap = labProgress && typeof labProgress === 'object' ? labProgressMap : (existingProgress?.labProgress || new Map());
    const finalQuizProgressMap = quizProgress && typeof quizProgress === 'object' ? quizProgressMap : (existingProgress?.quizProgress || new Map());

    // Convert final Maps to objects for calculation
    const finalVideoProgressObj = mapToObject(finalVideoProgressMap);
    const finalActivityProgressObj = mapToObject(finalActivityProgressMap);
    const finalLabProgressObj = mapToObject(finalLabProgressMap);
    const finalQuizProgressObj = mapToObject(finalQuizProgressMap);

    // Calculate overall progress server-side based on playlist content
    // Skip heavy calculation for performance - use client-provided value
    let calculatedOverallProgress = overallProgress !== undefined ? overallProgress : 0;
    let calculatedCompleted = completed !== undefined ? completed : false;
    
    // Only fetch playlist for completion check if quiz is passed
    if (quizProgress && typeof quizProgress === 'object') {
      const quizKeys = Object.keys(quizProgress);
      const hasPassedQuiz = quizKeys.some(key => quizProgress[key]?.passed === true);
      
      if (hasPassedQuiz) {
        calculatedOverallProgress = 100;
        calculatedCompleted = true;
      }
    }

    // Update or create progress
    const updateData = {
      lastAccessedAt: new Date(),
    };
    
    // Only update fields that are provided
    if (videoProgress && typeof videoProgress === 'object') {
      updateData.videoProgress = finalVideoProgressMap;
    }
    if (activityProgress && typeof activityProgress === 'object') {
      updateData.activityProgress = finalActivityProgressMap;
    }
    if (labProgress && typeof labProgress === 'object') {
      updateData.labProgress = finalLabProgressMap;
    }
    if (quizProgress && typeof quizProgress === 'object') {
      updateData.quizProgress = finalQuizProgressMap;
    }
    
    // Always update overall progress and completed status (calculated server-side)
    updateData.overallProgress = calculatedOverallProgress !== undefined ? calculatedOverallProgress : (overallProgress !== undefined ? overallProgress : 0);
    updateData.completed = calculatedCompleted !== undefined ? calculatedCompleted : (completed !== undefined ? completed : false);

    const progress = await StudentPlaylistProgress.findOneAndUpdate(
      {
        student: studentId,
        playlist: playlistId,
      },
      updateData,
      {
        upsert: true,
        new: true,
      }
    );

    // Convert Maps to objects for response
    const videoProgressObj = mapToObject(progress.videoProgress);
    const activityProgressObj = mapToObject(progress.activityProgress);
    const labProgressObj = mapToObject(progress.labProgress);
    const quizProgressObj = mapToObject(progress.quizProgress);

    return NextResponse.json({
      success: true,
      message: "Progress saved successfully",
      progress: {
        _id: progress._id.toString(),
        student: progress.student.toString(),
        playlist: progress.playlist.toString(),
        videoProgress: videoProgressObj,
        activityProgress: activityProgressObj,
        labProgress: labProgressObj,
        quizProgress: quizProgressObj,
        overallProgress: progress.overallProgress || 0,
        completed: progress.completed || false,
        lastAccessedAt: progress.lastAccessedAt,
        updatedAt: progress.updatedAt,
      },
    });
  } catch (error) {
    console.error("Save progress error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Alias for POST (for RESTful API)
export async function PUT(request) {
  return POST(request);
}

