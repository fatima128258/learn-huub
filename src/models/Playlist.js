import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});


const contentItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["video", "lab", "activity", "quiz"],
    required: true,
  },
  filename: {
    type: String,
    required: false,
    default: null,
  },
  originalName: {
    type: String,
    required: false, 
    default: null,
  },
  path: {
    type: String,
    required: false,
    default: null,
  },
  size: {
    type: Number,
    required: false,
    default: null,
  },
  mimetype: {
    type: String,
    required: false, 
    default: null,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  order: {
    type: Number,
    required: true,
  },

  quizData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Total marks
  totalMarks: {
    type: Number,
    default: null,
    min: 0,
  },
}, {

  validateBeforeSave: true,
});


contentItemSchema.pre('validate', function (next) {
 
  if (this.type !== "quiz") {
    if (!this.filename || !this.originalName || !this.path || this.size === null || this.size === undefined || !this.mimetype) {
      const error = new Error('File fields (filename, originalName, path, size, mimetype) are required for non-quiz content');
      return next(error);
    }
  }

  if (this.type === "quiz") {
    if (!this.quizData || !this.quizData.mcqs || this.quizData.mcqs.length === 0) {
      const error = new Error('Quiz data with MCQs is required for quiz content');
      return next(error);
    }
  }
  next();
});

const playlistSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for instructor queries
    },
    title: {
      type: String,
      required: true,
      index: true, // Index for title searches
    },
    description: {
      type: String,
      default: "",
    },
    videos: [videoSchema], 
    content: [contentItemSchema], 
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true, // Index for status filtering
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
      index: true, // Index for price filtering
    },
    currency: {
      type: String,
      default: "PKR",
      enum: ["PKR"],
    },

    version: {
      type: Number,
      default: 1,
    },
    isLatestVersion: {
      type: Boolean,
      default: true,
    },
    parentPlaylist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      default: null,
    },
   
    approvedSnapshot: {
      title: String,
      description: String,
      videos: [videoSchema],
      content: [contentItemSchema],
      price: Number,
      currency: String,
      approvedAt: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
playlistSchema.index({ instructor: 1, status: 1 }); // Instructor's playlists by status
playlistSchema.index({ status: 1, createdAt: -1 }); // Approved playlists sorted by date
playlistSchema.index({ instructor: 1, createdAt: -1 }); // Instructor's recent playlists

const Playlist = mongoose.models.Playlist || mongoose.model("Playlist", playlistSchema);

export default Playlist;