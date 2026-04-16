import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";

// This endpoint initializes the replied field for existing contact messages
export async function POST() {
  try {
    await connectDB();

    // Update all contacts that don't have a replied field
    const result = await Contact.updateMany(
      { replied: { $exists: false } },
      { $set: { replied: false } }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} contact messages`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Init replied field error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
