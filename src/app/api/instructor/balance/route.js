import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Playlist from "@/models/Playlist";
import User from "@/models/User";


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

    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Unauthorized: Instructor access required" },
        { status: 403 }
      );
    }

    
    const playlists = await Playlist.find({ 
      instructor: instructorId,
      deleted: { $ne: true }
    }).select("_id");

    const playlistIds = playlists.map(p => p._id);

    // Get all purchases for instructor's playlists
    const purchases = await Purchase.find({
      playlist: { $in: playlistIds }
    })
      .populate("student", "name email")
      .populate("playlist", "title")
      .sort({ createdAt: -1 });

    
    const pendingPayments = purchases.filter(p => !p.instructorPaid);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.instructorShare || 0), 0);

   
    const receivedPayments = purchases.filter(p => p.instructorPaid);
    const receivedAmount = receivedPayments.reduce((sum, p) => sum + (p.instructorShare || 0), 0);

   
    const totalEarnings = pendingAmount + receivedAmount;

    // Format transactions for display
    const transactions = purchases.map(purchase => ({
      _id: purchase._id,
      studentName: purchase.student?.name || "Unknown Student",
      studentEmail: purchase.student?.email || "",
      playlistTitle: purchase.playlist?.title || "Unknown Playlist",
      amount: purchase.instructorShare || 0,
      totalAmount: purchase.amount || 0,
      adminShare: purchase.adminShare || 0,
      isPaid: purchase.instructorPaid,
      paidAt: purchase.instructorPaidAt,
      purchaseDate: purchase.purchaseDate,
      status: purchase.status,
      currency: purchase.currency || "PKR",
    }));

    return NextResponse.json({
      success: true,
      balance: {
        totalEarnings,
        pendingAmount,
        receivedAmount,
        pendingCount: pendingPayments.length,
        receivedCount: receivedPayments.length,
      },
      transactions,
    });
  } catch (error) {
    console.error("Fetch instructor balance error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
