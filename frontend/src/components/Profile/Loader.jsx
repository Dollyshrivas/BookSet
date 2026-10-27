import React from "react";

const Loader = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-zinc-900">
      <div className="flex flex-col items-center gap-4">
        
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-zinc-600 border-t-white rounded-full animate-spin"></div>

        {/* Text */}
        <p className="text-white text-lg tracking-wide">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;
