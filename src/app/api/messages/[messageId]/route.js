import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import Message from "@/models/Message";
import User from "@/models/User";

// DELETE 
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { messageId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!messageId || !userId) {
      return NextResponse.json(
        { message: "Message ID and User ID are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    // Verify user is either sender or receiver
    const senderId = message.sender.toString();
    const receiverId = message.receiver.toString();

    if (userId !== senderId && userId !== receiverId) {
      return NextResponse.json(
        { message: "Unauthorized: You can only delete your own messages" },
        { status: 403 }
      );
    }

    // Check if already deleted by this user
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    
    if (message.deletedBy && Array.isArray(message.deletedBy)) {
      const alreadyDeleted = message.deletedBy.some(id => {
        const idStr = id.toString ? id.toString() : String(id);
        return idStr === userId;
      });
      
      if (alreadyDeleted) {
        return NextResponse.json({
          success: true,
          message: "Message already deleted",
        });
      }
    }

    // Add user to deletedBy array
    if (!message.deletedBy || !Array.isArray(message.deletedBy)) {
      message.deletedBy = [];
    }
    // Ensure deletion applies to both participants to prevent reappearance
    const otherUserIdObj = userId === senderId ? new mongoose.Types.ObjectId(receiverId) : new mongoose.Types.ObjectId(senderId);
    const existingIds = new Set(message.deletedBy.map((id) => id.toString()));
    if (!existingIds.has(userIdObj.toString())) {
      message.deletedBy.push(userIdObj);
    }
    if (!existingIds.has(otherUserIdObj.toString())) {
      message.deletedBy.push(otherUserIdObj);
    }
    await message.save();

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

