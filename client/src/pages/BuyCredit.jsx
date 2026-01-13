import React, { useContext } from "react";
import { assets, plans } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const BuyCredit = () => {
  const { paymentStripe, processingPlanId, credit } = useContext(AppContext);

  const handlePurchase = (plan) => {
    if (processingPlanId) {
      toast.info("Please wait, previous purchase is processing...");
      return;
    }

    console.log("🛒 Purchase clicked for plan:", plan.id);
    paymentStripe(plan.id);
  };

  return (
    <div className="min-h-[80vh] text-center pt-14 mb-10">
      {/* ✅ ONLY ADDED THIS SECTION - Shows current credits */}
      <div className="mb-6">
        <div className="inline-block bg-gray-100 px-6 py-3 rounded-full">
          <span className="font-semibold text-gray-700">Your Credits: </span>
          <span className="text-2xl font-bold text-blue-600 ml-2">{credit}</span>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-6">
        Choose the plan that's right for you
      </h1>

      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, index) => (
          <div
            key={index}
            className="bg-white drop-shadow-sm rounded-lg py-12 px-8 text-gray-700 hover:scale-105 transition-all duration-500"
          >
            {assets.logo_icon && <img src={assets.logo_icon} width={40} alt="Logo" />}
            <p className="mt-3 font-semibold">{item.id}</p>
            <p className="text-sm">{item.desc}</p>
            <p className="mt-6">
              <span className="text-3xl font-medium">
                ${(item.price / 100).toFixed(2)}
              </span>{" "}
              / {item.credits} credits
            </p>
            <button
              onClick={() => handlePurchase(item)}
              disabled={processingPlanId === item.id}
              className={`w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52 ${
                processingPlanId === item.id
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-900"
              }`}
            >
              {processingPlanId === item.id ? "Processing..." : "Purchase"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyCredit;