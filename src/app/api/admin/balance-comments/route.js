import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BalanceComment from "@/models/BalanceComment";
import Purchase from "@/models/Purchase";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    const purchaseId = searchParams.get("purchaseId");

    if (!adminId) {
      return NextResponse.json({ message: "Admin ID is required" }, { status: 400 });
    }
    const admin = await User.findById(adminId).select("_id role");
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (purchaseId) {
      const thread = await BalanceComment.findOne({ purchase: purchaseId })
        .populate([
          { path: "purchase", populate: [{ path: "playlist", select: "title instructor", populate: { path: "instructor", select: "name email" } }, { path: "student", select: "name email" }] },
          { path: "instructor", select: "name email" },
        ])
        .lean();
      return NextResponse.json({ success: true, thread });
    }

    const threads = await BalanceComment.find({})
      .sort({ updatedAt: -1 })
      .populate([
        { path: "purchase", select: "playlist", populate: { path: "playlist", select: "title instructor", populate: { path: "instructor", select: "name email" } } },
        { path: "instructor", select: "name email" },
      ])
      .lean();

    return NextResponse.json({ success: true, threads });
  } catch (error) {
    console.error("Admin balance-comments GET error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { adminId, purchaseId, text } = body;

    if (!adminId || !purchaseId || !text) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const admin = await User.findById(adminId).select("_id role");
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const exists = await Purchase.findById(purchaseId).select("_id");
    if (!exists) {
      return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
    }

    // Disallow multiple admin replies per thread
    const existingThread = await BalanceComment.findOne({ purchase: purchaseId }).select("messages").lean();
    if (existingThread && Array.isArray(existingThread.messages) && existingThread.messages.some(m => m.senderRole === "admin")) {
      return NextResponse.json({ message: "Admin has already replied to this thread" }, { status: 400 });
    }

    const thread = await BalanceComment.findOneAndUpdate(
      { purchase: purchaseId },
      {
        $push: { messages: { senderRole: "admin", text } },
        $set: { updatedAt: new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({ success: true, thread });
  } catch (error) {
    console.error("Admin balance-comments POST error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    const purchaseId = searchParams.get("purchaseId");

    if (!adminId || !purchaseId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const admin = await User.findById(adminId).select("_id role");
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const deleted = await BalanceComment.findOneAndDelete({ purchase: purchaseId });
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Thread not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin balance-comments DELETE error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
