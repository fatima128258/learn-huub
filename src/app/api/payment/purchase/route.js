import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Playlist from "@/models/Playlist";
import User from "@/models/User";

// POST - Create a purchase (after payment confirmation)
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      studentId,
      playlistId,
      amount,
      bankDetails,
      transactionId,
    } = body;

    // Validation
    if (!studentId || !playlistId || !amount) {
      return NextResponse.json(
        { message: "Student ID, Playlist ID, and amount are required" },
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

    // Verify playlist exists and is approved
    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    if (playlist.status !== "approved") {
      return NextResponse.json(
        { message: "Playlist is not approved for purchase" },
        { status: 400 }
      );
    }

    // Check if student already has a purchase
    const existingPurchase = await Purchase.findOne({
      student: studentId,
      playlist: playlistId,
    });

    if (existingPurchase) {

      if (existingPurchase.status === "active" || existingPurchase.status === "lifetime") {
        return NextResponse.json(
          { message: "You already have an active purchase for this playlist" },
          { status: 400 }
        );
      }
      
     
      const now = new Date();
      const purchaseDate = new Date(existingPurchase.purchaseDate);
      const oneYearLater = new Date(purchaseDate);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      
      if (existingPurchase.quizAttempts >= 3 && now <= oneYearLater) {
       
      } else if (existingPurchase.status === "expired" && now > oneYearLater) {
        
      } else if (existingPurchase.quizAttempts < 3) {
        return NextResponse.json(
          { message: "You still have quiz attempts remaining. Please complete the quiz first." },
          { status: 400 }
        );
      }
    }

   
    const adminShare = amount * 0.3;
    const instructorShare = amount * 0.7;

   
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);


    const purchase = await Purchase.create({
      student: studentId,
      playlist: playlistId,
      playlistVersion: playlist.version || 1,
      purchasedContent: {
        title: playlist.title,
        description: playlist.description,
        videos: playlist.videos,
        content: playlist.content,
        price: playlist.price,
        currency: playlist.currency,
      },
      amount: amount,
      currency: "PKR",
      purchaseDate: new Date(),
      expiresAt: expiresAt,
      status: "pending", // Changed from "active" to "pending" - requires admin approval
      paymentMethod: "bank_transfer",
      bankDetails: {
        accountNumber: bankDetails?.accountNumber || "",
        accountName: bankDetails?.accountName || "",
        bankName: bankDetails?.bankName || "",
        transactionId: bankDetails?.transactionId || transactionId || "",
      },
      adminShare: adminShare,
      instructorShare: instructorShare,
      instructorPaid: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Purchase request submitted successfully. Waiting for admin approval.",
        purchase: {
          _id: purchase._id,
          student: purchase.student,
          playlist: purchase.playlist,
          amount: purchase.amount,
          currency: purchase.currency,
          purchaseDate: purchase.purchaseDate,
          expiresAt: purchase.expiresAt,
          status: purchase.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create purchase error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


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

    // Find active or lifetime purchase
    const purchase = await Purchase.findOne({
      student: studentId,
      playlist: playlistId,
      status: { $in: ["active", "lifetime"] },
    }).lean();

    if (!purchase) {
      return NextResponse.json({
        success: true,
        purchased: false,
        access: false,
      });
    }

    // Check if purchase is expired (if status is active and not lifetime)
    let hasAccess = true;
    let isExpired = false;

    if (purchase.status === "active") {
      const now = new Date();
      if (purchase.expiresAt && now > new Date(purchase.expiresAt)) {
        
        await Purchase.findByIdAndUpdate(purchase._id, {
          status: "expired",
        });
        hasAccess = false;
        isExpired = true;
      }
    }

    // If lifetime, always has access
    if (purchase.status === "lifetime") {
      hasAccess = true;
    }

    return NextResponse.json({
      success: true,
      purchased: true,
      access: hasAccess,
      isExpired: isExpired,
      purchase: {
        _id: purchase._id,
        status: isExpired ? "expired" : purchase.status,
        expiresAt: purchase.expiresAt,
        quizAttempts: purchase.quizAttempts,
        quizPassed: purchase.quizPassed,
        purchaseDate: purchase.purchaseDate,
      },
    });
  } catch (error) {
    console.error("Check purchase error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

