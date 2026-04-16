import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
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
    
    playlistVersion: {
      type: Number,
      default: 1,
    },
    
    purchasedContent: {
      title: String,
      description: String,
      videos: mongoose.Schema.Types.Mixed,
      content: mongoose.Schema.Types.Mixed,
      price: Number,
      currency: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "PKR",
      enum: ["PKR"],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: false,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "lifetime"],
      default: "pending",
      index: true, // Index for status filtering
    },
    paymentMethod: {
      type: String,
      default: "bank_transfer",
    },
    bankDetails: {
      accountNumber: String,
      accountName: String,
      bankName: String,
      transactionId: String,
    },
   
    quizAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    quizPassed: {
      type: Boolean,
      default: false,
    },
    quizPassedAt: {
      type: Date,
      default: null,
    },
 
    adminShare: {
      type: Number,
      required: true,
      min: 0,
    },
    instructorShare: {
      type: Number,
      required: true,
      min: 0,
    },
    instructorPaid: {
      type: Boolean,
      default: false,
      index: true, // Index for payment queries
    },
    instructorPaidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


purchaseSchema.index({ student: 1, playlist: 1 }, { unique: true }); // Prevent duplicate purchases
purchaseSchema.index({ status: 1, expiresAt: 1 });
purchaseSchema.index({ instructorPaid: false, createdAt: 1 });
purchaseSchema.index({ student: 1, status: 1 }); // Student's active purchases
purchaseSchema.index({ status: 1, createdAt: -1 }); // Pending purchases sorted by date


const Purchase = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);

export default Purchase;

