import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Playlist from "@/models/Playlist";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

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

    
    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam) : now.getMonth();
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    
    const daysInMonth = endOfMonth.getDate();
    const dailyStats = {};

    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyStats[dateKey] = {
        date: date,
        label: day,
        count: 0,
      };
    }

    
    const playlists = await Playlist.find({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
      deleted: { $ne: true }
    }).select("createdAt");

 
    playlists.forEach((playlist) => {
      const createdAt = new Date(playlist.createdAt);
      const dateKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].count++;
      }
    });

  
    const chartData = Object.values(dailyStats).map((item) => ({
      label: item.label.toString(),
      value: item.count,
    }));

   
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[month];

    return NextResponse.json({
      success: true,
      data: chartData,
      month: month,
      year: year,
      monthName: monthName,
      totalPlaylists: playlists.length,
    });
  } catch (error) {
    console.error("Fetch playlist stats error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

