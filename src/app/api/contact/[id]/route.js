import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Contact ID is required" },
        { status: 400 }
      );
    }

    const deletedContact = await Contact.findByIdAndDelete(id);

    if (!deletedContact) {
      return NextResponse.json(
        { success: false, message: "Contact message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error);
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

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Contact ID is required" },
        { status: 400 }
      );
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { replied: body.replied || true },
      { new: true }
    );

    if (!updatedContact) {
      return NextResponse.json(
        { success: false, message: "Contact message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contact message updated successfully",
      data: updatedContact,
    });
  } catch (error) {
    console.error("Update contact error:", error);
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
