"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/Button";

export default function MessageModal({ open, onClose, otherUserId, otherUserName, otherUserRole }) {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState(null);
  const messagesEndRef = useRef(null);

  const userId = user?.id || user?._id;


  const fetchMessages = async () => {
    if (!userId || !otherUserId) return;

    try {
      const res = await fetch(
        `/api/messages?userId=${userId}&conversationWith=${otherUserId}`
      );
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
        setIsBlocked(data.isBlocked || false);


        const unreadMessages = (data.messages || []).filter(
          (msg) => msg.receiver._id === userId && !msg.read
        );

        for (const msg of unreadMessages) {
          try {
            await fetch("/api/messages/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messageId: msg._id,
                userId: userId,
              }),
            });
          } catch (error) {
            console.error("Error marking message as read:", error);
          }
        }


        const blockRes = await fetch(
          `/api/messages/block?userId1=${userId}&userId2=${otherUserId}`
        );
        const blockData = await blockRes.json();
        if (blockData.success) {
          setBlockStatus(blockData);
          setIsBlocked(blockData.isBlocked);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId && otherUserId) {
      setLoading(true);
      fetchMessages();


      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [open, userId, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !otherUserId || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          receiverId: otherUserId,
          content: newMessage.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNewMessage("");
        fetchMessages();
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!confirm("Are you sure you want to block this user?")) return;

    try {
      const res = await fetch("/api/messages/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockerId: userId,
          blockedId: otherUserId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsBlocked(true);
        setBlockStatus({
          isBlocked: true,
          block: {
            blocker: userId,
            blocked: otherUserId,
          },
        });
        alert("User blocked successfully");
        fetchMessages();
      } else {
        alert(data.message || "Failed to block user");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user");
    }
  };

  const handleUnblock = async () => {
    if (!confirm("Are you sure you want to unblock this user?")) return;

    try {
      const res = await fetch(
        `/api/messages/block?blockerId=${userId}&blockedId=${otherUserId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (data.success) {
        setIsBlocked(false);
        setBlockStatus(null);
        alert("User unblocked successfully");

        fetchMessages();

        const blockRes = await fetch(
          `/api/messages/block?userId1=${userId}&userId2=${otherUserId}`
        );
        const blockData = await blockRes.json();
        if (blockData.success) {
          setBlockStatus(blockData);
          setIsBlocked(blockData.isBlocked);
        }
      } else {
        alert(data.message || "Failed to unblock user");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user");
    }
  };

  if (!open) return null;

  return (
     <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[100] p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl 2xl:h-[50vh] h-[80vh] flex flex-col">

        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-sm sm:text-base md:text-lg">{otherUserName || "User"}</h3>
            <p className="text-xs sm:text-sm text-gray-500 capitalize">{otherUserRole || ""}</p>
          </div>
          <div className="flex gap-1 sm:gap-2 items-center">
            {(isBlocked || blockStatus?.isBlocked) && blockStatus?.block?.blocker === userId ? (
              <Button
                onClick={handleUnblock}
                className="bg-[#4f7c82] text-white text-xs sm:text-sm font-normal px-2 sm:px-3 py-1"
              >
                Unblock
              </Button>
            ) : !isBlocked && !blockStatus?.isBlocked ? (
              <Button
                onClick={handleBlock}
                className="bg-black text-white text-xs sm:text-sm font-normal px-2 sm:px-3 py-1"
              >
                Block
              </Button>
            ) : null}
            <Button
              onClick={onClose}
              className="bg-black/80 text-white text-xs sm:text-sm font-normal px-3 sm:px-4 py-1"
            >
              Close
            </Button>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSender = msg.sender._id === userId;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75vw] sm:max-w-xs md:max-w-md px-4 py-2 rounded-lg break-words ${isSender
                        ? "bg-[#4f7c82] text-white"
                        : "bg-gray-100 text-black"
                      }`}
                  >

                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${isSender ? "text-white/70" : "text-black/60"
                        }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>


        {isBlocked || blockStatus?.isBlocked ? (
          <div className="border-t border-gray-200 p-4">
            <p className="text-sm text-black text-center">
              {blockStatus?.block?.blocker === userId
                ? "You cannot send messages. You have blocked this user."
                : "You cannot send messages. This user has blocked you."}
            </p>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-2 sm:p-4 flex gap-1 sm:gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4f7c82] text-sm sm:text-base"
              disabled={sending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-[#4f7c82] text-white px-2 sm:px-6 py-2 rounded-lg shrink-0 flex items-center justify-center min-w-[50px] sm:min-w-[80px]"
            >
              <span className="hidden sm:inline">{sending ? "Sending..." : "Send"}</span>
              <span className="sm:hidden">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}





// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import { Button } from "@/components/Button";

// export default function MessageModal({ open, onClose, otherUserId, otherUserName, otherUserRole }) {
//   const { user } = useSelector((state) => state.auth);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [isBlocked, setIsBlocked] = useState(false);
//   const [blockStatus, setBlockStatus] = useState(null);
//   const messagesEndRef = useRef(null);

//   const userId = user?.id || user?._id;


//   const fetchMessages = async () => {
//     if (!userId || !otherUserId) return;

//     try {
//       const res = await fetch(
//         `/api/messages?userId=${userId}&conversationWith=${otherUserId}`
//       );
//       const data = await res.json();

//       if (data.success) {
//         setMessages(data.messages || []);
//         setIsBlocked(data.isBlocked || false);


//         const unreadMessages = (data.messages || []).filter(
//           (msg) => msg.receiver._id === userId && !msg.read
//         );

//         for (const msg of unreadMessages) {
//           try {
//             await fetch("/api/messages/mark-read", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 messageId: msg._id,
//                 userId: userId,
//               }),
//             });
//           } catch (error) {
//             console.error("Error marking message as read:", error);
//           }
//         }


//         const blockRes = await fetch(
//           `/api/messages/block?userId1=${userId}&userId2=${otherUserId}`
//         );
//         const blockData = await blockRes.json();
//         if (blockData.success) {
//           setBlockStatus(blockData);
//           setIsBlocked(blockData.isBlocked);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (open && userId && otherUserId) {
//       setLoading(true);
//       fetchMessages();


//       const interval = setInterval(() => {
//         fetchMessages();
//       }, 3000);

//       return () => clearInterval(interval);
//     }
//   }, [open, userId, otherUserId]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !otherUserId || sending) return;

//     setSending(true);
//     try {
//       const res = await fetch("/api/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           senderId: userId,
//           receiverId: otherUserId,
//           content: newMessage.trim(),
//         }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         setNewMessage("");
//         fetchMessages();
//       } else {
//         alert(data.message || "Failed to send message");
//       }
//     } catch (error) {
//       console.error("Error sending message:", error);
//       alert("Failed to send message");
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleBlock = async () => {
//     if (!confirm("Are you sure you want to block this user?")) return;

//     try {
//       const res = await fetch("/api/messages/block", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           blockerId: userId,
//           blockedId: otherUserId,
//         }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         setIsBlocked(true);
//         setBlockStatus({
//           isBlocked: true,
//           block: {
//             blocker: userId,
//             blocked: otherUserId,
//           },
//         });
//         alert("User blocked successfully");
//         fetchMessages();
//       } else {
//         alert(data.message || "Failed to block user");
//       }
//     } catch (error) {
//       console.error("Error blocking user:", error);
//       alert("Failed to block user");
//     }
//   };

//   const handleUnblock = async () => {
//     if (!confirm("Are you sure you want to unblock this user?")) return;

//     try {
//       const res = await fetch(
//         `/api/messages/block?blockerId=${userId}&blockedId=${otherUserId}`,
//         { method: "DELETE" }
//       );

//       const data = await res.json();

//       if (data.success) {
//         setIsBlocked(false);
//         setBlockStatus(null);
//         alert("User unblocked successfully");

//         fetchMessages();

//         const blockRes = await fetch(
//           `/api/messages/block?userId1=${userId}&userId2=${otherUserId}`
//         );
//         const blockData = await blockRes.json();
//         if (blockData.success) {
//           setBlockStatus(blockData);
//           setIsBlocked(blockData.isBlocked);
//         }
//       } else {
//         alert(data.message || "Failed to unblock user");
//       }
//     } catch (error) {
//       console.error("Error unblocking user:", error);
//       alert("Failed to unblock user");
//     }
//   };

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[100] p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">

//         <div className="border-b border-gray-200 p-4 flex justify-between items-center">
//           <div>
//             <h3 className="font-semibold text-lg">{otherUserName || "User"}</h3>
//             <p className="text-sm text-gray-500 capitalize">{otherUserRole || ""}</p>
//           </div>
//           <div className="flex gap-2 items-center">
//             {(isBlocked || blockStatus?.isBlocked) && blockStatus?.block?.blocker === userId ? (
//               <Button
//                 onClick={handleUnblock}
//                 className="bg-[#4f7c82] text-white text-sm px-3 py-1"
//               >
//                 Unblock
//               </Button>
//             ) : !isBlocked && !blockStatus?.isBlocked ? (
//               <Button
//                 onClick={handleBlock}
//                 className="bg-black text-white text-sm px-3 py-1"
//               >
//                 Block
//               </Button>
//             ) : null}
//             <Button
//               onClick={onClose}
//               className="bg-black/80 text-white text-sm px-4 py-1"
//             >
//               Close
//             </Button>
//           </div>
//         </div>


//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {loading ? (
//             <div className="flex items-center justify-center h-full">
//               <p className="text-gray-500">Loading messages...</p>
//             </div>
//           ) : messages.length === 0 ? (
//             <div className="flex items-center justify-center h-full">
//               <p className="text-gray-500">No messages yet. Start the conversation!</p>
//             </div>
//           ) : (
//             messages.map((msg) => {
//               const isSender = msg.sender._id === userId;
//               return (
//                 <div
//                   key={msg._id}
//                   className={`flex ${isSender ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-md px-4 py-2 rounded-lg ${isSender
//                         ? "bg-[#4f7c82] text-white"
//                         : "bg-gray-100 text-black"
//                       }`}
//                   >

//                     <p className="text-sm">{msg.content}</p>
//                     <p
//                       className={`text-xs mt-1 ${isSender ? "text-white/70" : "text-black/60"
//                         }`}
//                     >
//                       {new Date(msg.createdAt).toLocaleTimeString()}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//           <div ref={messagesEndRef} />
//         </div>


//         {isBlocked || blockStatus?.isBlocked ? (
//           <div className="border-t border-gray-200 p-4">
//             <p className="text-sm text-black text-center">
//               {blockStatus?.block?.blocker === userId
//                 ? "You cannot send messages. You have blocked this user."
//                 : "You cannot send messages. This user has blocked you."}
//             </p>
//           </div>
//         ) : (
//           <div className="border-t border-gray-200 p-4 mb-2 flex gap-2">
//             <input
//               type="text"
//               value={newMessage}
//               onChange={(e) => setNewMessage(e.target.value)}
//               onKeyPress={(e) => {
//                 if (e.key === "Enter" && !e.shiftKey) {
//                   e.preventDefault();
//                   handleSendMessage();
//                 }
//               }}
//               placeholder="Type a message..."
//               className="flex-1 border border-gray-300 rounded-lg mb-2 px-4 py-2 "
//               disabled={sending}
//             />
//             <Button
//               onClick={handleSendMessage}
//               disabled={!newMessage.trim() || sending}
//               className="bg-[#4f7c82] text-white mb-2 px-6 py-2"
//             >
//               {sending ? "Sending..." : "Send"}
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

