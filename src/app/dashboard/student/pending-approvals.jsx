"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

export default function PendingApprovals() {
  const { user } = useSelector((state) => state.auth);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingPurchases = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/payment/pending?studentId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setPendingPurchases(data.purchases || []);
        }
      } catch (error) {
        console.error("Error fetching pending purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPurchases();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingPurchases, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-6 pt-16 lg:pt-16 xl:pt-6">
        <p>Loading pending approvals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-16 lg:pt-16 xl:pt-0">
      <h2 className="lg:text-xl text-md font-medium text-black mb-2 pt-2 md:pt-1">
        Waiting for Admin Approval
      </h2>

      {pendingPurchases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg mb-2">No pending approvals</p>
          {/* <p className="text-gray-500 text-sm">
            Your approved playlists will appear in the Available Playlists section
          </p> */}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md sm:p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Playlist</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bank</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingPurchases.map((purchase) => (
                  <tr key={purchase._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900 font-medium truncate max-w-xs">
                      {purchase.playlist?.title || "Unknown Playlist"}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#4f7c82] text-right font-semibold">
                      PKR {purchase.amount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 font-mono">
                      {purchase.bankDetails?.transactionId || "N/A"}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {purchase.bankDetails?.bankName || "N/A"}
                    </td>
                    <td className="py-4 px-4 text-sm text-center">
                      <span className="inline-block px-3 py-1 rounded text-xs font-medium text-[#4f7c82]">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden ">
            {pendingPurchases.map((purchase) => (
              <div key={purchase._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-xs font-semibold  uppercase w-16">PLAYLIST:</span>
                      <span className="text-sm text-gray-600 flex-1 truncate">
                        {purchase.playlist?.title || "Unknown Playlist"}
                      </span>
                    </div>

                  </div>

                  <div className="flex items-center">
                    <span className="text-xs font-semibold uppercase w-16">AMOUNT:</span>
                    <span className="text-[13px] text-gray-600 flex-1 truncate">
                      PKR {purchase.amount?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-xs font-semibold uppercase w-16">TX ID:</span>
                    <span className="text-xs text-gray-600  flex-1 break-all">
                      {purchase.bankDetails?.transactionId || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-xs font-semibold  uppercase w-16">BANK:</span>
                    <span className="text-sm text-gray-600 flex-1 truncate">
                      {purchase.bankDetails?.bankName || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
