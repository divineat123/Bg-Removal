import { Webhook } from "svix";
import Stripe from "stripe";
import userModel from "../models/userModel.js";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =========================
   CLERK WEBHOOK
========================= */
const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verify webhook payload
    const evt = whook.verify(req.body, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { type, data } = evt;

    switch (type) {
      case "user.created":
        // Upsert to prevent duplicate key errors
        await userModel.findOneAndUpdate(
          { clerkId: data.id },
          {
            clerkId: data.id,
            email: data.email_addresses[0].email_address,
            firstName: data.first_name,
            lastName: data.last_name,
            photo: data.image_url,
            $setOnInsert: { creditBalance: 5 }, // only set on insert
          },
          { upsert: true, new: true }
        );
        break;

      case "user.updated":
        await userModel.findOneAndUpdate(
          { clerkId: data.id },
          {
            email: data.email_addresses[0].email_address,
            firstName: data.first_name,
            lastName: data.last_name,
            photo: data.image_url,
          }
        );
        break;

      case "user.deleted":
        await userModel.findOneAndDelete({ clerkId: data.id });
        break;

      default:
        console.log("Unhandled Clerk webhook type:", type);
        break;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Clerk Webhook Error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

/* =========================
   GET USER CREDITS
========================= */
const userCredits = async (req, res) => {
  try {
    const { clerkId } = req.body;
    const user = await userModel.findOne({ clerkId });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, credits: user.creditBalance });
  } catch (err) {
    console.error("Get Credits Error:", err.message);
    res.json({ success: false, message: err.message });
  }
};

/* =========================
   STRIPE WEBHOOK (for automatic credit updates)
========================= */
const stripeWebhook = async (req, res) => {
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const clerkId = session.metadata.clerkId;
    const credits = Number(session.metadata.credits);

    const user = await userModel.findOne({ clerkId });
    if (user) {
      user.creditBalance += credits;
      await user.save();
      
      console.log(`✅ Stripe webhook: Added ${credits} credits to ${clerkId}`);
      console.log(`✅ New balance: ${user.creditBalance} credits`);
    } else {
      console.warn(
        `Stripe webhook: user not found for clerkId ${clerkId}, credits not added`
      );
    }
  }

  res.json({ received: true });
};

/* =========================
   MANUAL PAYMENT VERIFICATION (optional)
========================= */
const verifyStripePayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: "Session ID is required" 
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const clerkId = session.metadata.clerkId;
      const creditsToAdd = Number(session.metadata.credits || '0');
      
      // Find user and add credits
      const user = await userModel.findOne({ clerkId });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Add credits
      user.creditBalance += creditsToAdd;
      await user.save();
      
      console.log(`✅ Manual verification: Added ${creditsToAdd} credits to ${clerkId}`);
      
      return res.json({ 
        success: true, 
        message: "Payment verified, credits added",
        creditsAdded: creditsToAdd,
        creditBalance: user.creditBalance
      });
    }
    
    res.json({ 
      success: false, 
      message: "Payment not completed" 
    });
    
  } catch (error) {
    console.error("❌ Stripe verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Payment verification failed" 
    });
  }
};

export { clerkWebhooks, userCredits, stripeWebhook, verifyStripePayment };