import { useState, useCallback } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";

const AppContextProvider = ({ children }) => {
  // ✅ Initialize with null to prevent flash of 0
  const [credit, setCredit] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [image, setImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();

  const getTokenFromClerk = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");
      return token;
    } catch (err) {
      console.error("Failed to get token:", err);
      toast.error("Authentication error. Please sign in again.");
      return null;
    }
  }, [getToken]);

  const loadCreditsData = useCallback(async () => {
    try {
      const token = await getTokenFromClerk();
      if (!token) return;

      await axios.post(`${backendUrl}/api/user/sync`, {}, { headers: { Authorization: `Bearer ${token}` } });

      const { data } = await axios.get(`${backendUrl}/api/user/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && typeof data.creditBalance === "number") {
        setCredit(data.creditBalance);
      } else {
        setCredit(10); // fallback
      }
    } catch (error) {
      console.log("❌ Load credits error:", error.response?.data || error.message);
      setCredit(10);
    }
  }, [backendUrl, getTokenFromClerk]);

  const getUserEmail = useCallback(() => {
    try {
      return user?.primaryEmailAddress?.emailAddress || null;
    } catch {
      return null;
    }
  }, [user]);

  const removeBg = async (file) => {
    if (!isSignedIn) return openSignIn();
    setImage(file);
    setResultImage(null);
    navigate("/result");

    const token = await getTokenFromClerk();
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await axios.post(`${backendUrl}/api/image/remove-bg`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setResultImage(data.resultImage);
        if (data.creditBalance != null) setCredit(data.creditBalance);
      } else {
        toast.error(data.message || "Failed to process image");
        if (data.creditBalance != null) setCredit(data.creditBalance);
        if (data.creditBalance === 0) navigate("/buy");
      }
    } catch (error) {
      console.error("❌ Remove background error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to remove background");
    }
  };

  // -----------------------------
  // ✅ Stripe payment with optimistic update
  // -----------------------------
  const paymentStripe = async (planId, planCredits = 0) => {
    if (processingPlanId) return; // Already processing
    setProcessingPlanId(planId);

    // Optimistic update
    setCredit(prev => (prev !== null ? prev + planCredits : planCredits));

    const token = await getTokenFromClerk();
    if (!token) {
      setProcessingPlanId(null);
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/create-checkout`,
        { planId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (data.success) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || "Failed to create payment session");
      }
    } catch (error) {
      console.error("❌ Stripe error:", error);
      toast.error(error.response?.data?.message || error.message || "Payment failed");

      // Rollback credit if failed
      setCredit(prev => (prev !== null ? prev - planCredits : 0));
    } finally {
      setProcessingPlanId(null);
    }
  };

  const value = {
    credit,
    setCredit,
    processingPlanId,
    loadCreditsData,
    backendUrl,
    image,
    setImage,
    removeBg,
    resultImage,
    setResultImage,
    paymentStripe,
    getUserEmail,
    getTokenFromClerk,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
