import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BalanceComment from "@/models/BalanceComment";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Playlist from "@/models/Playlist";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get("instructorId");
    const purchaseId = searchParams.get("purchaseId");

    if (!instructorId) {
      return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
    }

    const instructor = await User.findById(instructorId).select("_id role");
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (purchaseId) {
      if (!mongoose.isValidObjectId(purchaseId)) {
        return NextResponse.json({ success: false, message: "Invalid purchaseId" }, { status: 400 });
      }
      const thread = await BalanceComment.findOne({ purchase: purchaseId, instructor: instructorId })
        .select("_id messages updatedAt")
        .lean();
      return NextResponse.json({ success: true, thread });
    }

    const threads = await BalanceComment.find({ instructor: instructorId })
      .sort({ updatedAt: -1 })
      .select("_id purchase instructor messages updatedAt")
      .populate({ path: "purchase", select: "playlist", populate: { path: "playlist", select: "title" } })
      .lean();

    return NextResponse.json({ success: true, threads });
  } catch (error) {
    console.error("Instructor balance-comments GET error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { instructorId, purchaseId, text } = body;

    if (!instructorId || !purchaseId || !text) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const instructor = await User.findById(instructorId).select("_id role");
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (!mongoose.isValidObjectId(purchaseId)) {
      return NextResponse.json({ message: "Invalid purchaseId" }, { status: 400 });
    }

    const purchase = await Purchase.findById(purchaseId).select("playlist");
    if (!purchase) {
      return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
    }
    const pl = await Playlist.findById(purchase.playlist).select("instructor");
    if (!pl || pl.instructor?.toString() !== instructorId) {
      return NextResponse.json({ message: "Purchase not found for instructor" }, { status: 404 });
    }

    const existing = await BalanceComment.findOne({ purchase: purchaseId }).select("messages").lean();
    if (existing && Array.isArray(existing.messages) && existing.messages.some(m => m.senderRole === "instructor")) {
      return NextResponse.json({ message: "Instructor has already commented on this transaction" }, { status: 400 });
    }

    const update = {
      $push: { messages: { senderRole: "instructor", text } },
      $set: { instructor: instructorId, updatedAt: new Date() },
    };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };
    const thread = await BalanceComment.findOneAndUpdate(
      { purchase: purchaseId },
      update,
      options
    ).lean();

    return NextResponse.json({ success: true, thread });
  } catch (error) {
    console.error("Instructor balance-comments POST error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get("instructorId");
    const purchaseId = searchParams.get("purchaseId");

    if (!instructorId || !purchaseId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const instructor = await User.findById(instructorId).select("_id role");
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const deleted = await BalanceComment.findOneAndDelete({ purchase: purchaseId, instructor: instructorId });
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Thread not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Instructor balance-comments DELETE error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
