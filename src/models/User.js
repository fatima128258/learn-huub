import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bankAccountNumber: {
      type: String,
      default: null,
    },
    bankName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

