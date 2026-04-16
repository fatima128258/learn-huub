"use client";

import { useState, useEffect } from "react";

export default function EmailModal({ isOpen, onClose, onSend, userEmail, adminEmail }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubject("");
      setMessage("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) return;

    setLoading(true);
    try {
      if (typeof onSend === "function") {
        await onSend(userEmail, subject, message);
      } else {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: userEmail,
            subject,
            text: message,
            adminEmail,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to send email");
        }
      }
      onClose();
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
   <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Send Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✖
          </button>
        </div>

        {/* From */}
        <div className="px-6 py-3 border-b flex items-center gap-3 text-sm text-gray-800">
          <span className="font-semibold w-16">From</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#4f7c82] flex items-center justify-center text-white font-bold select-none">
              {adminEmail ? adminEmail.charAt(0).toUpperCase() : "A"}
            </div>
            <span>{adminEmail || "Admin"}</span>
          </div>
        </div>

        {/* To */}
        <div className="px-6 py-3 border-b flex items-center gap-3 text-sm text-gray-800">
          <span className="font-semibold w-16">To</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#4285f4] flex items-center justify-center text-white font-bold select-none">
              {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
            </div>
            <span>{userEmail}</span>
          </div>
        </div>

        {/* Subject */}
        <div className="px-6 py-3 border-b">
          <input
            type="text"
            placeholder="Subject"
            className="w-full text-lg font-semibold outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        {/* Message */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 px-6 py-4 overflow-auto">
          <textarea
            rows={8}
            placeholder="Type your message"
            className="resize-none flex-1 outline-none text-gray-900 text-base"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-[#4f7c82] hover:bg-[#3f6468] text-white font-semibold"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}














// "use client";

// import { useState, useEffect } from "react";

// export default function EmailModal({ isOpen, onClose, onSend, userEmail, adminEmail }) {
//   const [subject, setSubject] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (isOpen) {
//       setSubject("");
//       setMessage("");
//     }
//   }, [isOpen]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!subject || !message) return;

//     setLoading(true);
//     await onSend(userEmail, subject, message);
//     setLoading(false);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
//       <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b">
//           <h2 className="text-lg font-semibold text-gray-900">New mail</h2>
//           <button
//             onClick={onClose}
//             aria-label="Close"
//             className="text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-6 w-6"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* From */}
//         <div className="px-6 py-3 border-b flex items-center gap-3 text-sm text-gray-800">
//           <span className="font-semibold w-16">From</span>
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-full bg-[#4f7c82] flex items-center justify-center text-white font-bold select-none">
//               {adminEmail ? adminEmail.charAt(0).toUpperCase() : "A"}
//             </div>
//             <span>{adminEmail || "Admin"}</span>
//           </div>
//         </div>

//         {/* To */}
//         <div className="px-6 py-3 border-b flex items-center gap-3 text-sm text-gray-800">
//           <span className="font-semibold w-16">To</span>
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-full bg-[#4285f4] flex items-center justify-center text-white font-bold select-none">
//               {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
//             </div>
//             <span>{userEmail}</span>
//           </div>
//         </div>

//         {/* Subject */}
//         <div className="px-6 py-3 border-b">
//           <input
//             type="text"
//             placeholder="Subject"
//             className="w-full text-lg font-semibold outline-none"
//             value={subject}
//             onChange={(e) => setSubject(e.target.value)}
//             required
//           />
//         </div>

//         {/* Message */}
//         <form
//           onSubmit={handleSubmit}
//           className="flex flex-col flex-1 px-6 py-4 overflow-auto"
//         >
//           <textarea
//             rows={8}
//             placeholder="Type your message"
//             className="resize-none flex-1 outline-none text-gray-900 text-base"
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             required
//           />

//           {/* Footer */}
//           <div className="mt-6 flex justify-end items-center gap-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
//             >
//               Discard
//             </button>

//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 rounded-md bg-[#d93025] hover:bg-[#b1271b] text-white font-semibold"
//             >
//               {loading ? "Sending..." : "Send email"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
