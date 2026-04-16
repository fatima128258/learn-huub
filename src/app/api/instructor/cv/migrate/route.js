import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import InstructorCV from "@/models/InstructorCV";


export async function POST() {
  try {
    await connectDB();

   
    const result = await InstructorCV.updateMany(
      {
        $or: [
          { contact: { $exists: false } },
          { address: { $exists: false } },
          { languages: { $exists: false } }
        ]
      },
      {
        $set: {
          contact: "",
          address: "",
          languages: ""
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} CV records`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Migrate CV fields error:", error);
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
