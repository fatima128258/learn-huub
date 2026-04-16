"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import AlertModal from "@/components/AlertModal";
import { useAlert } from "@/components/usealert";
import Toast from "@/components/Toast";

export default function AdminBalance() {
  const { user } = useSelector((state) => state.auth);
  const { alertState, hideAlert, showError, showConfirm } = useAlert();
  const [balance, setBalance] = useState({
    totalRevenue: 0,
    adminShare: 0,
    pendingPayments: 0,
    availableBalance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingPayment, setApprovingPayment] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [commentModal, setCommentModal] = useState({ open: false, purchaseId: null, messages: [], loading: false });
  const [replyText, setReplyText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchBalance = async () => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/balance?adminId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions);
        console.log("Transactions loaded:", data.transactions);
        console.log("Pending transactions:", data.transactions.filter(t => !t.studentApproved));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (purchaseId, approvalType) => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    setApprovingPayment(`${purchaseId}-${approvalType}`);
    try {
      const response = await fetch("/api/admin/balance/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: userId,
          purchaseId: purchaseId,
          approvalType: approvalType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToastMessage(data.message || "Payment approved successfully");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      
        fetchBalance();
      } else {
        showError(data.message || "Failed to approve payment");
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      showError("Failed to approve payment. Please try again.");
    } finally {
      setApprovingPayment(null);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  const openComments = async (purchaseId) => {
    const userId = user?.id || user?._id;
    if (!userId || !purchaseId) return;
    try {
      setCommentModal({ open: true, purchaseId, messages: [], loading: true });
      const res = await fetch(`/api/admin/balance-comments?adminId=${userId}&purchaseId=${purchaseId}`);
      const data = await res.json();
      if (data.success && data.thread) {
        setCommentModal({ open: true, purchaseId, messages: data.thread.messages || [], loading: false });
      } else {
        setCommentModal({ open: true, purchaseId, messages: [], loading: false });
      }
    } catch (e) {
      console.error("Load thread error:", e);
      setCommentModal({ open: true, purchaseId, messages: [], loading: false });
    }
  };

  const sendReply = async () => {
    const userId = user?.id || user?._id;
    if (!userId || !commentModal.purchaseId || !replyText.trim()) return;
    try {
      const res = await fetch("/api/admin/balance-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: userId,
          purchaseId: commentModal.purchaseId,
          text: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.thread) {
        setCommentModal((s) => ({ ...s, messages: data.thread.messages || [] }));
        setReplyText("");
      }
    } catch (e) {
      console.error("Reply error:", e);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    switch (activeTab) {
      case "pending":
        return !transaction.studentApproved || !transaction.instructorPaid;
      case "approved":
        return transaction.studentApproved && transaction.instructorPaid;
      case "all":
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-6 mt-4 pt-24 xs:pt-28 sm:pt-6">
        <p className="text-xs xs:text-sm sm:text-base">Loading balance...</p>
      </div>
    );
  }

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
  ];

  return (
    <div className="space-y-6 pt-16 xl:pt-0">
      {showToast && toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => {
            setShowToast(false);
            setToastMessage("");
          }}
        />
      )}
   
      {/* Responsive Tabs */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        {/* Mobile: Button Layout */}
        <div className="lg:hidden grid grid-cols-3 gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-[#4f7c82] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop: Tab Layout */}
        <div className="hidden lg:flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-4">Transaction History</h2>
        
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-white">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 w-40 whitespace-nowrap">Date & Time</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 w-28 whitespace-nowrap">Student</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 w-32 whitespace-nowrap">Playlist</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 w-28 whitespace-nowrap">Instructor</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 w-24 whitespace-nowrap">Transaction ID</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-700 w-24 whitespace-nowrap">Total Amount</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-700 w-24 whitespace-nowrap">Admin Share</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-700 w-28 whitespace-nowrap">Instructor Share</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-700 w-32 whitespace-nowrap">Status</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-700 w-40 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-3 text-xs text-gray-700 w-40">
                        {new Date(transaction.purchaseDate).toLocaleDateString()} {new Date(transaction.purchaseDate).toLocaleTimeString()}
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-700 truncate">
                        {transaction.student.name}
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-700 truncate">
                        {transaction.playlist.title}
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-700 truncate">
                        {transaction.playlist.instructor.name}
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-700 font-mono truncate">
                        {transaction.transactionId}
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-700 text-right font-medium">
                        PKR {transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-xs text-[#4f7c82] text-right font-medium">
                        PKR {transaction.adminShare.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-700 text-right">
                        PKR {transaction.instructorShare.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-xs text-center">
                        {transaction.studentApproved && transaction.instructorPaid ? (
                          <span className="inline-block  text-[#4f7c82] px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                            Completed
                          </span>
                        ) : transaction.studentApproved ? (
                          <span className="inline-block  text-gray-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-block  text-gray-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-xs text-center">
                        <div className="flex flex-col gap-1.5">
                          {!transaction.studentApproved && (
                            <button
                              onClick={() => handleApprovePayment(transaction._id, "student")}
                              disabled={approvingPayment === `${transaction._id}-student`}
                              className="px-2 py-1 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs whitespace-nowrap"
                            >
                              {approvingPayment === `${transaction._id}-student` ? "Approving..." : "Approve Student"}
                            </button>
                          )}
                          {transaction.studentApproved && !transaction.instructorPaid && (
                            <button
                              onClick={() => handleApprovePayment(transaction._id, "instructor")}
                              disabled={approvingPayment === `${transaction._id}-instructor`}
                              className="px-2 py-1 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs whitespace-nowrap"
                            >
                              {approvingPayment === `${transaction._id}-instructor` ? "Paying..." : "Approve Instructor"}
                            </button>
                          )}
                          {transaction.studentApproved && transaction.instructorPaid && (
                            <div className="text-[#4f7c82] font-semibold text-xs py-1"> All Approved</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  <div className="space-y-2">
                    {/* Date */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-black uppercase">DATE:</span>
                      <span className="text-sm text-gray-600">
                        {new Date(transaction.purchaseDate).toLocaleDateString()}, {new Date(transaction.purchaseDate).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {/* Student */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-black uppercase">STUDENT:</span>
                      <span className="text-sm text-gray-600">{transaction.student.name}</span>
                    </div>
                    
                    {/* Playlist */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-black uppercase flex-shrink-0">PLAYLIST:</span>
                      <span className="text-sm text-gray-600 text-right truncate">{transaction.playlist.title}</span>
                    </div>
                    
                    {/* Instructor */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-black uppercase">INSTRUCTOR:</span>
                      <span className="text-sm text-gray-600">{transaction.playlist.instructor.name}</span>
                    </div>
                    
                    {/* Transaction ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-black uppercase">TX ID:</span>
                      <span className="text-xs text-gray-600 font-mono">{transaction.transactionId}</span>
                    </div>

                    {/* Financial Details */}
                    <div className="pt-2 border-t border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-black uppercase">TOTAL:</span>
                        <span className="text-sm text-gray-600">PKR {transaction.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-black uppercase">ADMIN:</span>
                        <span className="text-sm text-[#4f7c82]">PKR {transaction.adminShare.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-black uppercase">INSTRUCTOR:</span>
                        <span className="text-sm text-gray-600">PKR {transaction.instructorShare.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                      {!transaction.studentApproved && (
                        <button
                          onClick={() => handleApprovePayment(transaction._id, "student")}
                          disabled={approvingPayment === `${transaction._id}-student`}
                          className="w-full bg-[#4f7c82] text-white hover:bg-[#3f6468] disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2 px-4 rounded-md transition-colors duration-200"
                        >
                          {approvingPayment === `${transaction._id}-student` ? "Approving..." : "Approve Student"}
                        </button>
                      )}
                      {transaction.studentApproved && !transaction.instructorPaid && (
                        <button
                          onClick={() => handleApprovePayment(transaction._id, "instructor")}
                          disabled={approvingPayment === `${transaction._id}-instructor`}
                          className="w-full bg-[#4f7c82] text-white hover:bg-[#3f6468] disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2 px-4 rounded-md transition-colors duration-200"
                        >
                          {approvingPayment === `${transaction._id}-instructor` ? "Paying..." : "Approve Instructor"}
                        </button>
                      )}
                      {transaction.studentApproved && transaction.instructorPaid && (
                        <div className="text-center py-2">
                          <span className="text-[#4f7c82] font-semibold text-sm">All Approved</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        showCancel={alertState.showCancel}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
      />

      {commentModal.open && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCommentModal({ open: false, purchaseId: null, messages: [], loading: false })} />
          <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Balance Comments</h3>
              <button
                onClick={() => setCommentModal({ open: false, purchaseId: null, messages: [], loading: false })}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3">
              {commentModal.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
                </div>
              ) : commentModal.messages.length === 0 ? (
                <p className="text-gray-500 text-sm">No messages yet.</p>
              ) : (
                commentModal.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${m.senderRole === "admin" ? "bg-[#f5fafa] border-[#d9e7e9]" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="text-xs text-gray-500 mb-1 capitalize">{m.senderRole}</div>
                    <div className="text-sm text-gray-800">{m.text}</div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  placeholder="Write a reply..."
                />
                <button
                  onClick={sendReply}
                  className="px-4 py-2 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

