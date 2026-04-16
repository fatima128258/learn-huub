"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Toast from "@/components/Toast";

export default function Balance() {
  const { user } = useSelector((state) => state.auth);
  const [balance, setBalance] = useState({
    totalEarnings: 0,
    pendingAmount: 0,
    Amount: 0,
    pendingCount: 0,
    receivedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all"); 
  const [commentDrawer, setCommentDrawer] = useState({ open: false, purchaseId: null, messages: [], loading: false });
  const [newMessage, setNewMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/instructor/balance?instructorId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setBalance(data.balance);
          setTransactions(data.transactions);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [user]);

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "pending") return !transaction.isPaid;
    if (filter === "received") return transaction.isPaid;
    return true;
  });

  const openCommentDrawer = async (purchaseId) => {
    const userId = user?.id || user?._id;
    if (!userId || !purchaseId) return;
    try {
      setCommentDrawer((s) => ({ ...s, open: true, loading: true, purchaseId, messages: [] }));
      const res = await fetch(`/api/instructor/balance-comments?instructorId=${userId}&purchaseId=${purchaseId}`);
      const data = await res.json();
      if (data.success && data.thread) {
        setCommentDrawer({ open: true, purchaseId, loading: false, messages: data.thread.messages || [] });
      } else {
        setCommentDrawer({ open: true, purchaseId, loading: false, messages: [] });
      }
    } catch (e) {
      console.error("Load comments error:", e);
      setCommentDrawer({ open: true, purchaseId, loading: false, messages: [] });
    }
  };

  const sendComment = async () => {
    const userId = user?.id || user?._id;
    if (!userId || !commentDrawer.purchaseId || !newMessage.trim()) return;
    try {
      const res = await fetch("/api/instructor/balance-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: userId,
          purchaseId: commentDrawer.purchaseId,
          text: newMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.thread) {
        setCommentDrawer((s) => ({ ...s, messages: data.thread.messages || [] }));
        setNewMessage("");
      } else if (!data.success && data.message) {
        setToastMessage(data.message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (e) {
      console.error("Send comment error:", e);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg text-black shadow-md p-6 mt-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white tracking-tight rounded-lg text-black shadow-md p-6 mt-4 md:pt-6">
      {showToast && toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => {
            setShowToast(false);
            setToastMessage("");
          }}
        />
      )}
     
      <div className="flex gap-10 mb-4 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "all"
              ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Payments
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "pending"
              ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Payments
        </button>
        <button
          onClick={() => setFilter("received")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "received"
              ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Received Payments
        </button>
      </div>

      
      {filteredTransactions.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Playlist</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Admin Share</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Instructor Pay</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paid At</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Comment</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                      {transaction.playlistTitle}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {transaction.studentName}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 text-right font-medium">
                      PKR {transaction.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 text-right">
                      PKR {transaction.adminShare.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#4f7c82] text-right font-semibold">
                      PKR {transaction.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-center">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        transaction.isPaid 
                          ? 'bg-gray-100 text-[#4f7c82]' 
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {transaction.isPaid ? ' Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {transaction.isPaid && transaction.paidAt 
                        ? `${new Date(transaction.paidAt).toLocaleDateString()} ${new Date(transaction.paidAt).toLocaleTimeString()}`
                        : '-'
                      }
                    </td>
                    <td className="py-4 px-4 text-sm text-center">
                      <button
                        onClick={() => openCommentDrawer(transaction._id)}
                        className="px-3 py-1.5 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] text-xs"
                        title="Comment"
                      >
                        Comment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="space-y-2">
                  {/* Playlist */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">PLAYLIST:</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{transaction.playlistTitle}</span>
                  </div>
                  
                  {/* Student */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">STUDENT:</span>
                    <span className="text-sm text-gray-700">{transaction.studentName}</span>
                  </div>
                  
                  {/* Total Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">TOTAL:</span>
                    <span className="text-sm font-medium text-gray-900">PKR {transaction.totalAmount.toLocaleString()}</span>
                  </div>
                  
                  {/* Admin Share */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">ADMIN SHARE:</span>
                    <span className="text-sm text-gray-700">PKR {transaction.adminShare.toLocaleString()}</span>
                  </div>
                  
                  {/* Instructor Pay */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">YOUR PAY:</span>
                    <span className="text-sm font-semibold text-[#4f7c82]">PKR {transaction.amount.toLocaleString()}</span>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">STATUS:</span>
                    <span className={`text-sm font-medium ${
                      transaction.isPaid ? 'text-[#4f7c82]' : 'text-gray-700'
                    }`}>
                      {transaction.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  
                  {/* Paid At */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">PAID AT:</span>
                    <span className="text-sm text-gray-700">
                      {transaction.isPaid && transaction.paidAt 
                        ? `${new Date(transaction.paidAt).toLocaleDateString()} ${new Date(transaction.paidAt).toLocaleTimeString()}`
                        : '-'
                      }
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => openCommentDrawer(transaction._id)}
                      className="w-full bg-[#4f7c82] text-white py-2 px-4 rounded text-sm hover:bg-[#3f6468] transition-colors"
                    >
                      View Comments
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium">No {filter !== "all" ? filter : ""} transactions yet</p>
          <p className="text-sm mt-1">
            {/* {filter === "all" 
              ? "Earnings will appear here when students purchase your playlists."
              : `No ${filter} payments to display.`
            } */}
          </p>
        </div>
      )}
      
      {commentDrawer.open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCommentDrawer({ open: false, purchaseId: null, messages: [], loading: false })} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversation</h3>
              <button
                onClick={() => setCommentDrawer({ open: false, purchaseId: null, messages: [], loading: false })}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {commentDrawer.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
                </div>
              ) : commentDrawer.messages.length === 0 ? (
                <p className="text-gray-500 text-sm">No messages yet. Start the conversation.</p>
              ) : (
                commentDrawer.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${m.senderRole === "instructor" ? "bg-[#f5fafa] border-[#d9e7e9]" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="text-xs text-gray-500 mb-1 capitalize">{m.senderRole}</div>
                    <div className="text-sm text-gray-800">{m.text}</div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t">
              {commentDrawer.messages.some(m => m.senderRole === "instructor") ? (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-600 font-medium">You have already commented.</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                    placeholder="Write your message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendComment();
                      }
                    }}
                  />
                  <button
                    onClick={sendComment}
                    className="px-4 py-2 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] text-sm"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
