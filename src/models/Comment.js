import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      index: true, 
    },
    playlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, 
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null, 
    },
  },
  { timestamps: true }
);


commentSchema.index({ videoId: 1, createdAt: -1 });
commentSchema.index({ playlistId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });


const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;

