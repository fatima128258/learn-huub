import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ChatDeletion from "@/models/ChatDeletion";
import User from "@/models/User";
import Message from "@/models/Message";


export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { userId } = params; 
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("otherUserId"); 

    if (!userId || !otherUserId) {
      return NextResponse.json(
        { message: "User ID and other user ID are required" },
        { status: 400 }
      );
    }

    if (userId === otherUserId) {
      return NextResponse.json(
        { message: "Cannot delete conversation with yourself" },
        { status: 400 }
      );
    }

    
    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!user || !otherUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if deletion record exists and update timestamp, or create new one
    const existingDeletion = await ChatDeletion.findOne({
      user: userId,
      otherUser: otherUserId,
    });

    if (existingDeletion) {
      // Update the deletion timestamp to now
      existingDeletion.createdAt = new Date();
      await existingDeletion.save();

      // Also mark all existing messages as deleted for this user
      await Message.updateMany(
        {
          $or: [
            { sender: userId, receiver: otherUserId },
            { sender: otherUserId, receiver: userId },
          ],
          deletedBy: { $ne: userId },
        },
        { $addToSet: { deletedBy: userId } }
      );
      
      return NextResponse.json({
        success: true,
        message: "Conversation deleted successfully",
      });
    }

    // Create new deletion record
    const deletion = await ChatDeletion.create({
      user: userId,
      otherUser: otherUserId,
    });

    // Also mark all existing messages as deleted for this user
    await Message.updateMany(
      {
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
        deletedBy: { $ne: userId },
      },
      { $addToSet: { deletedBy: userId } }
    );

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

