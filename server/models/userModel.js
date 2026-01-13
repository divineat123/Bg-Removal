// models/userModel.js - FIXED VERSION
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true, // Keep this unique for Clerk authentication
    },
    email: {
      type: String,
      // REMOVED: unique: true - This was causing the duplicate key error
      default: "", // Allow empty strings for users without emails
    },
    firstName: String,
    lastName: String,
    photo: String,
    creditBalance: {
      type: Number,
      default: 10, // Start users with 10 credits
    },
  },
  { timestamps: true }
);

// DO NOT create any index on the email field here
const userModel = mongoose.model("User", userSchema);
export default userModel;