import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    
    return NextResponse.json({
      status: "OK",
      message: "Backend server is running",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: "Database connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

