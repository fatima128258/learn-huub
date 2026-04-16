"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import { fetchPlaylists } from "@/store/playlist";
import Toast from "@/components/Toast";
import ConfirmToast from "@/components/ConfirmToast";
import QuizBuilder from "@/components/QuizBuilder";

export default function EditPlaylistPage() {
  const router = useRouter();
  const params = useParams();
  const playlistId = params.id;
  
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { playlists } = useSelector((state) => state.playlist);
  
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  
  // Existing content
  const [existingContent, setExistingContent] = useState([]);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Quiz editor
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [editingQuizIndex, setEditingQuizIndex] = useState(null);
  
  // Updating state
  const [updating, setUpdating] = useState(false);
  
  // Drawer for editing sets
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState("edit");
  const [editingSetIndex, setEditingSetIndex] = useState(null);
  
  // Confirm dialog for delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);
  
  // Menu state for mobile cards
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  // Load playlist data
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId && playlists.length === 0) {
      dispatch(fetchPlaylists(userId));
    }
  }, [user, dispatch, playlists.length]);

  useEffect(() => {
    if (playlists.length > 0 && playlistId) {
      const foundPlaylist = playlists.find(p => p._id === playlistId);
      if (foundPlaylist) {
        setPlaylist(foundPlaylist);
        setTitle(foundPlaylist.title || "");
        setPrice(foundPlaylist.price?.toString() || "");
        setDescription(foundPlaylist.description || "");
        
        // Debug: Log the content structure
        console.log("Playlist content:", foundPlaylist.content);
        if (foundPlaylist.content && foundPlaylist.content.length > 0) {
          console.log("First content item:", foundPlaylist.content[0]);
        }
        
        setExistingContent(JSON.parse(JSON.stringify(foundPlaylist.content || [])));
        setLoading(false);
      }
    }
  }, [playlists, playlistId]);

  const handleClearExistingFile = (index) => {
    const newContent = existingContent.map((item, idx) => {
      if (idx === index) {
        return { ...item, cleared: true, newFile: null };
      }
      return item;
    });
    setExistingContent(newContent);
  };

  const handleDeleteSet = (setIndex) => {
    setSetToDelete(setIndex);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSet = () => {
    if (setToDelete === null) return;
    
    // Calculate the starting index of the set (each set has 3 items: video, lab, activity)
    const startIndex = setToDelete * 3;
    
    // Mark the 3 items (video, lab, activity) as removed
    const newContent = existingContent.map((item, idx) => {
      if (idx >= startIndex && idx < startIndex + 3 && item.type !== "quiz") {
        return { ...item, removed: true };
      }
      return item;
    });
    
    setExistingContent(newContent);
    setToastMessage("Set marked for deletion");
    setShowToast(true);
    setShowDeleteConfirm(false);
    setSetToDelete(null);
  };

  const handleAddSetBeforeQuiz = () => {
    setDrawerMode("addBeforeQuiz");
    setEditingSetIndex(null);
    setShowDrawer(true);
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

  const handleExistingTotalMarksChange = (index, value) => {
    const newContent = existingContent.map((item, idx) => {
      if (idx === index) {
        return { ...item, totalMarks: parseInt(value) || null };
      }
      return item;
    });
    setExistingContent(newContent);
  };

  const handleEditQuiz = (index) => {
    setEditingQuizIndex(index);
    setShowQuizEditor(true);
  };

  const handleQuizSave = (updatedQuizData) => {
    if (editingQuizIndex !== null) {
      const newContent = existingContent.map((item, idx) => {
        if (idx === editingQuizIndex) {
          return {
            ...item,
            quizData: updatedQuizData,
            modified: true,
          };
        }
        return item;
      });
      setExistingContent(newContent);
    }
    setShowQuizEditor(false);
    setEditingQuizIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = user?.id || user?._id;
    if (!userId) return;

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

      const response = await fetch("/api/playlist", {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update playlist");
      }

      setToastMessage(playlist.status === "pending" ? "Playlist updated successfully!" : "Playlist update submitted for admin approval!");
      setShowToast(true);
      
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      setToastMessage(err.message || "Failed to update playlist");
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f7c82] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Playlist not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (showQuizEditor && editingQuizIndex !== null) {
    const quizData = existingContent[editingQuizIndex]?.quizData;
    return (
      <QuizBuilder
        onSave={handleQuizSave}
        onClose={() => {
          setShowQuizEditor(false);
          setEditingQuizIndex(null);
        }}
        initialQuizData={quizData}
      />
    );
  }

  return (
    <div className={`min-h-screen py-8 bg-white ${showDrawer ? 'overflow-hidden' : ''}`}>
      {showToast && toastMessage && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
      
      {showDeleteConfirm && (
        <ConfirmToast
          message="Are you sure you want to delete this set? This will remove the video, lab, and activity."
          onConfirm={confirmDeleteSet}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSetToDelete(null);
          }}
        />
      )}
      
      <div className="max-w-6xl 2xl:max-w-[2560px] mx-auto px-4 2xl:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-medium sm:font-semibold lg:font-semibold text-gray-900">Edit Playlist</h1>
          <button
            onClick={() => router.back()}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 flex items-center gap-1 sm:gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        
        <form onSubmit={handleSubmit}>
          <div >
        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1 sm:mb-2">
                  Playlist Title 
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter playlist title"
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1 sm:mb-2">
                  Price (PKR) 
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  min="0"
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  required
                />
              </div>
            </div>

            
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1 sm:mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter playlist description"
                rows={4}
                maxLength={200}
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
              />
            </div>
          </div>

        
          {existingContent.length > 0 && (
            <div className="">
              <h3 className="text-base sm:text-lg font-medium sm:font-semibold text-gray-900 mb-3 sm:mb-4">Current Content</h3>
              
             
              {(() => {
                const sets = [];
                const quizItems = [];
                let currentSet = { video: null, lab: null, activity: null, setIndex: 0 };
                let setNumber = 1;
                
                existingContent.forEach((item, index) => {
                  if (item.removed) return;
                  
                  if (item.type === "quiz") {
                    // Store quiz items separately to add at the end
                    quizItems.push({ quiz: item, quizIndex: index });
                  } else if (item.type === "video") {
                    if (currentSet.video || currentSet.lab || currentSet.activity) {
                      sets.push({ ...currentSet, setNumber });
                      setNumber++;
                    }
                    currentSet = { video: { ...item, index }, lab: null, activity: null, setIndex: Math.floor(index / 3) };
                  } else if (item.type === "lab") {
                    currentSet.lab = { ...item, index };
                  } else if (item.type === "activity") {
                    currentSet.activity = { ...item, index };
                  }
                });
                
                if (currentSet.video || currentSet.lab || currentSet.activity) {
                  sets.push({ ...currentSet, setNumber });
                }
               
                quizItems.forEach(quizItem => {
                  sets.push(quizItem);
                });
                
                return (
                  <>
                    {/* Desktop Table View - Hidden on mobile */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Set #</th>
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Video</th>
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Lab</th>
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Lab Marks</th>
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Activity</th>
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Activity Marks</th>
                            <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sets.map((set, idx) => {
                           
                            if (set.quiz) {
                              return (
                                <tr key={`quiz-${idx}`} className="border-b border-gray-200">
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-normal sm:font-medium" colSpan="6">
                                    Final Quiz - {set.quiz.quizData?.mcqs?.length || 0} MCQs | Total: {set.quiz.quizData?.totalMarks || 0} marks
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleEditQuiz(set.quizIndex)}
                                      className="p-2 bg-[#4f7c82] text-white hover:bg-[#3d6166] rounded transition-colors"
                                      title="Edit Quiz"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                            
                            const isFirstSet = set.setNumber === 1;
                            
                            return (
                              <tr key={`set-${idx}`} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{set.setNumber}</td>
                                
                               
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[150px]">
                                  {(() => {
                                    if (set.video.newFile) return set.video.newFile.name;
                                    if (set.video.originalName) return set.video.originalName;
                                    if (set.video.filename) return set.video.filename;
                                    if (set.video.path) return set.video.path.split('/').pop();
                                    return "No file";
                                  })()}
                                </td>
                                
                            
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[150px]">
                                  {(() => {
                                    if (set.lab.newFile) return set.lab.newFile.name;
                                    if (set.lab.originalName) return set.lab.originalName;
                                    if (set.lab.filename) return set.lab.filename;
                                    if (set.lab.path) return set.lab.path.split('/').pop();
                                    return "No file";
                                  })()}
                                </td>
                                
                              
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{set.lab.totalMarks || "-"}</td>
                                
                              
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[150px]">
                                  {(() => {
                                    if (set.activity.newFile) return set.activity.newFile.name;
                                    if (set.activity.originalName) return set.activity.originalName;
                                    if (set.activity.filename) return set.activity.filename;
                                    if (set.activity.path) return set.activity.path.split('/').pop();
                                    return "No file";
                                  })()}
                                </td>
                                
                             
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{set.activity.totalMarks || "-"}</td>
                                
                                
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                  <div className="flex gap-1 sm:gap-2 justify-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDrawerMode("edit");
                                        setEditingSetIndex(set.setIndex);
                                        setShowDrawer(true);
                                      }}
                                      className="p-1.5 sm:p-2 bg-[#4f7c82] text-white hover:bg-[#3d6166] rounded transition-colors"
                                      title="Edit"
                                    >
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    {!isFirstSet && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSet(set.setIndex)}
                                        className="p-1.5 sm:p-2 bg-[#4f7c82] text-white hover:bg-[#3d6166] rounded transition-colors"
                                        title="Delete"
                                      >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View - Visible only on mobile */}
                    <div className="block sm:hidden space-y-3">
                      {sets.map((set, idx) => {
                        if (set.quiz) {
                          return (
                            <div key={`quiz-${idx}`} className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-900 mb-1">Final Quiz</p>
                                  <p className="text-xs text-gray-600">
                                    {set.quiz.quizData?.mcqs?.length || 0} MCQs | Total: {set.quiz.quizData?.totalMarks || 0} marks
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleEditQuiz(set.quizIndex)}
                                  className="p-2 bg-[#4f7c82] text-white hover:bg-[#3d6166] rounded transition-colors"
                                  title="Edit Quiz"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        const isFirstSet = set.setNumber === 1;
                        const isMenuOpen = openMenuIndex === idx;
                        
                        return (
                          <div key={`set-${idx}`} className="bg-white rounded-lg shadow-md border border-gray-200 p-3 relative">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-900">Set #{set.setNumber}</h4>
                              
                              {/* 3 Dots Menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenMenuIndex(isMenuOpen ? null : idx)}
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
                                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[100px]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuIndex(null);
                                          setDrawerMode("edit");
                                          setEditingSetIndex(set.setIndex);
                                          setShowDrawer(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                      
                                      {!isFirstSet && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuIndex(null);
                                            handleDeleteSet(set.setIndex);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {/* Video */}
                              <div className="flex items-start justify-between border-b border-gray-100 pb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase flex-shrink-0">Video:</span>
                                <span className="text-xs text-gray-700 text-right ml-2 break-all">
                                  {(() => {
                                    if (set.video.newFile) return set.video.newFile.name;
                                    if (set.video.originalName) return set.video.originalName;
                                    if (set.video.filename) return set.video.filename;
                                    if (set.video.path) return set.video.path.split('/').pop();
                                    return "No file";
                                  })()}
                                </span>
                              </div>
                              
                              {/* Lab */}
                              <div className="flex items-start justify-between border-b border-gray-100 pb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase flex-shrink-0">Lab:</span>
                                <span className="text-xs text-gray-700 text-right ml-2 break-all">
                                  {(() => {
                                    if (set.lab.newFile) return set.lab.newFile.name;
                                    if (set.lab.originalName) return set.lab.originalName;
                                    if (set.lab.filename) return set.lab.filename;
                                    if (set.lab.path) return set.lab.path.split('/').pop();
                                    return "No file";
                                  })()}
                                </span>
                              </div>
                              
                              {/* Lab Marks */}
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Lab Marks:</span>
                                <span className="text-xs text-gray-700">{set.lab.totalMarks || "-"}</span>
                              </div>
                              
                              {/* Activity */}
                              <div className="flex items-start justify-between border-b border-gray-100 pb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase flex-shrink-0">Activity:</span>
                                <span className="text-xs text-gray-700 text-right ml-2 break-all">
                                  {(() => {
                                    if (set.activity.newFile) return set.activity.newFile.name;
                                    if (set.activity.originalName) return set.activity.originalName;
                                    if (set.activity.filename) return set.activity.filename;
                                    if (set.activity.path) return set.activity.path.split('/').pop();
                                    return "No file";
                                  })()}
                                </span>
                              </div>
                              
                              {/* Activity Marks */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Activity Marks:</span>
                                <span className="text-xs text-gray-700">{set.activity.totalMarks || "-"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

      
          <div className="flex flex-col sm:flex-row justify-between pt-3 sm:pt-4 items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleAddSetBeforeQuiz}
              className="px-4 sm:px-6 py-2 text-xs sm:text-sm bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition font-normal sm:font-medium"
            >
              Add Set 
            </button>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition font-normal sm:font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Playlist"}
              </button>
            </div>
          </div>
        </form>
  
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex overflow-hidden">

            <div
              className="flex-1 bg-black/40"
              onClick={() => setShowDrawer(false)}
            />

            {/* Drawer */}
            <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-white shadow-lg flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl md:text-lg lg:text-xl font-medium sm:font-semibold md:font-medium lg:font-semibold">
                    {drawerMode === "addBeforeQuiz" ? "Add Set" : `Edit Set ${Math.floor(editingSetIndex) + 1}`}
                  </h2>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {drawerMode === "addBeforeQuiz" ? (
                  <DrawerAddContent
                    existingContent={existingContent}
                    setExistingContent={setExistingContent}
                    onClose={() => setShowDrawer(false)}
                    setToastMessage={setToastMessage}
                    setShowToast={setShowToast}
                  />
                ) : (
                  <DrawerEditContent
                    setIndex={editingSetIndex}
                    existingContent={existingContent}
                    setExistingContent={setExistingContent}
                    onClose={() => setShowDrawer(false)}
                    setToastMessage={setToastMessage}
                    setShowToast={setShowToast}
                    handleReplaceExistingFile={handleReplaceExistingFile}
                    handleExistingTotalMarksChange={handleExistingTotalMarksChange}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DrawerEditContent({ setIndex, existingContent, setExistingContent, onClose, setToastMessage, setShowToast, handleReplaceExistingFile, handleExistingTotalMarksChange }) {
  const startIndex = setIndex * 3;
  const videoItem = existingContent[startIndex];
  const labItem = existingContent[startIndex + 1];
  const activityItem = existingContent[startIndex + 2];

  const getFileName = (item) => {
    if (item?.originalName) return item.originalName;
    if (item?.filename) return item.filename;
    if (item?.path) return item.path.split('/').pop();
    return "No file";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Video Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${videoItem?.newFile ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="font-normal sm:font-medium text-sm sm:text-base text-gray-900">1. Video</h4>
          {videoItem?.newFile && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {!videoItem?.newFile && videoItem && (
          <div className="pb-2 rounded text-xs sm:text-sm text-gray-700">
            <span className="font-normal sm:font-medium">Current: </span>
            <span className="text-gray-600">{getFileName(videoItem)}</span>
          </div>
        )}
        <input
          type="file"
          accept="video/*"
          onChange={(e) => handleReplaceExistingFile(startIndex, e)}
          className="w-full text-xs sm:text-sm"
        />
        {videoItem?.newFile && (
          <p className="text-[10px] sm:text-xs text-[#4f7c82] mt-2">New file: {videoItem.newFile.name}</p>
        )}
      </div>

      {/* Lab Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${labItem?.newFile ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="font-normal sm:font-medium text-sm sm:text-base text-gray-900">2. Lab</h4>
          {labItem?.newFile && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {!labItem?.newFile && labItem && (
          <div className="pb-2 rounded text-xs sm:text-sm text-gray-700">
            <span className="font-normal sm:font-medium">Current: </span>
            <span className="text-gray-600">{getFileName(labItem)}</span>
          </div>
        )}
        <input
          type="file"
          accept="*/*"
          onChange={(e) => handleReplaceExistingFile(startIndex + 1, e)}
          className="w-full text-xs sm:text-sm"
        />
        {labItem?.newFile && (
          <p className="text-[10px] sm:text-xs text-[#4f7c82] mt-2">New file: {labItem.newFile.name}</p>
        )}
        <input
          type="number"
          value={labItem?.totalMarks || ""}
          onChange={(e) => handleExistingTotalMarksChange(startIndex + 1, e.target.value)}
          placeholder="Total marks"
          min="1"
          className="w-full mt-2 px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
        />
      </div>

      {/* Activity Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${activityItem?.newFile ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="font-normal sm:font-medium text-sm sm:text-base text-gray-900">3. Activity</h4>
          {activityItem?.newFile && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {!activityItem?.newFile && activityItem && (
          <div className="pb-2 rounded text-xs sm:text-sm text-gray-700">
            <span className="font-normal sm:font-medium">Current: </span>
            <span className="text-gray-600">{getFileName(activityItem)}</span>
          </div>
        )}
        <input
          type="file"
          accept="*/*"
          onChange={(e) => handleReplaceExistingFile(startIndex + 2, e)}
          className="w-full text-xs sm:text-sm"
        />
        {activityItem?.newFile && (
          <p className="text-[10px] sm:text-xs text-[#4f7c82] mt-2">New file: {activityItem.newFile.name}</p>
        )}
        <input
          type="number"
          value={activityItem?.totalMarks || ""}
          onChange={(e) => handleExistingTotalMarksChange(startIndex + 2, e.target.value)}
          placeholder="Total marks"
          min="1"
          className="w-full mt-2 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
        />
      </div>

      {/* Close Button */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}


function DrawerAddContent({ existingContent, setExistingContent, onClose, setToastMessage, setShowToast }) {
  const [newVideo, setNewVideo] = useState(null);
  const [newLab, setNewLab] = useState(null);
  const [newActivity, setNewActivity] = useState(null);
  const [newLabMarks, setNewLabMarks] = useState("");
  const [newActivityMarks, setNewActivityMarks] = useState("");

  const isComplete = newVideo && newLab && newActivity && newLabMarks && newActivityMarks;

  const handleSave = () => {
    if (!isComplete) return;

    // Find the quiz index
    const quizIndex = existingContent.findIndex(item => item.type === "quiz");
    
    if (quizIndex === -1) {
      setToastMessage("Quiz not found");
      setShowToast(true);
      return;
    }

    // Create new set items
    const newVideoItem = {
      type: "video",
      newFile: newVideo,
      videoUrl: null,
      order: quizIndex,
    };

    const newLabItem = {
      type: "lab",
      newFile: newLab,
      videoUrl: null,
      totalMarks: parseInt(newLabMarks),
      order: quizIndex + 1,
    };

    const newActivityItem = {
      type: "activity",
      newFile: newActivity,
      videoUrl: null,
      totalMarks: parseInt(newActivityMarks),
      order: quizIndex + 2,
    };

    // Insert new items before quiz
    const newContent = [
      ...existingContent.slice(0, quizIndex),
      newVideoItem,
      newLabItem,
      newActivityItem,
      ...existingContent.slice(quizIndex),
    ];

    setExistingContent(newContent);
    setToastMessage("New set added before quiz successfully!");
    setShowToast(true);
    onClose();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Video Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${newVideo ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="font-normal sm:font-medium text-xs sm:text-sm text-gray-900">1. Video</h4>
          {newVideo && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setNewVideo(e.target.files[0])}
          className="w-full text-xs sm:text-sm"
        />
        {newVideo && (
          <p className="text-xs text-[#4f7c82] mt-2">{newVideo.name}</p>
        )}
      </div>

      {/* Lab Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${!newVideo ? 'opacity-50 cursor-not-allowed' : newLab ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="font-normal sm:font-medium text-xs sm:text-sm text-gray-900">2. Lab</h4>
          {!newVideo && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
          {newLab && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <input
          type="file"
          accept="*/*"
          onChange={(e) => setNewLab(e.target.files[0])}
          disabled={!newVideo}
          className="w-full text-xs sm:text-sm disabled:cursor-not-allowed"
        />
        {newLab && (
          <>
            <p className="text-xs text-[#4f7c82] mt-2">{newLab.name}</p>
            <input
              type="number"
              value={newLabMarks}
              onChange={(e) => setNewLabMarks(e.target.value)}
              placeholder="Total marks"
              min="1"
              className="w-full mt-2 px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
            />
          </>
        )}
      </div>

      {/* Activity Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${!newLab ? 'opacity-50 cursor-not-allowed' : newActivity ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="font-normal sm:font-medium text-xs sm:text-sm text-gray-900">3. Activity</h4>
          {!newLab && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
          {newActivity && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <input
          type="file"
          accept="*/*"
          onChange={(e) => setNewActivity(e.target.files[0])}
          disabled={!newLab}
          className="w-full text-xs sm:text-sm disabled:cursor-not-allowed"
        />
        {newActivity && (
          <>
            <p className="text-xs text-[#4f7c82] mt-2">{newActivity.name}</p>
            <input
              type="number"
              value={newActivityMarks}
              onChange={(e) => setNewActivityMarks(e.target.value)}
              placeholder="Total marks"
              min="1"
              className="w-full mt-2 px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
            />
          </>
        )}
      </div>

      {/* Save Button */}
      {isComplete && (
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition"
          >
            Add Set
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
