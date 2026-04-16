import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel",
    },
    userModel: {
      type: String,
      required: true,
      enum: ["Instructor", "Student"],
    },
    accountNumber: {
      type: String,
      required: true,
    },
    bank: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Account = mongoose.models.Account || mongoose.model("Account", accountSchema);

export default Account;

