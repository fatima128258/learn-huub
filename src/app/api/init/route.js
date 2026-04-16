import { NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/initAdmin";

export async function GET() {
  try {
    await initializeAdmin();
    return NextResponse.json({ success: true, message: "Initialization complete" });
  } catch (error) {
    console.error("Initialization error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
