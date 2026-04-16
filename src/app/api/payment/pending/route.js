import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";

// GET - Get pending purchases for a student
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }

    // Find all purchases that are not yet approved (status is not active or lifetime)
    const pendingPurchases = await Purchase.find({
      student: studentId,
      status: { $nin: ["active", "lifetime"] },
    })
      .populate({
        path: "playlist",
        select: "title description price instructor",
        populate: {
          path: "instructor",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const formattedPurchases = pendingPurchases.map((purchase) => ({
      _id: purchase._id.toString(),
      playlist: {
        _id: purchase.playlist?._id?.toString() || "",
        title: purchase.playlist?.title || "Unknown",
        description: purchase.playlist?.description || "",
        price: purchase.playlist?.price || 0,
        instructor: {
          _id: purchase.playlist?.instructor?._id?.toString() || "",
          name: purchase.playlist?.instructor?.name || "Unknown",
          email: purchase.playlist?.instructor?.email || "",
        },
      },
      amount: purchase.amount,
      purchaseDate: purchase.purchaseDate,
      status: purchase.status,
      bankDetails: {
        accountNumber: purchase.bankDetails?.accountNumber || "",
        accountName: purchase.bankDetails?.accountName || "",
        bankName: purchase.bankDetails?.bankName || "",
        transactionId: purchase.bankDetails?.transactionId || "",
      },
    }));

    return NextResponse.json({
      success: true,
      purchases: formattedPurchases,
    });
  } catch (error) {
    console.error("Get pending purchases error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
