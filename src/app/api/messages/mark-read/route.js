import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { messageId, userId } = body;

    if (!messageId || !userId) {
      return NextResponse.json(
        { message: "Message ID and User ID are required" },
        { status: 400 }
      );
    }

    // Find the message and verify the user is the receiver
    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    // Only mark as read if the current user is the receiver
    if (message.receiver.toString() !== userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Mark as read
    message.read = true;
    message.readAt = new Date();
    await message.save();

    return NextResponse.json({
      success: true,
      message: "Message marked as read"
    });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { message: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
