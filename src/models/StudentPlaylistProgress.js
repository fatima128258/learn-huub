import mongoose from "mongoose";

const videoProgressSchema = new mongoose.Schema({
  videoPath: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  maxProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  watched: {
    type: Boolean,
    default: false,
  }, 
}, { _id: false });

const activityProgressSchema = new mongoose.Schema({
  contentOrder: {
    type: Number,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  uploadedFilePath: {
    type: String,
    default: null,
  },
  grade: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  gradedAt: {
    type: Date,
    default: null,
  },
  feedback: {
    type: String,
    default: null,
  },
}, { _id: false });


const labProgressSchema = new mongoose.Schema({
  contentOrder: {
    type: Number,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  uploadedFilePath: {
    type: String,
    default: null,
  },
  grade: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  gradedAt: {
    type: Date,
    default: null,
  },
  feedback: {
    type: String,
    default: null,
  },
}, { _id: false });


const quizProgressSchema = new mongoose.Schema({
  contentOrder: {
    type: Number,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  attemptedAt: {
    type: Date,
    default: null,
  },
  score: {
    type: Number,
    default: null,
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
  },
  passed: {
    type: Boolean,
    default: false,
  },
  passedAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

const studentPlaylistProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for student queries
    },
    playlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      required: true,
      index: true, // Index for playlist queries
    },
    videoProgress: {
      type: Map,
      of: videoProgressSchema,
      default: {},
    },
    activityProgress: {
      type: Map,
      of: activityProgressSchema,
      default: {},
    },
    labProgress: {
      type: Map,
      of: labProgressSchema,
      default: {},
    },
    quizProgress: {
      type: Map,
      of: quizProgressSchema,
      default: {},
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


studentPlaylistProgressSchema.index({ student: 1, playlist: 1 }, { unique: true });
studentPlaylistProgressSchema.index({ playlist: 1, completed: 1 }); // Playlist completion tracking
studentPlaylistProgressSchema.index({ student: 1, lastAccessedAt: -1 }); // Recent student activity

const StudentPlaylistProgress = mongoose.models.StudentPlaylistProgress || 
  mongoose.model("StudentPlaylistProgress", studentPlaylistProgressSchema);

export default StudentPlaylistProgress;

