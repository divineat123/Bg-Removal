import { useEffect, useContext, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const PaymentSuccess = () => {
  const { loadCreditsData, backendUrl, getTokenFromClerk } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hasProcessed = useRef(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      toast.error("Payment session not found");
      navigate("/buy");
      return;
    }

    if (hasProcessed.current) return;
    hasProcessed.current = true;

    console.log("🎯 Payment Success - Processing session:", sessionId);

    const verifyPaymentDirectly = async () => {
      try {
        const token = await getTokenFromClerk();
        if (!token) {
          toast.error("Please sign in to verify payment");
          navigate("/");
          return;
        }

        // Call verify-payment endpoint
        const { data } = await axios.post(
          `${backendUrl}/api/user/verify-payment`,
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          await loadCreditsData(); // Refresh credits
          toast.success("Payment successful! Credits added.");
          setTimeout(() => navigate("/"), 1500);
        } else {
          toast.error("Could not verify payment");
          navigate("/buy");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        toast.error("Payment verification failed");
        navigate("/buy");
      }
    };

    verifyPaymentDirectly();
  }, [sessionId, navigate, loadCreditsData, backendUrl, getTokenFromClerk]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Verifying your payment...
        </p>

        <p className="text-sm text-gray-500">
          Please wait, you will be redirected shortly.
        </p>

        <div className="mt-8">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-900 transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;