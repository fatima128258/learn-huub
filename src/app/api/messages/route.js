import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import Message from "@/models/Message";
import User from "@/models/User";
import Block from "@/models/Block";
import ChatDeletion from "@/models/ChatDeletion";


export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const conversationWith = searchParams.get("conversationWith"); 

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
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

    
    if (conversationWith) {
      
      const deletion = await ChatDeletion.findOne({
        user: userId,
        otherUser: conversationWith,
      });

     
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: conversationWith },
          { sender: conversationWith, receiver: userId },
        ],
        deletedBy: { $ne: new mongoose.Types.ObjectId(userId) },
      })
        .populate("sender", "name email role profilePicture")
        .populate("receiver", "name email role profilePicture")
        .populate("deletedBy", "_id")
        .sort({ createdAt: 1 })
        .lean();

      // Mark messages as read if receiver is current user
      await Message.updateMany(
        {
          receiver: userId,
          sender: conversationWith,
          read: false,
        },
        {
          $set: { read: true, readAt: new Date() },
        }
      );

      return NextResponse.json({
        success: true,
        messages: messages
          .filter((msg) => {
            // Filter out messages deleted by current user
            if (!msg.deletedBy || !Array.isArray(msg.deletedBy)) return true;
            
            // Check if userId is in deletedBy array
            const isDeleted = msg.deletedBy.some((deletedUser) => {
              // Handle both populated and non-populated cases
              const deletedUserId = deletedUser._id ? deletedUser._id.toString() : deletedUser.toString();
              return deletedUserId === userId;
            });
            
            return !isDeleted;
          })
          .filter((msg) => {
            // Filter out messages before deletion timestamp if conversation was deleted
            if (!deletion) return true;
            return new Date(msg.createdAt) > new Date(deletion.createdAt);
          })
          .map((msg) => ({
            _id: msg._id.toString(),
            sender: {
              _id: msg.sender._id.toString(),
              name: msg.sender.name,
              email: msg.sender.email,
              role: msg.sender.role,
              profilePicture: msg.sender.profilePicture || null,
            },
            receiver: {
              _id: msg.receiver._id.toString(),
              name: msg.receiver.name,
              email: msg.receiver.email,
              role: msg.receiver.role,
              profilePicture: msg.receiver.profilePicture || null,
            },
            content: msg.content,
            read: msg.read,
            readAt: msg.readAt,
            createdAt: msg.createdAt,
          })),
        isDeleted: !!deletion,
      });
    }

    // Get all conversation user IDs (don't filter by deletion here)
    const sentMessages = await Message.find({ sender: userId })
      .select("receiver")
      .distinct("receiver")
      .lean();

    const receivedMessages = await Message.find({ receiver: userId })
      .select("sender")
      .distinct("sender")
      .lean();

    const allConversationUserIds = [
      ...new Set([
        ...sentMessages.map((id) => id.toString()),
        ...receivedMessages.map((id) => id.toString()),
      ]),
    ];

    // Get deletion records to filter messages later
    const deletedConversations = await ChatDeletion.find({
      user: userId,
    }).lean();

    const deletionMap = new Map();
    deletedConversations.forEach((d) => {
      deletionMap.set(d.otherUser.toString(), d.createdAt);
    });

    // Get all users info in one query
    const allUsers = await User.find({
      _id: { $in: allConversationUserIds }
    })
      .select("name email role profilePicture")
      .lean();

    const userMap = new Map();
    allUsers.forEach(u => {
      userMap.set(u._id.toString(), u);
    });

    // Get all blocks in one query
    const blocks = await Block.find({
      $or: [
        { blocker: userId, blocked: { $in: allConversationUserIds } },
        { blocker: { $in: allConversationUserIds }, blocked: userId },
      ],
    }).lean();

    const blockMap = new Set();
    blocks.forEach(b => {
      const otherUserId = b.blocker.toString() === userId 
        ? b.blocked.toString() 
        : b.blocker.toString();
      blockMap.add(otherUserId);
    });

    // Get all last messages in one query
    const lastMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId), receiver: { $in: allConversationUserIds.map(id => new mongoose.Types.ObjectId(id)) } },
            { sender: { $in: allConversationUserIds.map(id => new mongoose.Types.ObjectId(id)) }, receiver: new mongoose.Types.ObjectId(userId) },
          ],
          deletedBy: { $ne: new mongoose.Types.ObjectId(userId) },
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    const lastMessageMap = new Map();
    lastMessages.forEach(item => {
      lastMessageMap.set(item._id.toString(), item.lastMessage);
    });

    // Get all unread counts in one query
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          read: false,
          deletedBy: { $ne: new mongoose.Types.ObjectId(userId) },
        }
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map();
    unreadCounts.forEach(item => {
      unreadMap.set(item._id.toString(), item.count);
    });

    // Build conversations
    const conversations = allConversationUserIds.map((otherUserId) => {
      const deletionTimestamp = deletionMap.get(otherUserId);
      const lastMessage = lastMessageMap.get(otherUserId);

      // Skip if no last message
      if (!lastMessage) return null;

      // Skip if message is before deletion
      if (deletionTimestamp && new Date(lastMessage.createdAt) <= deletionTimestamp) {
        return null;
      }

      const otherUser = userMap.get(otherUserId);
      if (!otherUser) return null;

      const unreadCount = unreadMap.get(otherUserId) || 0;
      const isBlocked = blockMap.has(otherUserId);

      return {
        user: {
          _id: otherUser._id.toString(),
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          profilePicture: otherUser.profilePicture || null,
        },
        lastMessage: {
          _id: lastMessage._id.toString(),
          content: lastMessage.content,
          sender: lastMessage.sender.toString(),
          createdAt: lastMessage.createdAt,
        },
        unreadCount,
        isBlocked,
      };
    }).filter(c => c !== null);

    // Sort by last message time
    conversations.sort((a, b) => {
      return (
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
    });

    return NextResponse.json({
      success: true,
      conversations: conversations,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { senderId, receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { message: "Sender ID, receiver ID, and content are required" },
        { status: 400 }
      );
    }

    
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: receiverId, blocked: senderId },
        { blocker: senderId, blocked: receiverId },
      ],
    });

    if (isBlocked) {
      return NextResponse.json(
        { message: "Cannot send message. User is blocked." },
        { status: 403 }
      );
    }

    // Check if conversation is deleted for receiver or sender
    // Don't remove deletion records - just let messages be sent
    // The deletion timestamp will be used to filter old messages

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      read: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: {
          _id: populatedMessage._id.toString(),
          sender: {
            _id: populatedMessage.sender._id.toString(),
            name: populatedMessage.sender.name,
            email: populatedMessage.sender.email,
            role: populatedMessage.sender.role,
          },
          receiver: {
            _id: populatedMessage.receiver._id.toString(),
            name: populatedMessage.receiver.name,
            email: populatedMessage.receiver.email,
            role: populatedMessage.receiver.role,
          },
          content: populatedMessage.content,
          read: populatedMessage.read,
          createdAt: populatedMessage.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

