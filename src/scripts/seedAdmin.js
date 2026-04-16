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
  console.error(" Error: MONGO_URI environment variable is not set!");
  console.error("Please create a .env.local file with MONGO_URI=your_connection_string");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(" MongoDB Connected");
  } catch (error) {
    console.error(" MongoDB connection error:", error);
    process.exit(1);
  }
}

async function seedAdmin() {
  try {
    await connectDB();

    const adminEmail = "Admin@learnhub.com";
    const adminPassword = "Admin123";
    const adminName = "Admin User";

    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      console.log(" Admin user already exists!");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log(" Admin user created successfully!");
    console.log(" Email:", adminEmail);
    console.log(" Password:", adminPassword);
    console.log(" Role: admin");
    console.log("\n  Please change the password after first login!");
    process.exit(0);
  } catch (error) {
    console.error(" Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
