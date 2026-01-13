import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data"; // You need to import this
import authUser from "../middlewares/auth.js";
import userModel from "../models/userModel.js";

const imageRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Remove background endpoint
imageRouter.post("/remove-bg", authUser, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    // Ensure user exists
    let user = await userModel.findOne({ clerkId: req.clerkId });
    if (!user) {
      user = await userModel.create({
        clerkId: req.clerkId,
        email: req.body.email || "unknown@example.com",
        photo: req.body.photo || "",
      });
    }

    // Check credits
    if (user.creditBalance <= 0) return res.status(403).json({ success: false, message: "Insufficient credits" });

    // ✅ FIXED: Create FormData for remove.bg API
    const formData = new FormData();
    formData.append('image_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('size', 'auto'); // Optional: auto, preview, full, etc.

    // ✅ FIXED: Call remove.bg API with form-data
    const response = await axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY,
        ...formData.getHeaders(), // This adds the correct Content-Type for form-data
      },
      responseType: "arraybuffer",
    });

    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    const resultImage = `data:image/png;base64,${base64Image}`;

    // Deduct 1 credit
    user.creditBalance -= 1;
    await user.save();

    res.json({ success: true, resultImage, creditBalance: user.creditBalance });
  } catch (error) {
    console.error("Remove BG error details:", error.response?.data ? Buffer.from(error.response.data).toString() : error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove background",
      details: error.response?.data ? Buffer.from(error.response.data).toString() : error.message 
    });
  }
});

export default imageRouter;