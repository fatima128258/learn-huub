import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Playlist from "@/models/Playlist";
import User from "@/models/User";

// POST - Update quiz completion status and grant lifetime access if passed
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      studentId,
      playlistId,
      quizPassed,
      score,
      totalMarks,
      percentage,
    } = body;

    // Validation
    if (!studentId || !playlistId || quizPassed === undefined) {
      return NextResponse.json(
        { message: "Student ID, Playlist ID, and quizPassed status are required" },
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

    // Verify playlist exists
    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    // Find the purchase
    const purchase = await Purchase.findOne({
      student: studentId,
      playlist: playlistId,
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found. Please purchase the playlist first." },
        { status: 404 }
      );
    }

    // Check if purchase is still active (not expired)
    const now = new Date();
    if (purchase.status === "active" && purchase.expiresAt) {
      const expiresAt = new Date(purchase.expiresAt);
      if (now > expiresAt) {
        // Mark as expired
        purchase.status = "expired";
        await purchase.save();
        
        return NextResponse.json(
          { message: "Your purchase has expired. Please purchase again." },
          { status: 400 }
        );
      }
    }

    // Check current attempts
    const currentAttempts = purchase.quizAttempts || 0;
    
    // Check if already passed
    if (purchase.quizPassed) {
      return NextResponse.json(
        { 
          success: true,
          message: "You have already passed this quiz!",
          purchase: {
            _id: purchase._id,
            status: purchase.status,
            quizAttempts: purchase.quizAttempts,
            quizPassed: purchase.quizPassed,
          },
        },
        { status: 200 }
      );
    }

    // Update quiz attempts
    const newAttempts = currentAttempts + 1;
    
    if (newAttempts > 3) {
      return NextResponse.json(
        { 
          message: "Maximum quiz attempts (3) exceeded. You must repurchase the playlist to try again.",
          attemptsExhausted: true,
        },
        { status: 400 }
      );
    }

    // Update purchase with quiz information
    purchase.quizAttempts = newAttempts;
    
    if (quizPassed) {
      purchase.quizPassed = true;
      purchase.quizPassedAt = new Date();
      
      // Grant lifetime access if quiz passed within 3 attempts
      purchase.status = "lifetime";
      purchase.expiresAt = null; // Lifetime access never expires
    } else {
      // Check if this was the 3rd attempt and still failed
      if (newAttempts >= 3) {
        // Failed all 3 attempts - give 1 year access from purchase date
        const purchaseDate = new Date(purchase.purchaseDate);
        const oneYearLater = new Date(purchaseDate);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        
        purchase.status = "active";
        purchase.expiresAt = oneYearLater;
      }
    }

    await purchase.save();

    const attemptsRemaining = 3 - purchase.quizAttempts;
    
    return NextResponse.json({
      success: true,
      message: quizPassed 
        ? "Quiz passed! You now have lifetime access to this playlist."
        : `Attempt ${purchase.quizAttempts} recorded. ${attemptsRemaining > 0 ? `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining.` : "All attempts exhausted. You have 1 year access to this playlist."}`,
      purchase: {
        _id: purchase._id,
        status: purchase.status,
        quizAttempts: purchase.quizAttempts,
        quizPassed: purchase.quizPassed,
        quizPassedAt: purchase.quizPassedAt,
        expiresAt: purchase.expiresAt,
        attemptsRemaining: attemptsRemaining,
      },
      score: score,
      totalMarks: totalMarks,
      percentage: percentage,
    });
  } catch (error) {
    console.error("Quiz completion error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

