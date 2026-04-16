import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import User from "@/models/User";

// GET - Get admin balance and transaction history
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Verify admin exists
    const admin = await User.findById(adminId).select("role").lean();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Invalid admin" },
        { status: 403 }
      );
    }

    // Get all purchases (admin gets 30% of each purchase)
    const purchases = await Purchase.find({})
      .populate([
        {
          path: "playlist",
          select: "title instructor",
          populate: { path: "instructor", select: "name email" },
        },
        { path: "student", select: "name email" },
      ])
      .sort({ createdAt: -1 })
      .lean();

    
    let totalRevenue = 0;
    let totalAdminShare = 0;
    let pendingPayments = 0;
    const now = new Date();
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

 
    const transactions = purchases.map((purchase) => {
      const purchaseDate = new Date(purchase.createdAt);
      const daysSincePurchase = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
      const isPendingPayment = !purchase.instructorPaid && daysSincePurchase >= 8;
      
      totalRevenue += purchase.amount;
      totalAdminShare += purchase.adminShare;

      if (isPendingPayment) {
        pendingPayments += purchase.instructorShare;
      }

      return {
        _id: purchase._id.toString(),
        student: {
          _id: purchase.student?._id?.toString() || "",
          name: purchase.student?.name || "Unknown",
          email: purchase.student?.email || "",
        },
        playlist: {
          _id: purchase.playlist?._id?.toString() || "",
          title: purchase.playlist?.title || "Unknown",
          instructor: {
            _id: purchase.playlist?.instructor?._id?.toString() || "",
            name: purchase.playlist?.instructor?.name || "Unknown",
            email: purchase.playlist?.instructor?.email || "",
          },
        },
        amount: purchase.amount,
        adminShare: purchase.adminShare,
        instructorShare: purchase.instructorShare,
        instructorPaid: purchase.instructorPaid,
        instructorPaidAt: purchase.instructorPaidAt,
        purchaseDate: purchase.purchaseDate,
        createdAt: purchase.createdAt,
        daysSincePurchase: daysSincePurchase,
        isPendingPayment: isPendingPayment,
        status: purchase.status,
        transactionId: purchase.bankDetails?.transactionId || "N/A",
        studentApproved: purchase.status === "active" || purchase.status === "lifetime",
      };
    });

    return NextResponse.json({
      success: true,
      balance: {
        totalRevenue: totalRevenue,
        adminShare: totalAdminShare,
        pendingPayments: pendingPayments,
        availableBalance: totalAdminShare, 
      },
      transactions: transactions,
    });
  } catch (error) {
    console.error("Get admin balance error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

