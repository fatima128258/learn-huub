const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
require("dotenv").config();

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor", "admin"], required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGO_URI environment variable is not set!");
  console.error("Please create a .env.local file with MONGO_URI=your_connection_string");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function updateAdmin() {
  try {
    await connectDB();

    // Delete all existing admin users
    const deleteResult = await User.deleteMany({ role: "admin" });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin user(s)`);

    // Create new admin with updated credentials
    const adminEmail = "Admin@learnhub.com";
    const adminPassword = "Admin123";
    const adminName = "Admin User";

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("\n✅ Admin user updated successfully!");
    console.log("📧 Email:", adminEmail);
    console.log("🔑 Password:", adminPassword);
    console.log("👤 Role: admin");
    console.log("\n✨ You can now login with these credentials!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating admin:", error);
    process.exit(1);
  }
}

updateAdmin();
