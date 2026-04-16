import mongoose from "mongoose";

const chatDeletionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otherUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);


chatDeletionSchema.index({ user: 1, otherUser: 1 }, { unique: true });

const ChatDeletion = mongoose.models.ChatDeletion || mongoose.model("ChatDeletion", chatDeletionSchema);

export default ChatDeletion;