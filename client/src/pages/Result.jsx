import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Result = () => {
  const { resultImage, image, setImage, setResultImage } = useContext(AppContext);
  const navigate = useNavigate();

  const handleTryAgain = () => {
    // Reset images and navigate back to upload
    setImage(null);
    setResultImage(null);
    navigate("/");
  };

  return (
    <div className="mx-4 my-3 lg:mx-44 mt-14 min-h-[75vh]">
      <div className="bg-white rounded-lg px-8 py-6 drop-shadow-sm">
        <div className="flex flex-col sm:grid grid-cols-2 gap-8">
          
          {/* Original Image */}
          <div>
            <p className="font-semibold text-gray-600 mb-2">Original</p>
            {image ? (
              <img
                className="rounded-md border"
                src={URL.createObjectURL(image)}
                alt="Original"
              />
            ) : (
              <p className="text-gray-400">No image uploaded</p>
            )}
          </div>

          {/* Background Removed */}
          <div className="flex flex-col">
            <p className="font-semibold text-gray-600 mb-2">Background Removed</p>
            <div className="rounded-md border border-gray-300 h-full relative bg-layer overflow-hidden flex items-center justify-center">
              {resultImage ? (
                <img src={resultImage} alt="BG Removed" className="max-w-full" />
              ) : image ? (
                // Loading spinner
                <div className="border-4 border-violet-600 rounded-full h-12 w-12 border-t-transparent animate-spin"></div>
              ) : (
                <p className="text-gray-400">No result yet</p>
              )}
            </div>
          </div>

        </div>

        {/* Buttons */}
        {resultImage && (
          <div className="flex justify-center sm:justify-end items-center flex-wrap gap-4 mt-5">
            <button
              onClick={handleTryAgain}
              className="px-8 py-2.5 text-violet-600 text-sm border border-violet-600 rounded-full hover:scale-105 transition-all duration-700"
            >
              Try another image
            </button>
            <a
              href={resultImage}
              download="bg-removed.png"
              className="px-8 py-2.5 text-white text-sm bg-linear-to-r from-violet-600 to-fuchsia-500 rounded-full hover:scale-105 transition-all duration-700"
            >
              Download image
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;