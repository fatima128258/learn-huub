import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlaylistDraft from "@/models/PlaylistDraft";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET - Fetch draft playlist
export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");

    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    const draft = await PlaylistDraft.findOne({ instructorId }).lean();

    return NextResponse.json({
      success: true,
      draft: draft || null,
    });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch draft" },
      { status: 500 }
    );
  }
}

// POST - Save/Update draft playlist
export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const instructorId = formData.get("instructorId");
    const title = formData.get("title");
    const price = formData.get("price");
    const description = formData.get("description");
    const quizData = formData.get("quizData");
    const setsCount = parseInt(formData.get("setsCount")) || 0;

    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    // Process uploaded files
    const savedSets = [];
    for (let i = 0; i < setsCount; i++) {
      const video = formData.get(`set_${i}_video`);
      const lab = formData.get(`set_${i}_lab`);
      const activity = formData.get(`set_${i}_activity`);
      const labMarks = formData.get(`set_${i}_labMarks`);
      const activityMarks = formData.get(`set_${i}_activityMarks`);

      const set = {
        labMarks: parseInt(labMarks) || 0,
        activityMarks: parseInt(activityMarks) || 0,
      };

      // Save video
      if (video && video.size > 0) {
        const videoBuffer = Buffer.from(await video.arrayBuffer());
        const videoFileName = `${Date.now()}_${video.name.replace(/\s+/g, "_")}`;
        const videoPath = path.join(process.cwd(), "public/uploads/drafts/videos");
        await mkdir(videoPath, { recursive: true });
        await writeFile(path.join(videoPath, videoFileName), videoBuffer);
        set.videoUrl = `/uploads/drafts/videos/${videoFileName}`;
        set.videoName = video.name;
      }

      // Save lab
      if (lab && lab.size > 0) {
        const labBuffer = Buffer.from(await lab.arrayBuffer());
        const labFileName = `${Date.now()}_${lab.name.replace(/\s+/g, "_")}`;
        const labPath = path.join(process.cwd(), "public/uploads/drafts/labs");
        await mkdir(labPath, { recursive: true });
        await writeFile(path.join(labPath, labFileName), labBuffer);
        set.labUrl = `/uploads/drafts/labs/${labFileName}`;
        set.labName = lab.name;
      }

      // Save activity
      if (activity && activity.size > 0) {
        const activityBuffer = Buffer.from(await activity.arrayBuffer());
        const activityFileName = `${Date.now()}_${activity.name.replace(/\s+/g, "_")}`;
        const activityPath = path.join(process.cwd(), "public/uploads/drafts/activities");
        await mkdir(activityPath, { recursive: true });
        await writeFile(path.join(activityPath, activityFileName), activityBuffer);
        set.activityUrl = `/uploads/drafts/activities/${activityFileName}`;
        set.activityName = activity.name;
      }

      savedSets.push(set);
    }

    // Parse quiz data
    let parsedQuizData = null;
    if (quizData) {
      try {
        parsedQuizData = JSON.parse(quizData);
      } catch (e) {
        console.error("Error parsing quiz data:", e);
      }
    }

    // Update or create draft
    const draft = await PlaylistDraft.findOneAndUpdate(
      { instructorId },
      {
        instructorId,
        title: title || "",
        price: parseFloat(price) || 0,
        description: description || "",
        savedSets,
        quizData: parsedQuizData,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Draft saved successfully",
      draft,
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save draft" },
      { status: 500 }
    );
  }
}

// DELETE - Delete draft playlist
export async function DELETE(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");

    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    await PlaylistDraft.findOneAndDelete({ instructorId });

    return NextResponse.json({
      success: true,
      message: "Draft deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete draft" },
      { status: 500 }
    );
  }
}
