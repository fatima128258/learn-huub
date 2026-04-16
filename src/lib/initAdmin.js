import connectDB from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

let adminInitialized = false;

export async function initializeAdmin() {
 
  if (adminInitialized) {
    return;
  }

  try {
    await connectDB();

    
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      console.log("🔧 No admin user found. Creating default admin...");

      const adminEmail = "Admin@learnhub.com";
      const adminPassword = "Admin123";
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });

      console.log("✅ Default admin user created successfully!");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    } else {
      console.log("✅ Admin user already exists");
    }

    adminInitialized = true;
  } catch (error) {
    console.error("❌ Error initializing admin:", error);
  }
}
