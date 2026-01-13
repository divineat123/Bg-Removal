// userRoutes.js - FIXED VERSION
import express from "express";
import Stripe from 'stripe';
import authUser from "../middlewares/auth.js";
import userModel from "../models/userModel.js";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const userRouter = express.Router();

// ============================
// 1. GET /api/user/sync - FIXED
// ============================
userRouter.get("/sync", authUser, async (req, res) => {
  try {
    console.log("🔍 GET /sync called for clerkId:", req.clerkId);
    
    if (!req.clerkId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    // Find existing user
    let user = await userModel.findOne({ clerkId: req.clerkId });
    
    // Create new user if doesn't exist
    if (!user) {
      user = await userModel.create({
        clerkId: req.clerkId,
        // ✅ FIX: Generate unique email if not provided
        email: req.userEmail || `${req.clerkId}@no-email.com`,
        creditBalance: 10, // Start with 10 free credits
      });
      console.log("✅ New user created (GET sync):", req.clerkId);
    }

    res.json({
      success: true,
      clerkId: user.clerkId,
      email: user.email,
      creditBalance: user.creditBalance,
    });
    
  } catch (err) {
    console.error("❌ GET Sync error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to sync user" 
    });
  }
});

// ============================
// 2. POST /api/user/sync - FIXED
// ============================
userRouter.post("/sync", authUser, async (req, res) => {
  try {
    console.log("🔍 POST /sync called for clerkId:", req.clerkId);
    
    if (!req.clerkId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    // Find existing user
    let user = await userModel.findOne({ clerkId: req.clerkId });
    
    // Create new user if doesn't exist
    if (!user) {
      user = await userModel.create({
        clerkId: req.clerkId,
        // ✅ FIX: Generate unique email if not provided
        email: req.userEmail || `${req.clerkId}@no-email.com`,
        creditBalance: 10, // Start with 10 free credits
      });
      console.log("✅ New user created (POST sync):", req.clerkId);
    }

    res.json({
      success: true,
      clerkId: user.clerkId,
      email: user.email,
      creditBalance: user.creditBalance,
    });
    
  } catch (err) {
    console.error("❌ POST Sync error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to sync user" 
    });
  }
});

// ============================
// 3. GET /api/user/credits - FIXED
// ============================
userRouter.get("/credits", authUser, async (req, res) => {
  try {
    console.log("💰 Credits requested for clerkId:", req.clerkId);
    
    if (!req.clerkId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    // Find existing user
    let user = await userModel.findOne({ clerkId: req.clerkId });
    
    // Create new user if doesn't exist (this should rarely happen)
    if (!user) {
      user = await userModel.create({
        clerkId: req.clerkId,
        // ✅ FIX: Generate unique email if not provided
        email: req.userEmail || `${req.clerkId}@no-email.com`,
        creditBalance: 10,
      });
      console.log("⚠️ User created in credits route:", req.clerkId);
    }

    res.json({
      success: true,
      creditBalance: user.creditBalance,
    });
    
  } catch (err) {
    console.error("❌ Credits error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to load credits" 
    });
  }
});

// ============================
// 4. POST /api/user/create-checkout
// ============================
userRouter.post("/create-checkout", authUser, async (req, res) => {
  try {
    console.log("💰 Stripe checkout requested by:", req.clerkId);
    console.log("📦 Requested plan:", req.body.planId);
    
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ 
        success: false, 
        message: "Plan ID is required" 
      });
    }

    // ✅ MATCH FRONTEND EXACTLY
    const plans = {
      'basic': { 
        name: "Basic Plan", 
        price: 500,      // $5.00 - 100 credits
        credits: 100 
      },
      'advanced': { 
        name: "Advanced Plan", 
        price: 2500,     // $25.00 - 500 credits
        credits: 500 
      },
      'business': { 
        name: "Business Plan", 
        price: 10000,    // $100.00 - 5000 credits
        credits: 5000 
      }
    };

    // Normalize plan ID (Basic → basic, ADVANCED → advanced, etc.)
    const normalizedPlanId = planId.toString().toLowerCase().trim();
    const selectedPlan = plans[normalizedPlanId];
    
    if (!selectedPlan) {
      console.log("❌ Invalid plan requested:", normalizedPlanId);
      console.log("✅ Available plans:", Object.keys(plans));
      
      return res.status(400).json({ 
        success: false, 
        message: `Invalid plan: "${planId}". Choose from: Basic, Advanced, Business` 
      });
    }

    console.log("✅ Plan selected:", selectedPlan.name, 
                "Price:", `$${(selectedPlan.price/100).toFixed(2)}`, 
                "Credits:", selectedPlan.credits);
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: `${selectedPlan.credits} credits for image processing`,
            },
            unit_amount: selectedPlan.price, // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/buy`,
      metadata: {
        clerkId: req.clerkId,
        planId: normalizedPlanId,
        credits: selectedPlan.credits.toString(),
        price: selectedPlan.price.toString()
      },
    });

    console.log("✅ Stripe session created:", session.id);
    
    res.json({ 
      success: true, 
      checkoutUrl: session.url 
    });
    
  } catch (error) {
    console.error("❌ Stripe checkout error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create checkout session",
      error: error.message 
    });
  }
});

// ============================
// 5. POST /api/user/verify-payment (Optional but useful)
// ============================
userRouter.post("/verify-payment", authUser, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: "Session ID required" 
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Check if payment was successful
    if (session.payment_status === 'paid') {
      const clerkId = session.metadata.clerkId;
      const creditsToAdd = parseInt(session.metadata.credits || '0');
      
      // Find user and add credits
      const user = await userModel.findOne({ clerkId: clerkId });
      if (user) {
        user.creditBalance += creditsToAdd;
        await user.save();
        console.log(`💰 Added ${creditsToAdd} credits to ${clerkId}`);
        console.log(`💰 New balance: ${user.creditBalance} credits`);
      }
      
      return res.json({ 
        success: true, 
        message: "Payment verified, credits added",
        creditsAdded: creditsToAdd,
        newBalance: user.creditBalance
      });
    }
    
    res.json({ 
      success: false, 
      message: "Payment not completed" 
    });
    
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Payment verification failed" 
    });
  }
});

export default userRouter;