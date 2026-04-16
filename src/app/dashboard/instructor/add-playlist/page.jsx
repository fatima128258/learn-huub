"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { createPlaylist, fetchPlaylists } from "@/store/playlist";
import Toast from "@/components/Toast";
import QuizBuilder from "@/components/QuizBuilder";

export default function AddPlaylistPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.playlist);

  // Form states
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  // Current set being filled
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentLab, setCurrentLab] = useState(null);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [currentLabMarks, setCurrentLabMarks] = useState("");
  const [currentActivityMarks, setCurrentActivityMarks] = useState("");

  // Saved sets
  const [savedSets, setSavedSets] = useState([]);

  // Quiz data
  const [quizData, setQuizData] = useState(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [quizFormat, setQuizFormat] = useState(null);

  // Side drawer for Add More/Edit
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add"); // "add" or "edit"
  const [editingIndex, setEditingIndex] = useState(null);


  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");


  const isCurrentSetComplete = currentVideo && currentLab && currentActivity && currentLabMarks && currentActivityMarks;


  const canShowActions = savedSets.length > 0;


  const handleSaveSet = () => {
    if (!isCurrentSetComplete) return;

    const newSet = {
      video: currentVideo,
      lab: currentLab,
      activity: currentActivity,
      labMarks: currentLabMarks,
      activityMarks: currentActivityMarks,
    };

    setSavedSets([...savedSets, newSet]);

    // Reset current set
    setCurrentVideo(null);
    setCurrentLab(null);
    setCurrentActivity(null);
    setCurrentLabMarks("");
    setCurrentActivityMarks("");

    setToastMessage("Set saved successfully!");
    setShowToast(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {showToast && toastMessage && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
      <div className="max-w-6xl 2xl:max-w-[2560px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-medium sm:font-semibold lg:font-semibold text-gray-900">Create New Playlist</h1>
          {/* <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold lg:font-bold text-gray-900">Create New Playlist</h1> */}
          <button
            onClick={() => router.back()}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 sm:gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
          {/* Title and Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1.5 sm:mb-2">
                Playlist Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter playlist title"
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1.5 sm:mb-2">
                Price (PKR)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                min="0"
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                required
              />
            </div>
          </div>

          {/* Description Row */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1.5 sm:mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter playlist description"
              rows={4}
              maxLength={200}
              className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
            />
          </div>
          {/* Content Upload Section - Only show if no sets saved yet */}
          {savedSets.length === 0 && (
            <div className="border-t pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-medium sm:font-semibold text-gray-900 mb-3 sm:mb-4">Add Content Set</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Video Upload */}
                <div className={`border-2 rounded-lg p-3 sm:p-4 ${currentVideo ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h4 className="text-xs sm:text-sm font-normal sm:font-medium text-gray-900">1. Video</h4>
                    {currentVideo && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setCurrentVideo(e.target.files[0])}
                    className="w-full text-xs sm:text-sm"
                  />
                </div>

                {/* Lab Upload */}
                <div className={`border-2 rounded-lg p-3 sm:p-4 ${!currentVideo ? 'opacity-50 cursor-not-allowed' : currentLab ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h4 className="text-xs sm:text-sm font-normal sm:font-medium text-gray-900">2. Lab</h4>
                    {!currentVideo && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {currentLab && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => setCurrentLab(e.target.files[0])}
                    disabled={!currentVideo}
                    className="w-full text-xs sm:text-sm disabled:cursor-not-allowed"
                  />
                  {currentLab && (
                    <input
                      type="number"
                      value={currentLabMarks}
                      onChange={(e) => setCurrentLabMarks(e.target.value)}
                      placeholder="Total marks"
                      min="1"
                      className="w-full mt-2 px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
                    />
                  )}
                </div>

                {/* Activity Upload */}
                <div className={`border-2 rounded-lg p-3 sm:p-4 ${!currentLab ? 'opacity-50 cursor-not-allowed' : currentActivity ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h4 className="text-xs sm:text-sm font-normal sm:font-medium text-gray-900">3. Activity</h4>
                    {!currentLab && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {currentActivity && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => setCurrentActivity(e.target.files[0])}
                    disabled={!currentLab}
                    className="w-full text-xs sm:text-sm disabled:cursor-not-allowed"
                  />
                  {currentActivity && (
                    <input
                      type="number"
                      value={currentActivityMarks}
                      onChange={(e) => setCurrentActivityMarks(e.target.value)}
                      placeholder="Total marks"
                      min="1"
                      className="w-full mt-2 px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
                    />
                  )}
                </div>
              </div>

              {/* Save Set Button */}
              {isCurrentSetComplete && (
                <div className="mt-3 sm:mt-4 flex justify-end">
                  <button
                    onClick={handleSaveSet}
                    className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition"
                  >
                    Save Set
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Saved Sets Table */}
        {savedSets.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium sm:font-semibold text-gray-900 mb-3 sm:mb-4">Content Sets</h3>

            {/* Desktop Table View - 640px and above */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Set </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Video</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Lab</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Activity</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Lab Marks</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Activity Marks</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium sm:font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedSets.map((set, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{index + 1}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 truncate max-w-[150px]">
                        {set.video?.name || "Uploaded"}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 truncate max-w-[150px]">
                        {set.lab?.name || "Uploaded"}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 truncate max-w-[150px]">
                        {set.activity?.name || "Uploaded"}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{set.labMarks}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{set.activityMarks}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <button
                          onClick={() => {
                            setDrawerMode("edit");
                            setEditingIndex(index);
                            setShowDrawer(true);
                          }}
                          className="text-[#4f7c82] hover:text-[#3d6166] font-normal sm:font-medium text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Quiz Row */}
                  {quizData && (
                    <tr className="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-normal sm:font-medium" colSpan="4"> Quiz</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm" colSpan="2">
                        {quizData.mcqs?.length || 0} MCQs | Total: {quizData.totalMarks || 0} marks
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <button
                          onClick={() => {
                            setShowQuizBuilder(true);
                          }}
                          className="text-[#4f7c82] hover:text-[#3d6166] font-normal sm:font-medium text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Below 640px */}
            <div className="sm:hidden space-y-3">
              {savedSets.map((set, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
                  <div className="space-y-2">
                    {/* Set Number */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-black">Set #{index + 1}</h4>
                      <button
                        onClick={() => {
                          setDrawerMode("edit");
                          setEditingIndex(index);
                          setShowDrawer(true);
                        }}
                        className="text-[#4f7c82] hover:text-[#3d6166] text-xs"
                      >
                        •••
                      </button>
                    </div>

                    {/* Video */}
                    <div className="flex items-start gap-2">
                      <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Video:</p>
                      <p className="text-xs text-gray-600 flex-1 text-right break-words">{set.video?.name || "Uploaded"}</p>
                    </div>

                    {/* Lab */}
                    <div className="flex items-start gap-2">
                      <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Lab:</p>
                      <p className="text-xs text-gray-600 flex-1 text-right break-words">{set.lab?.name || "Uploaded"}</p>
                    </div>

                    {/* Lab Marks */}
                    <div className="flex items-start gap-2">
                      <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Lab Marks:</p>
                      <p className="text-xs text-gray-600 flex-1 text-right">{set.labMarks}</p>
                    </div>

                    {/* Activity */}
                    <div className="flex items-start gap-2">
                      <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Activity:</p>
                      <p className="text-xs text-gray-600 flex-1 text-right break-words">{set.activity?.name || "Uploaded"}</p>
                    </div>

                    {/* Activity Marks */}
                    <div className="flex items-start gap-2">
                      <p className="text-xs font-semibold text-black uppercase whitespace-nowrap">Activity Marks:</p>
                      <p className="text-xs text-gray-600 flex-1 text-right">{set.activityMarks}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quiz Card */}
              {quizData && (
                <div className="bg-blue-50 rounded-lg shadow-md border border-blue-200 p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-200">
                      <h4 className="text-sm font-semibold text-black">Quiz</h4>
                      <button
                        onClick={() => {
                          setShowQuizBuilder(true);
                        }}
                        className="text-[#4f7c82] hover:text-[#3d6166] text-xs"
                      >
                        •••
                      </button>
                    </div>
                    <p className="text-xs text-gray-700">
                      {quizData.mcqs?.length || 0} MCQs | Total: {quizData.totalMarks || 0} marks
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Show based on quiz status */}
            <div className="mt-4 sm:mt-6">
              {!quizData ? (
                // Show Add Final Quiz and Add More Content buttons if quiz not added
                <div className="flex gap-2 sm:gap-4">
                  <button
                    onClick={() => setShowQuizBuilder(true)}
                    className="flex-1 py-2 sm:py-3 text-xs sm:text-sm bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition font-normal sm:font-medium"
                  >
                    Add Quiz
                  </button>
                  <button
                    onClick={() => {
                      setDrawerMode("add");
                      setShowDrawer(true);
                    }}
                    className="flex-1 py-2 sm:py-3 text-xs sm:text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-normal sm:font-medium"
                  >
                    Add More Content
                  </button>
                </div>
              ) : (
                // Show Add Set Before Quiz and Save Playlist buttons on same row if quiz is added
                <div className="flex justify-between items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setDrawerMode("addBeforeQuiz");
                      setShowDrawer(true);
                    }}
                    className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition font-normal sm:font-medium whitespace-nowrap"
                  >
                    Add Set
                  </button>
                  <button
                    onClick={async () => {
                      const userId = user?.id || user?._id;
                      if (!userId) {
                        setToastMessage("User not found. Please login again.");
                        setShowToast(true);
                        return;
                      }


                      const finalContent = [];


                      savedSets.forEach((set, setIndex) => {

                        const videoItem = {
                          type: "video",
                          order: setIndex * 3,
                        };
                        if (set.video instanceof File) {
                          videoItem.file = set.video;
                        } else if (set.video?.url) {
                          videoItem.url = set.video.url;
                        }
                        finalContent.push(videoItem);


                        const labItem = {
                          type: "lab",
                          totalMarks: parseInt(set.labMarks),
                          order: setIndex * 3 + 1,
                        };
                        if (set.lab instanceof File) {
                          labItem.file = set.lab;
                        } else if (set.lab?.url) {
                          labItem.url = set.lab.url;
                        }
                        finalContent.push(labItem);

                        // Add activity
                        const activityItem = {
                          type: "activity",
                          totalMarks: parseInt(set.activityMarks),
                          order: setIndex * 3 + 2,
                        };
                        if (set.activity instanceof File) {
                          activityItem.file = set.activity;
                        } else if (set.activity?.url) {
                          activityItem.url = set.activity.url;
                        }
                        finalContent.push(activityItem);
                      });

                      // Add quiz
                      finalContent.push({
                        type: "quiz",
                        quizData: quizData,
                        order: savedSets.length * 3,
                      });

                      console.log("Final content being sent:", finalContent.map(item => ({
                        type: item.type,
                        hasFile: !!item.file,
                        hasUrl: !!item.url,
                        order: item.order
                      })));

                      console.log("Total items:", finalContent.length);

                      try {
                        const result = await dispatch(
                          createPlaylist({
                            title: title.trim(),
                            description: description.trim(),
                            price: parseInt(price),
                            content: finalContent,
                            instructorId: userId,
                          })
                        ).unwrap();

                        if (result.success) {
                          // Delete draft from MongoDB
                          try {
                            await fetch(`/api/playlist/draft?instructorId=${userId}`, {
                              method: "DELETE",
                            });
                          } catch (error) {
                            console.error("Error deleting draft:", error);
                          }

                          // Clear localStorage
                          localStorage.removeItem("tempPlaylistData");
                          localStorage.removeItem("tempQuizData");
                          localStorage.removeItem("quizFormat");
                          localStorage.removeItem("existingQuizData");

                          setToastMessage("Playlist created successfully!");
                          setShowToast(true);

                          // Refresh playlists
                          await dispatch(fetchPlaylists(userId));

                          // Redirect after 2 seconds
                          setTimeout(() => {
                            router.push("/dashboard/instructor");
                          }, 2000);
                        }
                      } catch (err) {
                        setToastMessage(err || "Failed to create playlist. Please try again.");
                        setShowToast(true);
                      }
                    }}
                    disabled={loading}
                    className="px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg bg-[#4f7c82] hover:bg-[#3d6166] text-white rounded-lg transition font-normal sm:font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Save Playlist"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QuizBuilder - Show on same page */}
      {showQuizBuilder && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <QuizBuilder
            onSave={(savedQuizData) => {
              setQuizData(savedQuizData);
              setShowQuizBuilder(false);
              setToastMessage("Quiz saved successfully!");
              setShowToast(true);
            }}
            onClose={() => setShowQuizBuilder(false)}
            initialQuizData={quizData}
          />
        </div>
      )}

      {/* Side Drawer for Add More / Edit */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer */}
          <div className="w-full max-w-xl bg-white shadow-lg flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-2xl font-medium sm:font-bold">
                  {drawerMode === "edit" ? "Edit Content Set" : drawerMode === "addBeforeQuiz" ? "Add Set " : "Add More Content"}
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
              <DrawerContent
                mode={drawerMode}
                editingIndex={editingIndex}
                savedSets={savedSets}
                setSavedSets={setSavedSets}
                onClose={() => setShowDrawer(false)}
                setToastMessage={setToastMessage}
                setShowToast={setShowToast}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Drawer Content Component
function DrawerContent({ mode, editingIndex, savedSets, setSavedSets, onClose, setToastMessage, setShowToast }) {
  const [drawerVideo, setDrawerVideo] = useState(null);
  const [drawerLab, setDrawerLab] = useState(null);
  const [drawerActivity, setDrawerActivity] = useState(null);
  const [drawerLabMarks, setDrawerLabMarks] = useState("");
  const [drawerActivityMarks, setDrawerActivityMarks] = useState("");

  // Load existing data if editing
  useEffect(() => {
    if (mode === "edit" && editingIndex !== null && savedSets[editingIndex]) {
      const set = savedSets[editingIndex];
      setDrawerVideo(set.video);
      setDrawerLab(set.lab);
      setDrawerActivity(set.activity);
      setDrawerLabMarks(set.labMarks);
      setDrawerActivityMarks(set.activityMarks);
    }
  }, [mode, editingIndex, savedSets]);

  const isComplete = drawerVideo && drawerLab && drawerActivity && drawerLabMarks && drawerActivityMarks;

  // For "add" and "addBeforeQuiz" mode: progressive unlock
  // For "edit" mode: all fields unlocked
  const isLabUnlocked = mode === "edit" || drawerVideo;
  const isActivityUnlocked = mode === "edit" || drawerLab;

  const handleSave = () => {
    if (!isComplete) return;

    const newSet = {
      video: drawerVideo,
      lab: drawerLab,
      activity: drawerActivity,
      labMarks: drawerLabMarks,
      activityMarks: drawerActivityMarks,
    };

    if (mode === "edit" && editingIndex !== null) {
      // Update existing set
      const updatedSets = [...savedSets];
      updatedSets[editingIndex] = newSet;
      setSavedSets(updatedSets);
      setToastMessage("Set updated successfully!");
    } else if (mode === "addBeforeQuiz") {
      // Add new set at the end (before quiz)
      setSavedSets([...savedSets, newSet]);
      setToastMessage("Set added before quiz successfully!");
    } else {
      // Add new set (regular add mode)
      setSavedSets([...savedSets, newSet]);
      setToastMessage("Set added successfully!");
    }

    setShowToast(true);
    onClose();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Video Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${drawerVideo ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="text-xs sm:text-sm font-normal sm:font-medium text-gray-900">1. Video</h4>
          {drawerVideo && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setDrawerVideo(e.target.files[0])}
          className="w-full text-xs sm:text-sm"
        />
      </div>

      {/* Lab Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${!isLabUnlocked ? 'opacity-50 cursor-not-allowed' : drawerLab ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="text-xs sm:text-sm font-normal sm:font-medium text-gray-900">2. Lab</h4>
          {!isLabUnlocked && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
          {drawerLab && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <input
          type="file"
          accept="*/*"
          onChange={(e) => setDrawerLab(e.target.files[0])}
          disabled={!isLabUnlocked}
          className="w-full text-xs sm:text-sm disabled:cursor-not-allowed"
        />
        {drawerLab && (
          <input
            type="number"
            value={drawerLabMarks}
            onChange={(e) => setDrawerLabMarks(e.target.value)}
            placeholder="Total marks"
            min="1"
            className="w-full mt-2 px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
          />
        )}
      </div>

      {/* Activity Upload */}
      <div className={`border-2 rounded-lg p-3 sm:p-4 ${!isActivityUnlocked ? 'opacity-50 cursor-not-allowed' : drawerActivity ? 'border-[#4f7c82] bg-[#4f7c82]/10' : 'border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h4 className="text-xs sm:text-sm font-normal sm:font-medium text-gray-900">3. Activity</h4>
          {!isActivityUnlocked && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
          {drawerActivity && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4f7c82]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <input
          type="file"
          accept="*/*"
          onChange={(e) => setDrawerActivity(e.target.files[0])}
          disabled={!isActivityUnlocked}
          className="w-full text-xs sm:text-sm disabled:cursor-not-allowed"
        />
        {drawerActivity && (
          <input
            type="number"
            value={drawerActivityMarks}
            onChange={(e) => setDrawerActivityMarks(e.target.value)}
            placeholder="Total marks"
            min="1"
            className="w-full mt-2 px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
          />
        )}
      </div>

      {/* Save Button */}
      {isComplete && (
        <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
          <button
            onClick={handleSave}
            className="flex-1 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition"
          >
            {mode === "edit" ? "Update Set" : "Save Set"}
          </button>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
