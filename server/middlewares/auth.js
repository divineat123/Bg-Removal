// middlewares/auth.js - Simple working version
export default function authUser(req, res, next) {
  try {
    // Check Authorization header (Bearer token from Clerk)
    const authHeader = req.headers.authorization;
    
    let clerkId = null;
    let userEmail = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract the token
      const token = authHeader.split(' ')[1];
      
      // Simple decode without verification (for development)
      try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        
        // Clerk stores user ID in 'sub' field
        clerkId = payload.sub;
        userEmail = payload.email || payload.email_addresses?.[0]?.email_address || '';
        
        console.log("🔐 Auth via token - clerkId:", clerkId);
      } catch (decodeError) {
        console.log("⚠️ Token decode warning:", decodeError.message);
      }
    }
    
    // Fallback to x-clerk-id header if token decode failed
    if (!clerkId && req.headers['x-clerk-id']) {
      clerkId = req.headers['x-clerk-id'];
      userEmail = req.headers['x-user-email'] || '';
      console.log("🔐 Auth via header - clerkId:", clerkId);
    }
    
    // If still no clerkId, reject the request
    if (!clerkId) {
      console.log("❌ No valid authentication found");
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Please sign in' 
      });
    }
    
    // Attach to request for routes to use
    req.clerkId = clerkId;
    req.userEmail = userEmail;
    
    next();
  } catch (error) {
    console.error("💥 Auth middleware error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
}