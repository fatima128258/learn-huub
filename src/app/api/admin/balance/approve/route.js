import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import User from "@/models/User";

// POST - Approve student payment or instructor payment
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { adminId, purchaseId, approvalType } = body;

    if (!adminId || !purchaseId || !approvalType) {
      return NextResponse.json(
        { message: "Admin ID, Purchase ID, and approval type are required" },
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

    // Find the purchase
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 }
      );
    }

    if (approvalType === "student") {
      // Approve student payment - unlock playlist
      purchase.status = "active";
      await purchase.save();

      return NextResponse.json({
        success: true,
        message: "Student payment approved. Playlist unlocked for student.",
      });
    } else if (approvalType === "instructor") {
      // Approve instructor payment
      if (purchase.instructorPaid) {
        return NextResponse.json(
          { message: "Instructor payment already approved" },
          { status: 400 }
        );
      }

      purchase.instructorPaid = true;
      purchase.instructorPaidAt = new Date();
      await purchase.save();

      return NextResponse.json({
        success: true,
        message: "Instructor payment approved.",
      });
    } else {
      return NextResponse.json(
        { message: "Invalid approval type. Use 'student' or 'instructor'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Approve payment error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
