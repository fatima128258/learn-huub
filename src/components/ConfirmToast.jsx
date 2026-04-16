"use client";

import { useEffect } from "react";

export default function ConfirmToast({ message, onConfirm, onCancel }) {
  useEffect(() => {
    // Prevent body scroll when toast is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-end p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mt-3 sm:mt-4 mr-0 sm:mr-4 bg-white rounded-lg shadow-2xl border-2 border-[#4f7c82] max-w-sm w-full animate-slide-in-right">
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-medium sm:font-semibold text-gray-900 mb-1">
                Delete Playlist
              </h3>
              <p className="text-xs sm:text-sm text-gray-700">{message}</p>
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
            <button
              onClick={onConfirm}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition font-normal sm:font-medium text-xs sm:text-sm"
            >
              Yes, Delete
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-normal sm:font-medium text-xs sm:text-sm"
            >
              No, Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
