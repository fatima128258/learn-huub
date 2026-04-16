import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET - Fetch admin bank details
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

   
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    
    if (!admin.bankAccountNumber || !admin.bankName) {
      admin.bankAccountNumber = admin.bankAccountNumber || "123456789019";
      admin.bankName = admin.bankName || "Mezan";
      await admin.save();
    }

    return NextResponse.json({
      success: true,
      bankDetails: {
        bankAccountNumber: admin.bankAccountNumber || "",
        bankName: admin.bankName || "",
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


export async function PATCH(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { adminId, bankAccountNumber, bankName } = body;

    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

   
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

  
    admin.bankAccountNumber = bankAccountNumber || admin.bankAccountNumber;
    admin.bankName = bankName || admin.bankName;

    await admin.save();

    return NextResponse.json({
      success: true,
      message: "Bank details updated successfully",
      bankDetails: {
        bankAccountNumber: admin.bankAccountNumber,
        bankName: admin.bankName,
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
