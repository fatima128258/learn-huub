import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Account from "@/models/InstructorAccount";
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

    const user = await User.findById(instructorId).select("role").lean();
    if (!user || user.role !== "instructor") {
      return NextResponse.json(
        { message: "Unauthorized: Instructor access required" },
        { status: 403 }
      );
    }

    const account = await Account.findOne({
      user: instructorId,
      userModel: "Instructor",
    }).lean();

    if (!account) {
      return NextResponse.json({
        success: true,
        account: null,
        message: "No account details found. Add them below.",
      });
    }

    return NextResponse.json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        bank: account.bank,
      },
    });
  } catch (error) {
    console.error("Get instructor account error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { instructorId, accountNumber, bank } = body;

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(instructorId).select("role").lean();
    if (!user || user.role !== "instructor") {
      return NextResponse.json(
        { message: "Unauthorized: Instructor access required" },
        { status: 403 }
      );
    }

    const update = {};
    if (typeof accountNumber === "string" && accountNumber.trim())
      update.accountNumber = accountNumber.trim();
    if (typeof bank === "string" && bank.trim()) update.bank = bank.trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "Provide accountNumber and/or bank to update" },
        { status: 400 }
      );
    }

    let account = await Account.findOne({
      user: instructorId,
      userModel: "Instructor",
    });

    if (!account) {
      if (!update.accountNumber || !update.bank) {
        return NextResponse.json(
          { message: "Account number and bank are both required to create account details" },
          { status: 400 }
        );
      }
      account = await Account.create({
        user: instructorId,
        userModel: "Instructor",
        accountNumber: update.accountNumber,
        bank: update.bank,
      });
    } else {
      if (update.accountNumber) account.accountNumber = update.accountNumber;
      if (update.bank) account.bank = update.bank;
      await account.save();
    }
    account = account.toObject ? account.toObject() : account;

    return NextResponse.json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        bank: account.bank,
      },
    });
  } catch (error) {
    console.error("Update instructor account error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
