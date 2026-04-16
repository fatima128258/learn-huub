import mongoose from "mongoose";
import dotenv from "dotenv";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const envPath = join(process.cwd(), ".env.local");
dotenv.config({ path: envPath });
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGO_URI (or MONGODB_URI) not set in .env.local");
  process.exit(1);
}

// Import all models so Mongoose registers schemas and indexes
import User from "../models/User.js";
import Block from "../models/Block.js";
import ChatDeletion from "../models/ChatDeletion.js";
import Comment from "../models/Comment.js";
import Contact from "../models/Contact.js";
import InstructorAccount from "../models/InstructorAccount.js";
import InstructorCV from "../models/InstructorCV.js";
import Message from "../models/Message.js";
import Playlist from "../models/Playlist.js";
import Purchase from "../models/Purchase.js";
import StudentPlaylistProgress from "../models/StudentPlaylistProgress.js";

const models = [
  { name: "User", model: User },
  { name: "Block", model: Block },
  { name: "ChatDeletion", model: ChatDeletion },
  { name: "Comment", model: Comment },
  { name: "Contact", model: Contact },
  { name: "Account", model: InstructorAccount },
  { name: "InstructorCV", model: InstructorCV },
  { name: "Message", model: Message },
  { name: "Playlist", model: Playlist },
  { name: "Purchase", model: Purchase },
  { name: "StudentPlaylistProgress", model: StudentPlaylistProgress },
];

async function initSchema() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected.\nSyncing indexes (creates/updates collections and indexes)...\n");

    for (const { name, model } of models) {
      await model.syncIndexes();
      console.log(`  ✓ ${name}`);
    }

    console.log("\n✅ Schema init done. Collections and indexes are ready.");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}


initSchema();