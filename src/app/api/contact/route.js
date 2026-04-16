// import { NextResponse } from 'next/server';
// import connectDB from "@/lib/mongodb";
// import contact from '@/models/Contact';

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";


export async function POST(req) {
  try {
    await connectDB();

    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await Contact.create({ name, email, message });

    return NextResponse.json(
      { message: 'Message stored successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    await connectDB();

    const messages = await Contact.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

