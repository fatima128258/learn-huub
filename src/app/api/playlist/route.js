import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Playlist from "@/models/Playlist";
import User from "@/models/User";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET - Fetch instructor's playlists
export async function GET(request) {
  try {
    await connectDB();

    // Get instructor ID from query params
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get("instructorId");

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { message: "Invalid instructor" },
        { status: 403 }
      );
    }

    // Fetch playlists (exclude deleted ones, show only latest versions)
    const playlists = await Playlist.find({ 
      instructor: instructorId,
      deleted: { $ne: true },
      isLatestVersion: true
    })
      .select('_id title description price currency videos content status reviewedBy reviewedAt rejectionReason version parentPlaylist isLatestVersion createdAt updatedAt')
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Import Purchase model
    const Purchase = (await import("@/models/Purchase")).default;

    // Get viewer counts for all playlists
    const playlistIds = playlists.map(p => p._id);
    const viewerCounts = await Purchase.aggregate([
      {
        $match: {
          playlist: { $in: playlistIds },
          status: { $in: ["active", "lifetime"] }
        }
      },
      {
        $group: {
          _id: "$playlist",
          totalViewers: { $sum: 1 }
        }
      }
    ]);

    // Create a map for quick lookup
    const viewerCountMap = new Map();
    viewerCounts.forEach(item => {
      viewerCountMap.set(item._id.toString(), item.totalViewers);
    });

    return NextResponse.json({
      success: true,
      playlists: playlists.map((playlist) => ({
        _id: playlist._id,
        title: playlist.title,
        description: playlist.description,
        price: playlist.price,
        currency: playlist.currency,
        videos: playlist.videos || [],
        content: playlist.content || [],
        instructor: playlist.instructor,
        status: playlist.status || "pending",
        reviewedBy: playlist.reviewedBy,
        reviewedAt: playlist.reviewedAt,
        rejectionReason: playlist.rejectionReason,
        version: playlist.version || 1,
        parentPlaylist: playlist.parentPlaylist,
        isLatestVersion: playlist.isLatestVersion,
        totalViewers: viewerCountMap.get(playlist._id.toString()) || 0,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch playlists error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new playlist
export async function POST(request) {
  try {
    await connectDB();

    // Parse FormData
    const formData = await request.formData();

    // Extract form fields
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const priceStr = formData.get("price") || "0";
    const price = parseInt(priceStr, 10); // Use parseInt for whole numbers
    const instructorId = formData.get("instructorId");

    // Validation
    if (!title || !instructorId) {
      return NextResponse.json(
        { message: "Title and instructor ID are required" },
        { status: 400 }
      );
    }

    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: "Price must be a valid number greater than or equal to 0" },
        { status: 400 }
      );
    }

    // Verify instructor exists
    let instructor;
    try {
      console.log("Looking for instructor with ID:", instructorId);
      instructor = await User.findById(instructorId);
      console.log("Found instructor:", instructor ? { id: instructor._id, role: instructor.role } : "null");
    } catch (error) {
      console.error("Error finding instructor:", error);
      return NextResponse.json(
        { message: `Invalid instructor ID format: ${error.message}` },
        { status: 400 }
      );
    }

    if (!instructor) {
      console.log("Instructor not found for ID:", instructorId);
      return NextResponse.json(
        { message: "Instructor not found. Please login again." },
        { status: 404 }
      );
    }

    if (instructor.role !== "instructor") {
      console.log("User role is:", instructor.role, "expected: instructor");
      return NextResponse.json(
        { message: "User is not an instructor" },
        { status: 403 }
      );
    }

    // Extract structured content items
    const contentItems = [];
    let index = 0;
    while (formData.has(`content_${index}_type`)) {
      const type = formData.get(`content_${index}_type`);
      const file = formData.get(`content_${index}_file`);
      const quizDataStr = formData.get(`content_${index}_quizData`);
      const totalMarksStr = formData.get(`content_${index}_totalMarks`);
      
      if (type === "quiz") {
        // For quiz, use quizData instead of file
        if (quizDataStr) {
          try {
            const quizData = JSON.parse(quizDataStr);
            contentItems.push({
              type,
              quizData,
              order: index,
            });
          } catch (error) {
            return NextResponse.json(
              { message: `Invalid quiz data at index ${index}` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { message: `Quiz data is required for quiz at index ${index}` },
            { status: 400 }
          );
        }
      } else {
        // For other types, check for file or URL
        const url = formData.get(`content_${index}_url`);
        
        if (file && file instanceof File) {
          const item = {
            type,
            file,
            order: index,
          };
          
          // Add totalMarks for lab and activity
          if ((type === "lab" || type === "activity") && totalMarksStr) {
            const totalMarks = parseInt(totalMarksStr, 10);
            if (!isNaN(totalMarks) && totalMarks > 0) {
              item.totalMarks = totalMarks;
            }
          }
          
          contentItems.push(item);
        } else if (url) {
          // File already uploaded (from draft), use existing URL
          const item = {
            type,
            url,
            order: index,
          };
          
          // Add totalMarks for lab and activity
          if ((type === "lab" || type === "activity") && totalMarksStr) {
            const totalMarks = parseInt(totalMarksStr, 10);
            if (!isNaN(totalMarks) && totalMarks > 0) {
              item.totalMarks = totalMarks;
            }
          }
          
          contentItems.push(item);
        }
      }
      index++;
    }

    
    console.log("Content items before validation:", contentItems.map(item => ({
      type: item.type,
      hasFile: !!item.file,
      hasUrl: !!item.url,
      order: item.order
    })));
    
    if (contentItems.length < 4) {
      return NextResponse.json(
        { message: "Minimum 4 items required: Video → Lab → Activity → Final Quiz" },
        { status: 400 }
      );
    }

    // Check if last item is quiz
    const lastItem = contentItems[contentItems.length - 1];
    if (lastItem.type !== "quiz") {
      return NextResponse.json(
        { message: "Last item must be a quiz" },
        { status: 400 }
      );
    }

    // Get all items except the quiz
    const contentItemsWithoutQuiz = contentItems.slice(0, -1);
    
    // Minimum 3 items required (Video → Lab → Activity)
    if (contentItemsWithoutQuiz.length < 3) {
      return NextResponse.json(
        { message: "Minimum 3 content items required: Video → Lab → Activity" },
        { status: 400 }
      );
    }

    // Content items must be in groups of 3: Video → Lab → Activity
    if (contentItemsWithoutQuiz.length % 3 !== 0) {
      return NextResponse.json(
        { message: "Content items must be in groups of 3: Video → Lab → Activity" },
        { status: 400 }
      );
    }

    // Validate the pattern: Video → Lab → Activity (repeatable)
    const contentSet = ["video", "lab", "activity"];
    for (let i = 0; i < contentItemsWithoutQuiz.length; i++) {
      const expectedType = contentSet[i % 3];
      if (contentItemsWithoutQuiz[i].type !== expectedType) {
        const setNumber = Math.floor(i / 3) + 1;
        const positionInSet = (i % 3) + 1;
        return NextResponse.json(
          { message: `Invalid order in set ${setNumber}. Expected ${expectedType} at position ${positionInSet}, got ${contentItemsWithoutQuiz[i].type}` },
          { status: 400 }
        );
      }
    }

    // Create uploads directories if they don't exist
    const baseUploadsDir = join(process.cwd(), "public", "uploads");
    const videoDir = join(baseUploadsDir, "videos");
    const labDir = join(baseUploadsDir, "labs");
    const activityDir = join(baseUploadsDir, "activities");
    const quizDir = join(baseUploadsDir, "quizzes");

    for (const dir of [videoDir, labDir, activityDir, quizDir]) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }

    // Upload content items and create content objects
    const contentObjects = [];
    for (const item of contentItems) {
      if (item.type === "quiz") {
        // For quiz, store quizData directly without file upload
        contentObjects.push({
          type: item.type,
          filename: null, // Not required for quiz
          originalName: null, // Not required for quiz
          path: null, // Not required for quiz
          size: null, // Not required for quiz
          mimetype: null, // Not required for quiz
          order: item.order,
          uploadedAt: new Date(),
          quizData: item.quizData, // Store quiz data
        });
      } else {
        // For other types, check if file or URL
        if (item.file) {
          // Upload new file
          const bytes = await item.file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Generate unique filename
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 15);
          const extension = item.file.name.split(".").pop();
          const filename = `${timestamp}_${random}.${extension}`;

          // Determine upload directory based on type
          let uploadDir, uploadPath;
          switch (item.type) {
            case "video":
              uploadDir = videoDir;
              uploadPath = `/uploads/videos/${filename}`;
              break;
            case "lab":
              uploadDir = labDir;
              uploadPath = `/uploads/labs/${filename}`;
              break;
            case "activity":
              uploadDir = activityDir;
              uploadPath = `/uploads/activities/${filename}`;
              break;
          }

          const filepath = join(uploadDir, filename);
          await writeFile(filepath, buffer);

          const contentObj = {
            type: item.type,
            filename,
            originalName: item.file.name,
            path: uploadPath,
            size: item.file.size,
            mimetype: item.file.type,
            order: item.order,
            uploadedAt: new Date(),
          };
          
          // Add totalMarks for lab and activity
          if ((item.type === "lab" || item.type === "activity") && item.totalMarks) {
            contentObj.totalMarks = item.totalMarks;
          }

          contentObjects.push(contentObj);
        } else if (item.url) {
          // Use existing URL (from draft)
          const contentObj = {
            type: item.type,
            filename: item.url.split('/').pop(),
            originalName: item.url.split('/').pop(),
            path: item.url,
            size: 0,
            mimetype: null,
            order: item.order,
            uploadedAt: new Date(),
          };
          
          // Add totalMarks for lab and activity
          if ((item.type === "lab" || item.type === "activity") && item.totalMarks) {
            contentObj.totalMarks = item.totalMarks;
          }

          contentObjects.push(contentObj);
        }
      }
    }

    // Create playlist with pending status
    const playlist = await Playlist.create({
      instructor: instructorId,
      title,
      description,
      content: contentObjects,
      price: price,
      currency: "PKR",
      status: "pending", // Default status is pending
    });

    return NextResponse.json(
      {
        success: true,
        message: "Playlist created successfully",
        playlist: {
          _id: playlist._id,
          title: playlist.title,
          description: playlist.description,
          videos: playlist.videos || [],
          content: playlist.content || [],
          price: playlist.price || 0,
          currency: playlist.currency || "PKR",
          status: playlist.status || "pending",
          instructor: {
            _id: instructor._id,
            name: instructor.name,
            email: instructor.email,
          },
          createdAt: playlist.createdAt,
          updatedAt: playlist.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create playlist error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete playlist
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("playlistId");
    const instructorId = searchParams.get("instructorId");

    if (!playlistId || !instructorId) {
      return NextResponse.json(
        { message: "Playlist ID and Instructor ID are required" },
        { status: 400 }
      );
    }

    // Find playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (playlist.instructor.toString() !== instructorId) {
      return NextResponse.json(
        { message: "Unauthorized: You can only delete your own playlists" },
        { status: 403 }
      );
    }

    // Delete playlist from database first (fast operation)
    await Playlist.findByIdAndDelete(playlistId);

    // Delete associated files asynchronously in background (don't wait)
    const publicDir = join(process.cwd(), "public");
    const fileDeletionPromises = [];
    
    // Collect all file deletion promises
    if (playlist.videos && playlist.videos.length > 0) {
      for (const video of playlist.videos) {
        const filepath = join(publicDir, video.path);
        fileDeletionPromises.push(
          unlink(filepath).catch(err => 
            console.error(`Error deleting file ${filepath}:`, err)
          )
        );
      }
    }

    if (playlist.content && playlist.content.length > 0) {
      for (const item of playlist.content) {
        const filepath = join(publicDir, item.path);
        fileDeletionPromises.push(
          unlink(filepath).catch(err => 
            console.error(`Error deleting file ${filepath}:`, err)
          )
        );
      }
    }

    // Execute all file deletions in parallel without waiting
    Promise.all(fileDeletionPromises).catch(err => 
      console.error("Error during file cleanup:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    console.error("Delete playlist error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


// PUT - Update playlist (creates new version pending approval)
export async function PUT(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const playlistId = formData.get("playlistId");
    const instructorId = formData.get("instructorId");
    const title = formData.get("title");
    const description = formData.get("description");
    const price = formData.get("price");

    if (!playlistId || !instructorId) {
      return NextResponse.json(
        { message: "Playlist ID and Instructor ID are required" },
        { status: 400 }
      );
    }

    // Find the current playlist
    const currentPlaylist = await Playlist.findById(playlistId);
    if (!currentPlaylist) {
      return NextResponse.json(
        { message: "Playlist not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (currentPlaylist.instructor.toString() !== instructorId) {
      return NextResponse.json(
        { message: "Unauthorized: You can only update your own playlists" },
        { status: 403 }
      );
    }

    // Allow updates to approved, pending, or rejected playlists
    if (!["approved", "pending", "rejected"].includes(currentPlaylist.status)) {
      return NextResponse.json(
        { message: "Only approved, pending, or rejected playlists can be updated" },
        { status: 400 }
      );
    }

    // If playlist is pending or rejected, update it directly (rejected -> back to pending)
    if (currentPlaylist.status === "pending" || currentPlaylist.status === "rejected") {
      // Get existing content updates
      const existingContentStr = formData.get("existingContent");
      const existingContentUpdates = existingContentStr ? JSON.parse(existingContentStr) : [];

      // Process existing content
      const updatedContent = [];
      for (let i = 0; i < existingContentUpdates.length; i++) {
        const update = existingContentUpdates[i];
        
        if (update.cleared) {
          // Skip cleared items
          continue;
        }

        // Check if there's a replacement file
        const replacementFile = formData.get(`existing_${i}_file`);
        
        if (replacementFile && replacementFile.size > 0) {
          // Upload new file
          const bytes = await replacementFile.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const filename = `${timestamp}_${randomStr}.${replacementFile.name.split(".").pop()}`;

          const uploadDir = join(process.cwd(), "public", "uploads", `${update.type}s`);
          if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
          }

          const filepath = join(uploadDir, filename);
          await writeFile(filepath, buffer);

          updatedContent.push({
            type: update.type,
            filename,
            originalName: replacementFile.name,
            path: `/uploads/${update.type}s/${filename}`,
            size: replacementFile.size,
            mimetype: replacementFile.type,
            order: i,
            totalMarks: update.totalMarks,
          });
        } else if (update.type === "quiz") {
          // Keep quiz with updated data
          updatedContent.push({
            type: "quiz",
            quizData: update.quizData,
            order: i,
          });
        } else {
          // Keep existing file
          const originalItem = currentPlaylist.content[i];
          if (originalItem) {
            updatedContent.push({
              ...originalItem,
              totalMarks: update.totalMarks || originalItem.totalMarks,
            });
          }
        }
      }

      // Process new content files
      let contentIndex = 0;
      while (formData.has(`content_${contentIndex}_type`)) {
        const type = formData.get(`content_${contentIndex}_type`);
        const file = formData.get(`content_${contentIndex}_file`);

        if (type === "quiz") {
          const quizDataStr = formData.get(`content_${contentIndex}_quizData`);
          const quizData = quizDataStr ? JSON.parse(quizDataStr) : null;

          updatedContent.push({
            type: "quiz",
            quizData,
            order: updatedContent.length,
          });
        } else if (file && file.size > 0) {
          // Handle file upload
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const filename = `${timestamp}_${randomStr}.${file.name.split(".").pop()}`;

          const uploadDir = join(process.cwd(), "public", "uploads", `${type}s`);
          if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
          }

          const filepath = join(uploadDir, filename);
          await writeFile(filepath, buffer);

          const contentItem = {
            type,
            filename,
            originalName: file.name,
            path: `/uploads/${type}s/${filename}`,
            size: file.size,
            mimetype: file.type,
            order: updatedContent.length,
          };

          if (type === "lab" || type === "activity") {
            const totalMarks = formData.get(`content_${contentIndex}_totalMarks`);
            if (totalMarks) {
              contentItem.totalMarks = parseInt(totalMarks);
            }
          }

          updatedContent.push(contentItem);
        }

        contentIndex++;
      }

      // Sort content: quiz should always be last
      // Separate quiz from other content
      const quizItems = updatedContent.filter(item => item.type === "quiz");
      const nonQuizItems = updatedContent.filter(item => item.type !== "quiz");
      
      // Reassign order numbers
      const sortedContent = [...nonQuizItems, ...quizItems].map((item, index) => ({
        ...item,
        order: index
      }));

      // Update playlist directly
      currentPlaylist.title = title || currentPlaylist.title;
      currentPlaylist.description = description || currentPlaylist.description;
      currentPlaylist.price = price ? parseFloat(price) : currentPlaylist.price;
      currentPlaylist.content = sortedContent;
      if (currentPlaylist.status === "rejected") {
        currentPlaylist.status = "pending";
        currentPlaylist.rejectionReason = undefined;
        currentPlaylist.reviewedBy = undefined;
        currentPlaylist.reviewedAt = undefined;
      }

      await currentPlaylist.save();

      return NextResponse.json({
        success: true,
        message: currentPlaylist.status === "pending"
          ? "Playlist submitted for admin approval"
          : "Pending playlist updated successfully",
        playlist: {
          _id: currentPlaylist._id,
          title: currentPlaylist.title,
          description: currentPlaylist.description,
          content: currentPlaylist.content,
          status: currentPlaylist.status,
          version: currentPlaylist.version,
        },
      });
    }

    // For approved playlists, create a new version

    // Create snapshot of current approved version if not already saved
    if (!currentPlaylist.approvedSnapshot) {
      currentPlaylist.approvedSnapshot = {
        title: currentPlaylist.title,
        description: currentPlaylist.description,
        videos: currentPlaylist.videos,
        content: currentPlaylist.content,
        price: currentPlaylist.price,
        currency: currentPlaylist.currency,
        approvedAt: currentPlaylist.reviewedAt || currentPlaylist.updatedAt,
      };
    }

    // Mark current version as not latest
    currentPlaylist.isLatestVersion = false;
    await currentPlaylist.save();

    // Get existing content updates
    const existingContentStr = formData.get("existingContent");
    const existingContentUpdates = existingContentStr ? JSON.parse(existingContentStr) : [];

    // Process existing content for new version
    const updatedContent = [];
    for (let i = 0; i < existingContentUpdates.length; i++) {
      const update = existingContentUpdates[i];
      
      if (update.cleared) {
        // Skip cleared items
        continue;
      }

      // Check if there's a replacement file
      const replacementFile = formData.get(`existing_${i}_file`);
      
      if (replacementFile && replacementFile.size > 0) {
        // Upload new file
        const bytes = await replacementFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const filename = `${timestamp}_${randomStr}.${replacementFile.name.split(".").pop()}`;

        const uploadDir = join(process.cwd(), "public", "uploads", `${update.type}s`);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        updatedContent.push({
          type: update.type,
          filename,
          originalName: replacementFile.name,
          path: `/uploads/${update.type}s/${filename}`,
          size: replacementFile.size,
          mimetype: replacementFile.type,
          order: i,
          totalMarks: update.totalMarks,
        });
      } else if (update.type === "quiz") {
        // Keep quiz with updated data
        updatedContent.push({
          type: "quiz",
          quizData: update.quizData,
          order: i,
        });
      } else {
        // Keep existing file from current playlist
        const originalItem = currentPlaylist.content[i];
        if (originalItem) {
          updatedContent.push({
            ...originalItem,
            totalMarks: update.totalMarks || originalItem.totalMarks,
            order: i,
          });
        }
      }
    }

    // Process new content files
    let contentIndex = 0;
    while (formData.has(`content_${contentIndex}_type`)) {
      const type = formData.get(`content_${contentIndex}_type`);
      const file = formData.get(`content_${contentIndex}_file`);

      if (type === "quiz") {
        const quizDataStr = formData.get(`content_${contentIndex}_quizData`);
        const quizData = quizDataStr ? JSON.parse(quizDataStr) : null;

        updatedContent.push({
          type: "quiz",
          quizData,
          order: updatedContent.length,
        });
      } else if (file && file.size > 0) {
        // Handle file upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const filename = `${timestamp}_${randomStr}.${file.name.split(".").pop()}`;

        const uploadDir = join(process.cwd(), "public", "uploads", `${type}s`);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const contentItem = {
          type,
          filename,
          originalName: file.name,
          path: `/uploads/${type}s/${filename}`,
          size: file.size,
          mimetype: file.type,
          order: updatedContent.length,
        };

        if (type === "lab" || type === "activity") {
          const totalMarks = formData.get(`content_${contentIndex}_totalMarks`);
          if (totalMarks) {
            contentItem.totalMarks = parseInt(totalMarks);
          }
        }

        updatedContent.push(contentItem);
      }

      contentIndex++;
    }

    // Sort content: quiz should always be last
    // Separate quiz from other content
    const quizItems = updatedContent.filter(item => item.type === "quiz");
    const nonQuizItems = updatedContent.filter(item => item.type !== "quiz");
    
    // Reassign order numbers
    const sortedContent = [...nonQuizItems, ...quizItems].map((item, index) => ({
      ...item,
      order: index
    }));

    // Create new playlist version (pending approval)
    const newPlaylist = new Playlist({
      instructor: instructorId,
      title: title || currentPlaylist.title,
      description: description || currentPlaylist.description,
      price: price ? parseFloat(price) : currentPlaylist.price,
      currency: currentPlaylist.currency,
      videos: [], // New system uses content array
      content: sortedContent.length > 0 ? sortedContent : currentPlaylist.content,
      status: "pending", // Requires admin approval
      version: currentPlaylist.version + 1,
      isLatestVersion: true,
      parentPlaylist: currentPlaylist._id,
      deleted: false,
    });

    await newPlaylist.save();

    return NextResponse.json({
      success: true,
      message: "Playlist update submitted for approval",
      playlist: {
        _id: newPlaylist._id,
        title: newPlaylist.title,
        description: newPlaylist.description,
        content: newPlaylist.content,
        status: newPlaylist.status,
        version: newPlaylist.version,
        parentPlaylist: newPlaylist.parentPlaylist,
      },
    });
  } catch (error) {
    console.error("Update playlist error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
