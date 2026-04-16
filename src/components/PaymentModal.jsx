"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/Button";

export default function PaymentModal({ open, onClose, playlist, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    transactionId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate bank details
    if (!bankDetails.accountNumber || !bankDetails.accountName || !bankDetails.bankName || !bankDetails.transactionId) {
      setError("Please fill in all bank details");
      setLoading(false);
      return;
    }

    try {
      const userId = user?.id || user?._id;
      
      if (!userId) {
        setError("User not found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/payment/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: userId,
          playlistId: playlist._id,
          amount: playlist.price,
          bankDetails: bankDetails,
          transactionId: bankDetails.transactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment processing failed");
      }

      if (data.success) {
        onSuccess(data.purchase);
        onClose();
        // Reset form
        setBankDetails({
          accountNumber: "",
          accountName: "",
          bankName: "",
          transactionId: "",
        });
      } else {
        throw new Error(data.message || "Payment processing failed");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
   <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-xl font-semibold tracking-tight text-gray-800">Complete Purchase</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {playlist?.title}
          </p>
          <p className="text-sm sm:text-lg font-semibold text-[#4f7c82] mt-2">
            PKR {playlist?.price?.toLocaleString() || 0}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              id="accountNumber"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
              placeholder="Bank Account Number"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              required
              disabled={loading}
            />
            <label 
              htmlFor="accountNumber"
              className="absolute left-0 -top-3.5 text-gray-800 text-xs sm:text-sm transition-all peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs sm:peer-focus:text-sm"
            >
              Bank Account Number
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="accountName"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
              placeholder="Account Name"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
              required
              disabled={loading}
            />
            <label 
              htmlFor="accountName"
              className="absolute left-0 -top-3.5 text-gray-800 text-xs sm:text-sm transition-all peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs sm:peer-focus:text-sm"
            >
              Account Name
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="bankName"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
              placeholder="Bank Name"
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              required
              disabled={loading}
            />
            <label 
              htmlFor="bankName"
              className="absolute left-0 -top-3.5 text-gray-800 text-xs sm:text-sm transition-all peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs sm:peer-focus:text-sm"
            >
              Bank Name
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="transactionId"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
              placeholder="Enter transaction ID"
              value={bankDetails.transactionId}
              onChange={(e) => setBankDetails({ ...bankDetails, transactionId: e.target.value })}
              required
              disabled={loading}
            />
            <label 
              htmlFor="transactionId"
              className="absolute left-0 -top-3.5 text-gray-800 text-xs sm:text-sm transition-all peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs sm:peer-focus:text-sm"
            >
              Transaction ID
            </label>
          </div>

          <div className="pt-4 border-t flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-[#4f7c82] text-white text-xs sm:text-sm"
              disabled={loading}
              isLoading={loading}
            >
              {loading ? "Processing..." : (
                <>
                  <span className="sm:hidden">Purchase</span>
                  <span className="hidden sm:inline">Complete Purchase</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}















// "use client";

// import { useState } from "react";
// import { useSelector } from "react-redux";
// import { Button } from "@/components/Button";

// export default function PaymentModal({ open, onClose, playlist, onSuccess }) {
//   const { user } = useSelector((state) => state.auth);
//   const [bankDetails, setBankDetails] = useState({
//     accountNumber: "",
//     accountName: "",
//     bankName: "",
//     transactionId: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     // Validate bank details
//     if (!bankDetails.accountNumber || !bankDetails.accountName || !bankDetails.bankName || !bankDetails.transactionId) {
//       setError("Please fill in all bank details");
//       setLoading(false);
//       return;
//     }

//     try {
//       const userId = user?.id || user?._id;
      
//       if (!userId) {
//         setError("User not found. Please login again.");
//         setLoading(false);
//         return;
//       }

//       const response = await fetch("/api/payment/purchase", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           studentId: userId,
//           playlistId: playlist._id,
//           amount: playlist.price,
//           bankDetails: bankDetails,
//           transactionId: bankDetails.transactionId,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Payment processing failed");
//       }

//       if (data.success) {
//         onSuccess(data.purchase);
//         onClose();
//         // Reset form
//         setBankDetails({
//           accountNumber: "",
//           accountName: "",
//           bankName: "",
//           transactionId: "",
//         });
//       } else {
//         throw new Error(data.message || "Payment processing failed");
//       }
//     } catch (err) {
//       console.error("Payment error:", err);
//       setError(err.message || "Failed to process payment. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
//         <div className="p-6 border-b">
//           <h2 className="text-xl font-semibold tracking-tight text-gray-800">Complete Purchase</h2>
//           <p className="text-sm text-gray-600 mt-1">
//             {playlist?.title}
//           </p>
//           <p className="text-lg font-semibold text-[#4f7c82] mt-2">
//             PKR {playlist?.price?.toLocaleString() || 0}
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-6">
//           {error && (
//             <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//               {error}
//             </div>
//           )}

//           <div className="relative">
//             <input
//               type="text"
//               id="accountNumber"
//               className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
//               placeholder="Bank Account Number"
//               value={bankDetails.accountNumber}
//               onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
//               required
//               disabled={loading}
//             />
//             <label 
//               htmlFor="accountNumber"
//               className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
//             >
//               Bank Account Number
//             </label>
//           </div>

//           <div className="relative">
//             <input
//               type="text"
//               id="accountName"
//               className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
//               placeholder="Account Name"
//               value={bankDetails.accountName}
//               onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
//               required
//               disabled={loading}
//             />
//             <label 
//               htmlFor="accountName"
//               className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
//             >
//               Account Name
//             </label>
//           </div>

//           <div className="relative">
//             <input
//               type="text"
//               id="bankName"
//               className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
//               placeholder="Bank Name"
//               value={bankDetails.bankName}
//               onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
//               required
//               disabled={loading}
//             />
//             <label 
//               htmlFor="bankName"
//               className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
//             >
//               Bank Name
//             </label>
//           </div>

//           <div className="relative">
//             <input
//               type="text"
//               id="transactionId"
//               className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-[#4f7c82] transition-colors bg-transparent peer placeholder-transparent"
//               placeholder="Enter transaction ID"
//               value={bankDetails.transactionId}
//               onChange={(e) => setBankDetails({ ...bankDetails, transactionId: e.target.value })}
//               required
//               disabled={loading}
//             />
//             <label 
//               htmlFor="transactionId"
//               className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
//             >
//               Transaction ID
//             </label>
//           </div>

//           <div className="pt-4 border-t flex gap-3">
//             <Button
//               type="submit"
//               className="flex-1 bg-[#4f7c82] text-white"
//               disabled={loading}
//               isLoading={loading}
//             >
//               {loading ? "Processing..." : "Complete Purchase"}
//             </Button>
//             <Button
//               type="button"
//               variant="secondary"
//               onClick={onClose}
//               disabled={loading}
//             >
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

