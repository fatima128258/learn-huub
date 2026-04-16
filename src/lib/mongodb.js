import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("⚠️ MONGO_URI environment variable is not set!");
  console.error("Please create a .env.local file in the frontend folder with:");
  console.error("MONGO_URI=mongodb://localhost:27017/learnhub");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGO_URI environment variable is not set. Please create a .env.local file in the frontend folder with: MONGO_URI=your_connection_string"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

