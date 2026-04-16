import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Block from "@/models/Block";
import User from "@/models/User";


export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

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

    
    const blocks = await Block.find({ blocker: userId })
      .populate("blocked", "name email role profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    const blockedContacts = blocks.map((block) => ({
      _id: block.blocked._id.toString(),
      name: block.blocked.name,
      email: block.blocked.email,
      role: block.blocked.role,
      profilePicture: block.blocked.profilePicture || null,
      blockedAt: block.createdAt,
    }));

    return NextResponse.json({
      success: true,
      blockedContacts,
    });
  } catch (error) {
    console.error("Get blocked contacts error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

