import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Block from "@/models/Block";
import User from "@/models/User";

// POST - Block a user
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { blockerId, blockedId } = body;

    if (!blockerId || !blockedId) {
      return NextResponse.json(
        { message: "Blocker ID and blocked ID are required" },
        { status: 400 }
      );
    }

    if (blockerId === blockedId) {
      return NextResponse.json(
        { message: "Cannot block yourself" },
        { status: 400 }
      );
    }

    // Verify both users exist
    const blocker = await User.findById(blockerId);
    const blocked = await User.findById(blockedId);

    if (!blocker || !blocked) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

   
    const existingBlock = await Block.findOne({
      blocker: blockerId,
      blocked: blockedId,
    });

    if (existingBlock) {
      return NextResponse.json({
        success: true,
        message: "User is already blocked",
        block: {
          _id: existingBlock._id.toString(),
          blocker: blockerId,
          blocked: blockedId,
          createdAt: existingBlock.createdAt,
        },
      });
    }

    // Create block
    const block = await Block.create({
      blocker: blockerId,
      blocked: blockedId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User blocked successfully",
        block: {
          _id: block._id.toString(),
          blocker: blockerId,
          blocked: blockedId,
          createdAt: block.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Block user error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Unblock a user
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const blockerId = searchParams.get("blockerId");
    const blockedId = searchParams.get("blockedId");

    if (!blockerId || !blockedId) {
      return NextResponse.json(
        { message: "Blocker ID and blocked ID are required" },
        { status: 400 }
      );
    }

    const block = await Block.findOneAndDelete({
      blocker: blockerId,
      blocked: blockedId,
    });

    if (!block) {
      return NextResponse.json(
        { message: "Block not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Check if user is blocked
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId1 = searchParams.get("userId1");
    const userId2 = searchParams.get("userId2");

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { message: "Both user IDs are required" },
        { status: 400 }
      );
    }

    const isBlocked = await Block.findOne({
      $or: [
        { blocker: userId1, blocked: userId2 },
        { blocker: userId2, blocked: userId1 },
      ],
    });

    return NextResponse.json({
      success: true,
      isBlocked: !!isBlocked,
      block: isBlocked
        ? {
            _id: isBlocked._id.toString(),
            blocker: isBlocked.blocker.toString(),
            blocked: isBlocked.blocked.toString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Check block status error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

