import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for sender queries
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for receiver queries
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true, // Index for unread messages
    },
    readAt: {
      type: Date,
    },
    deletedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, read: 1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;

