"use client";

import { useEffect } from "react";

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-3 sm:top-4 right-3 sm:right-4 z-[9999] animate-slide-in pointer-events-none">
      <div 
        style={{ backgroundColor: '#4f7c82' }}
        className="text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 min-w-[280px] sm:min-w-[300px] max-w-md pointer-events-auto"
      >
        <div className="flex-1">
          <p className="font-normal sm:font-medium text-xs sm:text-sm">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 font-bold text-lg sm:text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
