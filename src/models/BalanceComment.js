import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["instructor", "admin"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const balanceCommentSchema = new mongoose.Schema(
  {
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

balanceCommentSchema.index({ instructor: 1, updatedAt: -1 });
balanceCommentSchema.index({ purchase: 1 }, { unique: true });

const BalanceComment =
  mongoose.models.BalanceComment || mongoose.model("BalanceComment", balanceCommentSchema);

export default BalanceComment;

