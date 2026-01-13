import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Upload = () => {
  const { removeBg } = useContext(AppContext);
  const [preview, setPreview] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // show preview immediately
    setPreview(URL.createObjectURL(file));

    // call background removal
    await removeBg(file);
  };

  return (
    <div className="pb-16">
      <h1 className="text-center text-2xl md:text-3xl lg:text-4xl mt-4 font-semibold bg-linear-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent py-6 md:py-16">
        See the magic. Try now
      </h1>

      <div className="text-center mb-24">
        <input
          type="file"
          accept="image/*"
          id="upload2"
          hidden
          onChange={handleUpload}
        />

        <label
          htmlFor="upload2"
          className="inline-flex gap-3 px-8 py-3.5 rounded-full cursor-pointer bg-linear-to-r from-violet-600 to-fuchsia-500 m-auto hover:scale-105 transition-all duration-700"
        >
          <img src={assets.upload_btn_icon} alt="Upload" />
          <p className="text-white">Upload your image</p>
        </label>
      </div>

      {/* Preview (safe render) */}
      {preview && (
        <div className="flex justify-center mt-6">
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs rounded-lg shadow"
          />
        </div>
      )}
    </div>
  );
};

export default Upload;
