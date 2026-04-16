
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchAllPlaylists, reviewPlaylist } from "@/store/playlist";
import { Button } from "@/components/Button";

export default function AdminPlaylists({ defaultFilter = "all" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { allPlaylists, loading, error } = useSelector((state) => state.playlist);
  
  const [statusFilter, setStatusFilter] = useState(defaultFilter);
  const [rejectingId, setRejectingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(null);
  const [playingId, setPlayingId] = useState(null); // For play button loading
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // For 3-dots menu in mobile cards

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId) {
      dispatch(fetchAllPlaylists({ adminId: userId, status: statusFilter }));
    }
  }, [user?.id, user?._id, dispatch, statusFilter]);

  // Update filter when defaultFilter prop changes
  useEffect(() => {
    setStatusFilter(defaultFilter);
  }, [defaultFilter]);

  const handleApprove = async (playlistId) => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    setApprovingId(playlistId);
    try {
      await dispatch(
        reviewPlaylist({
          playlistId,
          adminId: userId,
          action: "approve",
        })
      ).unwrap();
      // Refetch playlists
      dispatch(fetchAllPlaylists({ adminId: userId, status: statusFilter }));
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (playlistId) => {
    if (!rejectionReason.trim()) {
      return;
    }

    const userId = user?.id || user?._id;
    if (!userId) return;

    setRejectingId(playlistId);
    try {
      await dispatch(
        reviewPlaylist({
          playlistId,
          adminId: userId,
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        })
      ).unwrap();
      // Refetch playlists
      dispatch(fetchAllPlaylists({ adminId: userId, status: statusFilter }));
      setShowRejectModal(null);
      setRejectionReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setRejectingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: " text-black",
      approved: "text-black",
      rejected: "text-black",
    };
    return badges[status] || badges.pending;
  };

  if (loading && allPlaylists.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-4 sm:p-6 mt-4 pt-20 lg:pt-6">
        <p className="text-sm sm:text-base">Loading playlists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 pt-16 xl:pt-0">
      <div className="flex justify-between items-center">
        <h2 className="text-base sm:text-lg lg:text-2xl font-semibold text-gray-800">Playlist Management</h2>
      </div>

      {error && (
        <div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}


      <div className="bg-white rounded-lg shadow-md">
        {/* Mobile & Desktop: Tab Layout */}
        <div className="p-2 sm:p-4 border-b border-gray-200">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === "all"
                  ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === "pending"
                  ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === "approved"
                  ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === "rejected"
                  ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

       
        <div className="p-4 sm:p-6">
          {allPlaylists.length === 0 ? (
            <div className="text-center py-8 pt-16 lg:pt-8">
              <p className="text-sm sm:text-base text-gray-600">
                No {statusFilter !== "all" ? statusFilter : ""} playlists found.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Instructor</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price (PKR)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Viewers</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPlaylists.map((playlist) => (
                      <tr key={playlist._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-800 truncate max-w-xs">{playlist.title}</p>
                          {playlist.rejectionReason && (
                            <p className="text-xs text-gray-600 mt-1">
                              <strong>Reason:</strong> {playlist.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700">
                          {playlist.instructor?.name || "Unknown"}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700 text-right font-medium">
                          {playlist.price?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700 text-center">
                          {playlist.totalViewers || 0}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                              playlist.status
                            )}`}
                          >
                            {playlist.status?.toUpperCase() || "PENDING"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-600">
                          {new Date(playlist.createdAt).toLocaleDateString()}
                          <br />
                          {new Date(playlist.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => {
                                setPlayingId(playlist._id);
                                router.push(`/dashboard/admin/playlist/${playlist._id}`);
                              }}
                              className="bg-[#4f7c82] text-white hover:bg-[#3d7680] text-xs px-3 py-1 min-w-[60px]"
                              disabled={
                                ((!playlist.videos || playlist.videos.length === 0) &&
                                  (!playlist.content || playlist.content.length === 0)) ||
                                playingId === playlist._id
                              }
                            >
                              {playingId === playlist._id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              ) : (
                                "Play"
                              )}
                            </Button>
                            
                            {playlist.status === "pending" && (
                              <>
                                <Button
                                  onClick={() => handleApprove(playlist._id)}
                                  className="bg-[#4f7c82] text-white hover:bg-[#3d7680] text-xs px-3 py-1"
                                  disabled={approvingId === playlist._id || loading}
                                >
                                  {approvingId === playlist._id ? "..." : "✓"}
                                </Button>
                                <Button
                                  onClick={() => setShowRejectModal(playlist._id)}
                                  className="bg-[#4f7c82] text-white hover:bg-[#3d7680] text-xs px-3 py-1"
                                  disabled={rejectingId === playlist._id || loading}
                                >
                                  ✕
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPlaylists.map((playlist, index) => {
                  const isMenuOpen = openMenuIndex === index;
                  
                  return (
                    <div key={playlist._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                      <div className="space-y-3">
                        {/* Title with 3 dots */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-black flex-1">{playlist.title}</h3>
                          
                          {/* 3 Dots Menu - Only for pending and rejected playlists */}
                          {(playlist.status === "pending" || (playlist.status === "rejected" && playlist.rejectionReason)) && (
                            <div className="relative flex-shrink-0">
                              <button
                                onClick={() => setOpenMenuIndex(isMenuOpen ? null : index)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="5" r="2"/>
                                  <circle cx="12" cy="12" r="2"/>
                                  <circle cx="12" cy="19" r="2"/>
                                </svg>
                              </button>

                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setOpenMenuIndex(null)}
                                  />
                                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                                    {/* Pending playlist actions */}
                                    {playlist.status === "pending" && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setOpenMenuIndex(null);
                                            handleApprove(playlist._id);
                                          }}
                                          disabled={approvingId === playlist._id || loading}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          {approvingId === playlist._id ? "Approving..." : "Approve"}
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            setOpenMenuIndex(null);
                                            setShowRejectModal(playlist._id);
                                          }}
                                          disabled={rejectingId === playlist._id || loading}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    
                                    {/* Rejected playlist - View Reason */}
                                    {playlist.status === "rejected" && playlist.rejectionReason && (
                                      <button
                                        onClick={() => {
                                          setOpenMenuIndex(null);
                                          setShowReasonModal(playlist);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs tracking-tight text-gray-700 hover:bg-gray-100"
                                      >
                                        View Reason
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Instructor and Price */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Instructor:</p>
                            <p className="text-xs sm:text-sm text-gray-600 flex-1 text-right break-words">{playlist.instructor?.name || "Unknown"}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Price (PKR):</p>
                            <p className="text-xs sm:text-sm text-gray-600 flex-1 text-right">{playlist.price?.toLocaleString() || 0}</p>
                          </div>
                        </div>

                      {/* Viewers and Status */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Viewers:</p>
                          <p className="text-xs sm:text-sm text-gray-600 flex-1 text-right">{playlist.totalViewers || 0}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Status:</p>
                          <p className={`text-xs sm:text-sm flex-1 text-right ${
                            playlist.status === "approved" 
                              ? "text-[#4f7c82]" 
                              : playlist.status === "rejected" 
                                ? "text-red-600" 
                                : "text-gray-700"
                          }`}>
                            {playlist.status?.toUpperCase() || "PENDING"}
                          </p>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-start gap-2">
                        <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Created:</p>
                        <p className="text-xs text-gray-600 flex-1 text-right">
                          {new Date(playlist.createdAt).toLocaleDateString()}, {new Date(playlist.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      {/* Play Button */}
                      <div className="pt-2 border-t border-gray-200">
                        <Button
                          onClick={() => {
                            setPlayingId(playlist._id);
                            router.push(`/dashboard/admin/playlist/${playlist._id}`);
                          }}
                          className="w-full bg-[#4f7c82] text-white hover:bg-[#3d7680] text-sm py-2 px-4 rounded-md transition-colors duration-200"
                          disabled={
                            ((!playlist.videos || playlist.videos.length === 0) &&
                              (!playlist.content || playlist.content.length === 0)) ||
                            playingId === playlist._id
                          }
                        >
                          {playingId === playlist._id ? (
                            <div className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </div>
                          ) : (
                            "Play"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowRejectModal(null);
            setRejectionReason("");
          }} />
          <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reject Playlist</h3>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this playlist:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
                rows={6}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="p-4 border-t flex gap-3">
              <Button
                onClick={() => handleReject(showRejectModal)}
                className="bg-[#4f7c82] text-white flex-1"
                disabled={!rejectionReason.trim() || rejectingId === showRejectModal}
              >
                {rejectingId === showRejectModal ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason("");
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReasonModal(null)} />
          <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rejection Reason</h3>
              <button
                onClick={() => setShowReasonModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {showReasonModal.rejectionReason}
                </p>
              </div>
            </div>
            <div className="p-4 border-t">
              <Button
                onClick={() => setShowReasonModal(null)}
                className="bg-[#4f7c82] hover:bg-[#3f6468] text-white w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

