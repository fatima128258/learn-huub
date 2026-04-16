"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchPlaylists, deletePlaylist, updatePlaylist } from "@/store/playlist";
import { Button } from "@/components/Button";
import ConfirmToast from "@/components/ConfirmToast";
import Toast from "@/components/Toast";

export default function MyCourses({ defaultFilter = "all", onAddPlaylist, navigatingToAddPlaylist = false }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { playlists, loading, error } = useSelector((state) => state.playlist);
  const [deletingId, setDeletingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(defaultFilter);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [editingQuizData, setEditingQuizData] = useState(null);
  const [quizSaveCallback, setQuizSaveCallback] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [playingId, setPlayingId] = useState(null); // For play button loading
  const [editingId, setEditingId] = useState(null); // For edit button loading
  const [viewedRejections, setViewedRejections] = useState(() => {
    // Load viewed rejections from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('viewedRejections');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const handleEdit = (playlist) => {
    setEditingId(playlist._id);
    router.push(`/dashboard/instructor/edit-playlist/${playlist._id}`);
  };

  const handleDelete = async (playlistId) => {
    setPlaylistToDelete(playlistId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!playlistToDelete) return;

    const userId = user?.id || user?._id;
    if (!userId) return;

    setDeletingId(playlistToDelete);
    setShowDeleteConfirm(false);

    try {
      await dispatch(deletePlaylist({ playlistId: playlistToDelete, instructorId: userId })).unwrap();
      setToastMessage("Playlist deleted successfully!");
      setShowToast(true);
    } catch (err) {
      setToastMessage(err || "Failed to delete playlist");
      setShowToast(true);
    } finally {
      setDeletingId(null);
      setPlaylistToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPlaylistToDelete(null);
  };


  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId) {
      dispatch(fetchPlaylists(userId));
    }
  }, [user?.id, user?._id, dispatch]);

  // Clean up viewedRejections - remove IDs that no longer exist in playlists
  useEffect(() => {
    if (playlists.length > 0 && viewedRejections.length > 0) {
      const allPlaylistIds = playlists.map(p => p._id);
      const cleanedViewedRejections = viewedRejections.filter(id => allPlaylistIds.includes(id));
      
      // Only update if something changed
      if (cleanedViewedRejections.length !== viewedRejections.length) {
        setViewedRejections(cleanedViewedRejections);
        if (typeof window !== 'undefined') {
          localStorage.setItem('viewedRejections', JSON.stringify(cleanedViewedRejections));
        }
      }
    }
  }, [playlists]);

  useEffect(() => {
    setStatusFilter(defaultFilter);
  }, [defaultFilter]);

  // Calculate unread rejections count
  const rejectedPlaylists = playlists.filter(p => p.status === 'rejected');
  const unreadRejectionsCount = rejectedPlaylists.filter(
    p => !viewedRejections.includes(p._id)
  ).length;

  // Debug: Log the counts
  useEffect(() => {
    console.log('Rejected playlists:', rejectedPlaylists.map(p => ({ id: p._id, title: p.title })));
    console.log('Viewed rejections:', viewedRejections);
    console.log('Unread count:', unreadRejectionsCount);
  }, [rejectedPlaylists.length, viewedRejections.length, unreadRejectionsCount]);

  // Mark rejections as viewed when Rejected tab is clicked
  const handleRejectedTabClick = () => {
    setStatusFilter('rejected');
    const rejectedIds = rejectedPlaylists.map(p => p._id);
    // Merge with existing viewed rejections to keep history
    const updatedViewedRejections = [...new Set([...viewedRejections, ...rejectedIds])];
    setViewedRejections(updatedViewedRejections);
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewedRejections', JSON.stringify(updatedViewedRejections));
    }
  };

  const filteredPlaylists = playlists.filter((playlist) => {
    if (statusFilter === "all") return true;
    return playlist.status === statusFilter;
  });

  if (loading && playlists.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-6 mt-4">
        <p>Loading playlists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 tracking-tight pt-20 md:pt-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">My Courses</h2>
        {onAddPlaylist && (
          <Button
            className="bg-[#4f7c82] text-white hover:bg-[#3f6468] disabled:opacity-50"
            onClick={onAddPlaylist}
            disabled={navigatingToAddPlaylist}
          >
            {navigatingToAddPlaylist ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </span>
            ) : (
              "+ Add Playlist"
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        
        {defaultFilter === "all" && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "all"
                    ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "pending"
                    ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "approved"
                    ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Approved
              </button>
              <button
                onClick={handleRejectedTabClick}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap relative ${
                  statusFilter === "rejected"
                    ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  Rejected
                  {unreadRejectionsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadRejectionsCount}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

       
        <div className="p-6">
          {filteredPlaylists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {playlists.length === 0
                  ? "You haven't uploaded any playlists yet."
                  : `No ${statusFilter !== "all" ? statusFilter : ""} playlists found.`}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price (PKR)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Viewers</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlaylists.map((playlist) => (
                      <tr key={playlist._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-800">{playlist.title}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700 text-right font-medium">
                          {playlist.price?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700 text-center">
                          {playlist.totalViewers || 0}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold  ${playlist.status === "approved"
                              ? "text-[#4f7c82] "
                              : playlist.status === "rejected"
                                ? "text-red-800 b"
                                : "text-black"
                              }`}
                          >
                            {playlist.status?.toUpperCase() || "PENDING"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-600">
                          {new Date(playlist.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                           
                            <button
                              onClick={() => {
                                setPlayingId(playlist._id);
                                router.push(`/dashboard/instructor/playlist/${playlist._id}`);
                              }}
                              disabled={
                                ((!playlist.videos || playlist.videos.length === 0) &&
                                  (!playlist.content || playlist.content.length === 0)) ||
                                playingId === playlist._id
                              }
                              className="p-1.5 bg-[#4f7c82] text-white rounded hover:bg-[#3d7680] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Play Content"
                            >
                              {playingId === playlist._id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>
                            

                            {(playlist.status === "approved" || playlist.status === "pending" || playlist.status === "rejected") && (
                              <>
                                <button
                                  onClick={() => handleEdit(playlist)}
                                  disabled={loading || editingId === playlist._id}
                                  className="p-1.5 bg-black text-white  rounded transition-colors disabled:opacity-50"
                                  title="Edit Playlist"
                                >
                                  {editingId === playlist._id ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  )}
                                </button>
                                
                               
                                <button
                                  onClick={() => handleDelete(playlist._id)}
                                  disabled={deletingId === playlist._id || loading}
                                  className="p-1.5 bg-black text-white   rounded transition-colors disabled:opacity-50"
                                  title="Delete Playlist"
                                >
                                  {deletingId === playlist._id ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              </>
                            )}
                            
                            {playlist.status === "rejected" && (
                              <button
                                onClick={() => {
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
                                  modal.innerHTML = `
                                    <div class="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
                                      <h3 class="text-xl font-bold  mb-4">Rejection Reason</h3>
                                      <p class="text-gray-700 text-base leading-relaxed mb-6">${playlist.rejectionReason || 'No reason provided'}</p>
                                      <button onclick="this.closest('.fixed').remove()" class="w-full px-6 py-3 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] font-medium text-base">
                                        Close
                                      </button>
                                    </div>
                                  `;
                                  document.body.appendChild(modal);
                                  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
                                }}
                                className="p-1.5 bg-[#4f7c82] text-white  hover:bg-[#3f6468] rounded transition-colors"
                                title="View Rejection Reason"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredPlaylists.map((playlist) => (
                  <div key={playlist._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                    <div className="space-y-2">
                      {/* Title */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">TITLE:</span>
                        <span className="text-sm font-medium text-gray-900 text-right">{playlist.title}</span>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">PRICE:</span>
                        <span className="text-sm text-gray-700">PKR {playlist.price?.toLocaleString() || 0}</span>
                      </div>
                      
                      {/* Viewers */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">VIEWERS:</span>
                        <span className="text-sm text-gray-700">{playlist.totalViewers || 0}</span>
                      </div>
                      
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">STATUS:</span>
                        <span
                          className={`text-sm font-semibold ${playlist.status === "approved"
                            ? "text-[#4f7c82]"
                            : playlist.status === "rejected"
                              ? "text-red-600"
                              : "text-gray-700"
                            }`}
                        >
                          {playlist.status?.toUpperCase() || "PENDING"}
                        </span>
                      </div>
                      
                      {/* Created Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">CREATED:</span>
                        <span className="text-sm text-gray-700">{new Date(playlist.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setPlayingId(playlist._id);
                            router.push(`/dashboard/instructor/playlist/${playlist._id}`);
                          }}
                          disabled={
                            ((!playlist.videos || playlist.videos.length === 0) &&
                              (!playlist.content || playlist.content.length === 0)) ||
                            playingId === playlist._id
                          }
                          className="flex-1 bg-[#4f7c82] text-white py-2 px-3 rounded text-sm hover:bg-[#3d7680] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {playingId === playlist._id ? "Loading..." : "Play"}
                        </button>

                        {(playlist.status === "approved" || playlist.status === "pending" || playlist.status === "rejected") && (
                          <>
                            <button
                              onClick={() => handleEdit(playlist)}
                              disabled={loading || editingId === playlist._id}
                              className="flex-1 bg-gray-800 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                              {editingId === playlist._id ? "Loading..." : "Edit"}
                            </button>
                            
                            <button
                              onClick={() => handleDelete(playlist._id)}
                              disabled={deletingId === playlist._id || loading}
                              className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deletingId === playlist._id ? "Deleting..." : "Delete"}
                            </button>
                          </>
                        )}
                        
                        {playlist.status === "rejected" && (
                          <button
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
                              modal.innerHTML = `
                                <div class="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
                                  <h3 class="text-xl font-bold  mb-4">Rejection Reason</h3>
                                  <p class="text-gray-700 text-base leading-relaxed mb-6">${playlist.rejectionReason || 'No reason provided'}</p>
                                  <button onclick="this.closest('.fixed').remove()" class="w-full px-6 py-3 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] font-medium text-base">
                                    Close
                                  </button>
                                </div>
                              `;
                              document.body.appendChild(modal);
                              modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
                            }}
                            className="w-full bg-[#4f7c82] text-white py-2 px-3 rounded text-sm hover:bg-[#3f6468] transition-colors"
                          >
                            View Reason
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      
      {isEditModalOpen && editingPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-4xl h-full overflow-y-auto shadow-2xl transform transition-transform duration-300 flex flex-col">
            
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Edit Playlist</h2>
                  <p className="text-sm text-gray-600">
                    Update your playlist content and information
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingPlaylist(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

           
            <div className="flex-1 overflow-y-auto p-6">
              <EditPlaylistForm
                playlist={editingPlaylist}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setEditingPlaylist(null);
                }}
                onSuccess={() => {
                  const userId = user?.id || user?._id;
                  if (userId) {
                    dispatch(fetchPlaylists(userId));
                  }
                  setIsEditModalOpen(false);
                  setEditingPlaylist(null);
                }}
                onEditQuiz={(quizData, saveCallback) => {
                  setEditingQuizData(quizData);
                  setQuizSaveCallback(() => saveCallback);
                  setShowQuizEditor(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showQuizEditor && editingQuizData && (
        <QuizEditorModal
          quizData={editingQuizData}
          onSave={(quizData) => {
            if (quizSaveCallback) {
              quizSaveCallback(quizData);
            }
            setShowQuizEditor(false);
            setEditingQuizData(null);
            setQuizSaveCallback(null);
          }}
          onClose={() => {
            setShowQuizEditor(false);
            setEditingQuizData(null);
            setQuizSaveCallback(null);
          }}
        />
      )}
      
      {showDeleteConfirm && (
        <ConfirmToast
          message="Are you sure you want to delete this playlist?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {showToast && toastMessage && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </div>
  );
}


function EditPlaylistForm({ playlist, onClose, onSuccess, onEditQuiz }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.playlist);

  const [title, setTitle] = useState(playlist.title || "");
  const [description, setDescription] = useState(playlist.description || "");
  const [price, setPrice] = useState(playlist.price ?? 0);
  const [existingContent, setExistingContent] = useState(
    JSON.parse(JSON.stringify(playlist.content || []))
  );
  const [contentSets, setContentSets] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [editingQuizIndex, setEditingQuizIndex] = useState(null);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  useEffect(() => {
    setTitle(playlist.title || "");
    setDescription(playlist.description || "");
    setPrice(playlist.price ?? 0);
  }, [playlist]);

  const handleClearExistingFile = (index) => {
    const newContent = existingContent.map((item, idx) => {
      if (idx === index) {
        return { ...item, cleared: true, newFile: null };
      }
      return item;
    });
    setExistingContent(newContent);
  };

  const handleReplaceExistingFile = (index, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const newContent = existingContent.map((item, idx) => {
        if (idx === index) {
          return { ...item, newFile: file, cleared: false };
        }
        return item;
      });
      setExistingContent(newContent);
    }
    e.target.value = "";
  };

  const handleEditQuiz = (index) => {
    const quizData = existingContent[index]?.quizData;
    const saveCallback = (updatedQuizData) => {
      const newContent = existingContent.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            quizData: updatedQuizData,
            modified: true,
          };
        }
        return item;
      });
      setExistingContent(newContent);
    };
    onEditQuiz(quizData, saveCallback);
  };

  const handleAddMoreSet = () => {
  
    const newSet = [
      { type: "video", file: null, totalMarks: null },
      { type: "lab", file: null, totalMarks: null },
      { type: "activity", file: null, totalMarks: null },
    ];
    setContentSets([...contentSets, newSet]);
  };

  const handleRemoveSet = (setIndex) => {
    setAlertDialog({
      isOpen: true,
      title: "Confirm Remove",
      message: "Are you sure you want to remove this set?",
      onConfirm: () => {
        setContentSets(contentSets.filter((_, index) => index !== setIndex));
        setAlertDialog({ isOpen: false, title: "", message: "" });
      }
    });
  };

  const handleFileSelect = (setIndex, itemIndex, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const newSets = [...contentSets];
      newSets[setIndex][itemIndex] = { ...newSets[setIndex][itemIndex], file };
      setContentSets(newSets);
    }
  };

  const handleTotalMarksChange = (setIndex, itemIndex, value) => {
    const newSets = [...contentSets];
    newSets[setIndex][itemIndex].totalMarks = parseInt(value) || null;
    setContentSets(newSets);
  };

  const handleExistingTotalMarksChange = (index, value) => {
    const newContent = existingContent.map((item, idx) => {
      if (idx === index) {
        return { ...item, totalMarks: parseInt(value) || null };
      }
      return item;
    });
    setExistingContent(newContent);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = user?.id || user?._id;
    if (!userId) return;

    const allContentItems = contentSets.flat();
    const newContent = allContentItems.filter(item => item.file);

    const updatedExistingContent = existingContent.map(item => {
      if (item.cleared && !item.newFile) {
        return null; 
      }
      return {
        ...item,
        replacementFile: item.newFile || null,
      };
    }).filter(item => item !== null);

    const contentChanged =
      existingContent.some(item => item.cleared || item.newFile || item.modified) ||
      newContent.length > 0;
    const basicInfoChanged =
      title !== playlist.title ||
      description !== playlist.description ||
      price !== playlist.price;

    if (!contentChanged && !basicInfoChanged) {
      setAlertDialog({
        isOpen: true,
        title: "No Changes",
        message: "Please make some changes to update the playlist"
      });
      return;
    }

    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append("playlistId", playlist._id);
      formData.append("instructorId", userId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);

      formData.append("existingContent", JSON.stringify(
        existingContent.map(item => ({
          _id: item._id,
          type: item.type,
          cleared: item.cleared || false,
          totalMarks: item.totalMarks,
          quizData: item.quizData,
          modified: item.modified || false,
        }))
      ));

      
      existingContent.forEach((item, index) => {
        if (item.newFile) {
          formData.append(`existing_${index}_file`, item.newFile);
          formData.append(`existing_${index}_type`, item.type);
          if (item.type === "lab" || item.type === "activity") {
            formData.append(`existing_${index}_totalMarks`, item.totalMarks || "");
          }
        }
      });

      
      newContent.forEach((item, index) => {
        formData.append(`content_${index}_type`, item.type);
        formData.append(`content_${index}_file`, item.file);
        if (item.type === "lab" || item.type === "activity") {
          formData.append(`content_${index}_totalMarks`, item.totalMarks || "");
        }
      });

      const response = await fetch("/api/playlist", {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update playlist");
      }

      setAlertDialog({
        isOpen: true,
        title: "Success",
        message: playlist.status === "pending" ? "Playlist updated successfully!" : "Playlist update submitted for admin approval!"
      });
      setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      setAlertDialog({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to update playlist"
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
          <span className="text-xs text-gray-500 ml-2">
            ({description.length}/300 characters)
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Enter playlist description (max 300 characters)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price (PKR)
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Content
        </label>

        {existingContent.length > 0 ? (
          <div className="space-y-3 mb-4">
            
            {existingContent.map((item, index) => {
              if (item.removed || item.type === "quiz") return null;
              
              const isSetStart = index % 3 === 0 || (index > 0 && existingContent[index - 1].type === "quiz");
              const setNumber = Math.floor(index / 3) + 1;
              const itemInSet = (index % 3) + 1;
              
              const startIdx = (setNumber - 1) * 3;
              const endIdx = Math.min(startIdx + 3, existingContent.length);
              const setItems = existingContent.slice(startIdx, endIdx);
              const allItemsRemoved = setItems.every(setItem => setItem.removed);

              return (
                <div key={index}>
                  {isSetStart && item.type !== "quiz" && !allItemsRemoved && (
                    <div className="flex justify-between items-center mb-2 mt-4">
                      <h4 className="font-semibold text-gray-700">Set {setNumber}</h4>
                      {existingContent.length > 3 && setNumber > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAlertDialog({
                              isOpen: true,
                              title: "Confirm Remove",
                              message: "Remove this entire set?",
                              onConfirm: () => {
                                const startIdx = (setNumber - 1) * 3;
                                const endIdx = Math.min(startIdx + 3, existingContent.length);
                                const newContent = existingContent.map((item, idx) => {
                                  if (idx >= startIdx && idx < endIdx) {
                                    return { ...item, removed: true };
                                  }
                                  return item;
                                });
                                setExistingContent(newContent);
                                setAlertDialog({ isOpen: false, title: "", message: "" });
                              }
                            });
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          ✕ Remove Set
                        </button>
                      )}
                    </div>
                  )}

                  {!item.removed && (
                    <div className="p-3 border border-gray-200 rounded-lg bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {item.type === "quiz" ? "Quiz" : `${itemInSet}. ${item.type}`}
                          </span>
                          {/* {!item.cleared && (
                            <span className="text-xs bg-green-100 text-gray-700 px-2 py-1 rounded">
                              ✓ Uploaded
                            </span>
                          )} */}
                        </div>
                        {!item.cleared && item.type !== "quiz" && (
                          <button
                            type="button"
                            onClick={() => handleClearExistingFile(index)}
                            className="text-red-500 hover:text-red-700"
                            title="Clear this file"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {item.type === "quiz" ? (
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Quiz: {item.quizData?.mcqs?.length || 0} questions
                          </p>
                          <button
                            type="button"
                            onClick={() => handleEditQuiz(index)}
                            className="px-3 py-2 text-sm bg-[#4f7c82] text-white rounded font-medium"
                          >
                            Edit Quiz
                          </button>
                        </div>
                      ) : item.cleared ? (
                        <>
                          {/* <div className="bg-yellow-50 p-3 rounded mb-2 border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              File cleared. Please upload a new {item.type} file.
                            </p>
                          </div> */}
                          <input
                            type="file"
                            onChange={(e) => handleReplaceExistingFile(index, e)}
                            accept={item.type === "video" ? "video/*" : "*/*"}
                            className="w-full text-sm"
                            required
                          />
                          {(item.type === "lab" || item.type === "activity") && (
                            <div className="mt-2">
                              <label className="block text-xs text-gray-600 mb-1">Total Marks *</label>
                              <input
                                type="number"
                                placeholder="Enter total marks"
                                value={item.totalMarks || ""}
                                onChange={(e) => handleExistingTotalMarksChange(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="bg-gray-50 p-2 rounded border border-gray-200">
                              <p className="text-xs text-gray-600 font-medium mb-1">Current file:</p>
                              <p className="text-sm text-gray-900 truncate">{item.originalName}</p>
                              {item.size && (
                                <p className="text-xs text-gray-500">{(item.size / 1024).toFixed(2)} KB</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 font-medium mb-1">Replace file </label>
                              <input
                                type="file"
                                onChange={(e) => handleReplaceExistingFile(index, e)}
                                accept={item.type === "video" ? "video/*" : "*/*"}
                                className="w-full text-sm"
                              />
                              {item.newFile && (
                                <p className="text-xs text-[#4f7c82] mt-1 truncate"> {item.newFile.name}</p>
                              )}
                            </div>
                          </div>

                          {(item.type === "lab" || item.type === "activity") && (
                            <div className="mt-2">
                              <label className="block text-xs text-gray-600 mb-1">Total Marks *</label>
                              <input
                                type="number"
                                placeholder="Enter total marks"
                                value={item.totalMarks || ""}
                                onChange={(e) => handleExistingTotalMarksChange(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
           
            {existingContent.some(item => item.type === "quiz" && !item.removed) && (
              <div className="my-4">
                <button
                  type="button"
                  onClick={() => {
                    const newSet = [
                      { type: "video", file: null, totalMarks: null },
                      { type: "lab", file: null, totalMarks: null },
                      { type: "activity", file: null, totalMarks: null },
                    ];
                    setContentSets([...contentSets, newSet]);
                  }}
                  className="w-full py-3 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] font-medium transition-colors"
                >
                  + Add Set Before Quiz
                </button>
              </div>
            )}

            
            {contentSets.map((set, setIndex) => (
              <div key={setIndex} className="mb-4 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-700">New Set {setIndex + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(setIndex)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    ✕ Remove Set
                  </button>
                </div>

                {set.map((item, itemIndex) => (
                  <div key={itemIndex} className="mb-3 p-3 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {itemIndex + 1}. {item.type}
                        {item.file && <span className="ml-2 text-xs text-[#4f7c82]"> Uploaded</span>}
                      </span>
                    </div>

                    <input
                      type="file"
                      onChange={(e) => handleFileSelect(setIndex, itemIndex, e)}
                      accept={item.type === "video" ? "video/*" : "*/*"}
                      className="w-full text-sm mb-2"
                    />

                    {item.file && (
                      <p className="text-xs text-gray-600 mb-2">📎 {item.file.name}</p>
                    )}

                    {(item.type === "lab" || item.type === "activity") && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Total Marks </label>
                        <input
                          type="number"
                          placeholder="Enter total marks"
                          value={item.totalMarks || ""}
                          onChange={(e) => handleTotalMarksChange(setIndex, itemIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          required={!!item.file}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            
            {existingContent.map((item, index) => {
              if (item.removed || item.type !== "quiz") return null;
              
              return (
                <div key={index} className="mb-3 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Quiz: {item.quizData?.mcqs?.length || 0} questions
                    </p>
                    <button
                      type="button"
                      onClick={() => handleEditQuiz(index)}
                      className="px-4 py-2 bg-[#4f7c82] text-white rounded hover:bg-[#3d6166] text-sm"
                    >
                      Edit Quiz
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No content uploaded yet</p>
        )}
      </div>

      {!existingContent.some(item => item.type === "quiz" && !item.removed) && (
        <button
          type="button"
          onClick={handleAddMoreSet}
          className="w-full py-3 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] font-medium transition-colors mt-4"
        >
           Add More
        </button>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={updating || loading}
          className="flex-1 bg-[4f7c82] text-white "
        >
          {updating ? "Updating..." : (playlist.status === "pending" ? "Update Playlist" : "Submit for Approval")}
        </Button>
        <Button
          type="button"
          onClick={onClose}
          variant="secondary"
          disabled={updating || loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>

    <ConfirmDialog
      isOpen={alertDialog.isOpen}
      title={alertDialog.title}
      message={alertDialog.message}
      onConfirm={alertDialog.onConfirm || (() => setAlertDialog({ isOpen: false, title: "", message: "", onConfirm: null }))}
      onCancel={() => setAlertDialog({ isOpen: false, title: "", message: "", onConfirm: null })}
      confirmText={alertDialog.onConfirm ? "Confirm" : "OK"}
      confirmColor={alertDialog.title === "Error" ? "bg-red-600" : "bg-[#4f7c82]"}
    />
    </>
  );
}


function QuizEditorModal({ quizData, onSave, onClose }) {
  const [mcqs, setMcqs] = useState(quizData?.mcqs || []);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: "", message: "" });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: "", onConfirm: null });

  const handleAddMCQ = () => {
    setMcqs([
      ...mcqs,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const handleRemoveMCQ = (index) => {
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this question?",
      onConfirm: () => {
        setMcqs(mcqs.filter((_, i) => i !== index));
        setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
      }
    });
  };

  const handleQuestionChange = (index, value) => {
    const newMcqs = [...mcqs];
    newMcqs[index].question = value;
    setMcqs(newMcqs);
  };

  const handleOptionChange = (mcqIndex, optionIndex, value) => {
    const newMcqs = [...mcqs];
    newMcqs[mcqIndex].options[optionIndex] = value;
    setMcqs(newMcqs);
  };

  const handleCorrectAnswerChange = (mcqIndex, optionIndex) => {
    const newMcqs = [...mcqs];
    newMcqs[mcqIndex].correctAnswer = optionIndex;
    setMcqs(newMcqs);
  };

  const handleSave = () => {
    if (mcqs.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: "Validation Error",
        message: "Please add at least one question"
      });
      return;
    }

    for (let i = 0; i < mcqs.length; i++) {
      if (!mcqs[i].question.trim()) {
        setAlertDialog({
          isOpen: true,
          title: "Validation Error",
          message: `Question ${i + 1} is empty`
        });
        return;
      }
      for (let j = 0; j < mcqs[i].options.length; j++) {
        if (!mcqs[i].options[j].trim()) {
          setAlertDialog({
            isOpen: true,
            title: "Validation Error",
            message: `Question ${i + 1}, Option ${j + 1} is empty`
          });
          return;
        }
      }
    }

    onSave({ mcqs });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Edit Quiz</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 mb-4">
            {mcqs.map((mcq, mcqIndex) => (
              <div key={mcqIndex} className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-700">Question {mcqIndex + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveMCQ(mcqIndex)}
                    className=" font-medium"
                  >
                     Delete
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={mcq.question}
                    onChange={(e) => handleQuestionChange(mcqIndex, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                    placeholder="Enter question"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  {mcq.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${mcqIndex}`}
                        checked={mcq.correctAnswer === optionIndex}
                        onChange={() => handleCorrectAnswerChange(mcqIndex, optionIndex)}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(mcqIndex, optionIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    </div>
                  ))}
                 
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddMCQ}
            className="w-full py-2 bg-black text-white rounded-lg  font-medium mb-4"
          >
            + Add Question
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 bg-[#4f7c82] text-white rounded-lg  font-medium"
            >
              Save Quiz
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        onConfirm={() => setAlertDialog({ isOpen: false, title: "", message: "" })}
        onCancel={() => setAlertDialog({ isOpen: false, title: "", message: "" })}
        confirmText="OK"
        confirmColor="bg-red-600"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Delete"
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: "", onConfirm: null })}
        confirmText="Delete"
        confirmColor="bg-red-600"
      />
    </div>
  );
}
