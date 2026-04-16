import mongoose from "mongoose";

const instructorCVSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    about: String,
    experience: String,
    skills: String,
    education: String,
    profileImage: String,
    contact: String,
    address: String,
    languages: String,
  },
  { timestamps: true }
);

const InstructorCV = mongoose.models.InstructorCV || mongoose.model("InstructorCV", instructorCVSchema);

export default InstructorCV;

