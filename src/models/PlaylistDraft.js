import mongoose from "mongoose";

const PlaylistDraftSchema = new mongoose.Schema(
  {
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    savedSets: [
      {
        videoUrl: String,
        videoName: String,
        labUrl: String,
        labName: String,
        activityUrl: String,
        activityName: String,
        labMarks: Number,
        activityMarks: Number,
      },
    ],
    quizData: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PlaylistDraft ||
  mongoose.model("PlaylistDraft", PlaylistDraftSchema);
