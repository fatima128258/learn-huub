export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", confirmColor = "bg-[#4f7c82]" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
        {title && (
          <h3 className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold text-gray-800 mb-2 sm:mb-3">{title}</h3>
        )}
        <p className="text-xs sm:text-sm lg:text-base text-gray-700 mb-4 sm:mb-6">{message}</p>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 sm:py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-normal sm:font-medium text-xs sm:text-sm lg:text-base"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 sm:py-2.5 ${confirmColor} text-white rounded-lg hover:opacity-90 font-normal sm:font-medium text-xs sm:text-sm lg:text-base`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
