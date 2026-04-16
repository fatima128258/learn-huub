import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";
import User from "@/models/User";
import { NextResponse } from "next/server";

// GET - Fetch comments for a video
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const playlistId = searchParams.get("playlistId");

    if (!videoId && !playlistId) {
      return NextResponse.json(
        { message: "videoId or playlistId is required" },
        { status: 400 }
      );
    }

    // Build query
    const query = {};
    if (videoId) {
      query.videoId = videoId;
    }
    if (playlistId) {
      query.playlistId = playlistId;
    }

    // Fetch ALL comments (both top-level and replies) in ONE query
    const allComments = await Comment.find(query)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Separate top-level comments and replies
    const topLevelComments = [];
    const repliesMap = new Map();

    allComments.forEach((comment) => {
      if (!comment.parentCommentId) {
        // Top-level comment
        topLevelComments.push({
          ...comment,
          _id: comment._id.toString(),
          userId: {
            ...comment.userId,
            _id: comment.userId._id.toString(),
          },
          replies: [],
        });
      } else {
        // Reply - group by parent
        const parentId = comment.parentCommentId.toString();
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId).push({
          ...comment,
          _id: comment._id.toString(),
          userId: {
            ...comment.userId,
            _id: comment.userId._id.toString(),
          },
        });
      }
    });

    // Attach replies to their parent comments
    topLevelComments.forEach((comment) => {
      const replies = repliesMap.get(comment._id) || [];
      comment.replies = replies.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    });

    return NextResponse.json({
      success: true,
      comments: topLevelComments,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(req) {
  try {
    await connectDB();

    const { videoId, playlistId, userId, text, parentCommentId } = await req.json();

    if (!text || !videoId || !userId) {
      return NextResponse.json(
        { message: "Missing required fields (text, videoId, userId)" },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { message: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { message: "Comment text is too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Allow both students and instructors to comment
    if (user.role !== "student" && user.role !== "instructor") {
      return NextResponse.json(
        { message: "Only students and instructors can post comments" },
        { status: 403 }
      );
    }

    const comment = await Comment.create({
      videoId,
      playlistId: playlistId || null,
      userId,
      text: text.trim(),
      parentCommentId: parentCommentId || null,
    });

    // Populate user details before returning
    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "name email role")
      .lean();

    return NextResponse.json(
      {
        success: true,
        comment: {
          ...populatedComment,
          _id: populatedComment._id.toString(),
          userId: {
            ...populatedComment.userId,
            _id: populatedComment.userId._id.toString(),
          },
          replies: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
