const path = require("path");
const mongoose = require("mongoose");
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

async function checkAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected\n");

    // Find all admin users
    const admins = await User.find({ role: "admin" });
    
    console.log(`Found ${admins.length} admin user(s):\n`);
    
    admins.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Password Hash: ${admin.password.substring(0, 20)}...`);
      console.log(`  Created: ${admin.createdAt}\n`);
    });

    const emailVariations = [
      "Admin@learnhub.com",
      "admin@learnhub.com",
      "ADMIN@LEARNHUB.COM"
    ];

    console.log("Checking email variations:");
    for (const email of emailVariations) {
      const user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
      if (user) {
        console.log(`  ✅ Found: ${email} -> ${user.email}`);
      } else {
        console.log(`  ❌ Not found: ${email}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkAdmin();
