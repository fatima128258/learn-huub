import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { checkRateLimit, recordFailedAttempt, recordSuccessfulLogin } from "@/lib/rateLimiter";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check rate limit for this email
    const identifier = email.toLowerCase();
    const rateLimitCheck = checkRateLimit(identifier);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          message: rateLimitCheck.message,
          blocked: true,
          remainingSeconds: rateLimitCheck.remainingSeconds,
          resetTime: rateLimitCheck.resetTime
        },
        { status: 429 } // 429 Too Many Requests
      );
    }
    
    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        {
          message: "Database connection failed. Please check your MongoDB connection.",
          error: dbError.message,
        },
        { status: 500 }
      );
    }

    // Case-insensitive email search
    const user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    
    if (!user) {
      // Record failed attempt
      recordFailedAttempt(identifier);
      
      // Get remaining attempts
      const updatedCheck = checkRateLimit(identifier);
      
      return NextResponse.json(
        { 
          message: "Invalid email or password",
          remainingAttempts: updatedCheck.remainingAttempts
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Record failed attempt
      recordFailedAttempt(identifier);
      
      // Get remaining attempts
      const updatedCheck = checkRateLimit(identifier);
      
      return NextResponse.json(
        { 
          message: "Invalid email or password",
          remainingAttempts: updatedCheck.remainingAttempts
        },
        { status: 401 }
      );
    }

    // Successful login - clear any failed attempts
    recordSuccessfulLogin(identifier);

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
