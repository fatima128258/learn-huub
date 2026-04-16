import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";


export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get("instructorId");

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

 
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Unauthorized: Instructor access required" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      bankDetails: {
        bankAccountNumber: instructor.bankAccountNumber || "",
        bankName: instructor.bankName || "",
      },
    });
  } catch (error) {
    console.error("Fetch bank details error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH - Update instructor bank details
export async function PATCH(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { instructorId, bankAccountNumber, bankName } = body;

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Unauthorized: Instructor access required" },
        { status: 403 }
      );
    }

    // Update bank details
    instructor.bankAccountNumber = bankAccountNumber || instructor.bankAccountNumber;
    instructor.bankName = bankName || instructor.bankName;

    await instructor.save();

    return NextResponse.json({
      success: true,
      message: "Bank details updated successfully",
      bankDetails: {
        bankAccountNumber: instructor.bankAccountNumber,
        bankName: instructor.bankName,
      },
    });
  } catch (error) {
    console.error("Update bank details error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
