"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function AdminReplies() {
  const { user } = useSelector((state) => state.auth);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState({ open: false, purchaseId: null, messages: [], loading: false });

  useEffect(() => {
    const fetchReplies = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;
      try {
        setLoading(false); // Set loading false immediately to show UI
        const res = await fetch(`/api/instructor/balance-comments?instructorId=${userId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.threads)) {
          const onlyAdminMsgs = data.threads
            .map((t) => ({
              _id: t._id,
              purchase: t.purchase,
              messages: (t.messages || []).filter((m) => m.senderRole === "admin"),
              updatedAt: t.updatedAt,
            }))
            .filter((t) => t.messages.length > 0)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          setThreads(onlyAdminMsgs);
        } else {
          setThreads([]);
        }
      } catch (e) {
        console.error("Load admin replies error:", e);
        setLoading(false);
      }
    };
    fetchReplies();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const openThread = async (purchaseId) => {
    const userId = user?.id || user?._id;
    if (!userId || !purchaseId) return;
    try {
      setDrawer({ open: true, purchaseId, loading: true, messages: [] });
      const res = await fetch(`/api/instructor/balance-comments?instructorId=${userId}&purchaseId=${purchaseId}`);
      const data = await res.json();
      if (data.success && data.thread) {
        setDrawer({ open: true, purchaseId, loading: false, messages: data.thread.messages || [] });
      } else {
        setDrawer({ open: true, purchaseId, loading: false, messages: [] });
      }
    } catch (e) {
      console.error("Load conversation error:", e);
      setDrawer({ open: true, purchaseId, loading: false, messages: [] });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Replies</h2>
      {threads.length === 0 ? (
        <p className="text-gray-500">No replies from admin yet.</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Playlist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {threads.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {t?.purchase?.playlist?.title || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(t.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => openThread(t.purchase?._id)}
                          className="px-3 py-1.5 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={async () => {
                            const userId = user?.id || user?._id;
                            if (!userId) return;
                            const res = await fetch(`/api/instructor/balance-comments?instructorId=${userId}&purchaseId=${t.purchase?._id}`, { method: "DELETE" });
                            const data = await res.json();
                            if (data.success) {
                              setThreads(prev => prev.filter(x => x._id !== t._id));
                            }
                          }}
                          className="px-3 py-1.5 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {threads.map((t) => (
              <div key={t._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="space-y-2">
                  {/* Playlist */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">PLAYLIST:</span>
                    <span className="text-sm text-gray-900 text-right">{t?.purchase?.playlist?.title || "—"}</span>
                  </div>
                  
                  {/* Updated */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">UPDATED:</span>
                    <span className="text-sm text-gray-700">{new Date(t.updatedAt).toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => openThread(t.purchase?._id)}
                      className="flex-1 bg-[#4f7c82] text-white py-2 px-4 rounded text-sm hover:bg-[#3f6468] transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        const userId = user?.id || user?._id;
                        if (!userId) return;
                        const res = await fetch(`/api/instructor/balance-comments?instructorId=${userId}&purchaseId=${t.purchase?._id}`, { method: "DELETE" });
                        const data = await res.json();
                        if (data.success) {
                          setThreads(prev => prev.filter(x => x._id !== t._id));
                        }
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {drawer.open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer({ open: false, purchaseId: null, messages: [], loading: false })} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversation</h3>
              <button
                onClick={() => setDrawer({ open: false, purchaseId: null, messages: [], loading: false })}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawer.loading ? (
                <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
              ) : drawer.messages.length === 0 ? (
                <p className="text-gray-500 text-sm">No messages.</p>
              ) : (
                drawer.messages.map((m, idx) => (
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
          </div>
        </div>
      )}
    </div>
  );
}
