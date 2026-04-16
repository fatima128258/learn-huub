"use client";

import { useEffect } from "react";

export default function AlertModal({
  isOpen,
  onClose,
  title = "Alert",
  message,
  type = "info", 
  confirmText = "OK",
  showCancel = false,
  cancelText = "Cancel",
  onConfirm,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
       
        <div className="p-6">
          {title && (
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {title}
            </h3>
          )}

        
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>

          
          <div className={`flex gap-3 ${showCancel ? 'justify-between' : 'justify-center'}`}>
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`${showCancel ? 'flex-1' : 'min-w-[120px]'} px-6 py-2.5 ${
                type === "error"
                  ? "bg-[#4f7c82] hover:bg-[#42686d]"
                  : type === "success"
                  ? "bg-[#4f7c82] hover:bg-[#42686d]"
                  : type === "warning"
                  ? "bg-[#4f7c82] hover:bg-[#42686d]"
                  : "bg-[#4f7c82] hover:bg-[#42686d]"
              } text-white font-medium rounded-lg transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
