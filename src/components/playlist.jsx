"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/Button";
import { createPlaylist, resetPlaylist, fetchPlaylists } from "@/store/playlist";
import QuizBuilder from "@/components/QuizBuilder";
import Toast from "@/components/Toast";

const INITIAL_SET = [
  { type: "video", label: "Video", accept: "video/*" },
  { type: "lab", label: "Lab", accept: "*/*" },
  { type: "activity", label: "Activity", accept: "*/*" },
];

const ADDITIONAL_SET = [
  { type: "video", label: "Video", accept: "video/*" },
  { type: "lab", label: "Lab", accept: "*/*" },
  { type: "activity", label: "Activity", accept: "*/*" },
];

export default function PlaylistDrawer({ open, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error, success } = useSelector((state) => state.playlist);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contentItems, setContentItems] = useState(
    INITIAL_SET.map((item) => ({ type: item.type, file: null, quizData: null, totalMarks: null }))
  );
  const [hasQuiz, setHasQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [additionalSets, setAdditionalSets] = useState(0);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");


  const handleRemoveLastSet = () => {
    if (additionalSets > 0) {
      const itemsToRemove = ADDITIONAL_SET.length; 
      const updatedItems = contentItems.slice(0, -itemsToRemove);
      setContentItems(updatedItems);
      setAdditionalSets((prev) => prev - 1);

      
      setHasQuiz(false);
      setQuizData(null);
    }
  };


  
  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setDescription("");
      setPrice("");
      setContentItems(INITIAL_SET.map((item) => ({ type: item.type, file: null, quizData: null })));
      setHasQuiz(false);
      setQuizData(null);
      setAdditionalSets(0);
      setShowQuizBuilder(false);
      dispatch(resetPlaylist());
      onClose();
    }
  };


  const handleAddMore = () => {
    const newItems = ADDITIONAL_SET.map((item) => ({ type: item.type, file: null, quizData: null, totalMarks: null }));
    setContentItems([...contentItems, ...newItems]);
    setAdditionalSets(additionalSets + 1);
  };

  
  const handleAddFinalQuiz = () => {
    setShowQuizBuilder(true);
  };

  
  const handleFileSelect = (index, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const newContentItems = [...contentItems];
      newContentItems[index] = { ...newContentItems[index], file };
      setContentItems(newContentItems);
    }
    
    e.target.value = "";
  };

 
  const handleRemoveFile = (index) => {
    const newContentItems = [...contentItems];
    newContentItems[index] = { ...newContentItems[index], file: null, quizData: null, totalMarks: null };
    setContentItems(newContentItems);
  };

  
  const handleTotalMarksChange = (index, value) => {
    const newContentItems = [...contentItems];
   
    if (value === '' || /^\d+$/.test(value)) {
      newContentItems[index] = { ...newContentItems[index], totalMarks: value ? parseInt(value, 10) : null };
      setContentItems(newContentItems);
    }
  };

  const handleQuizSave = (savedQuizData) => {
    setQuizData(savedQuizData);
    setHasQuiz(true);
    setShowQuizBuilder(false);
  };

  const getNextRequiredType = () => {
    const firstEmptyIndex = contentItems.findIndex((item) => !item.file);
    if (firstEmptyIndex === -1) return null;

    if (firstEmptyIndex < INITIAL_SET.length) {
      return INITIAL_SET[firstEmptyIndex];
    } else {
      const setIndex = Math.floor((firstEmptyIndex - INITIAL_SET.length) / ADDITIONAL_SET.length);
      const itemIndex = (firstEmptyIndex - INITIAL_SET.length) % ADDITIONAL_SET.length;
      return ADDITIONAL_SET[itemIndex];
    }
  };

  const canAddType = (index) => {
    for (let i = 0; i < index; i++) {
      const item = contentItems[i];
      if (!item.file) return false;
    }
    return true;
  };

  const getContentLabel = (index) => {
    if (index < INITIAL_SET.length) {
      return INITIAL_SET[index].label;
    } else {
      const setNumber = Math.floor((index - INITIAL_SET.length) / ADDITIONAL_SET.length) + 2;
      const itemIndex = (index - INITIAL_SET.length) % ADDITIONAL_SET.length;
      const item = ADDITIONAL_SET[itemIndex];
      return `${item.label} ${setNumber}`;
    }
  };

  const getAcceptType = (index) => {
    if (index < INITIAL_SET.length) {
      return INITIAL_SET[index].accept;
    } else {
      const itemIndex = (index - INITIAL_SET.length) % ADDITIONAL_SET.length;
      return ADDITIONAL_SET[itemIndex].accept;
    }
  };

  const allContentFilled = () => {
    return contentItems.every((item) => item.file !== null);
  };


  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setToastMessage("Please enter a playlist title");
      setShowToast(true);
      return;
    }

    
    const priceValue = parseInt(price, 10);
    if (isNaN(priceValue) || priceValue < 0) {
      setToastMessage("Please enter a valid price in PKR (must be 0 or greater)");
      setShowToast(true);
      return;
    }

    
    const allFilled = contentItems.every((item) => item.file !== null);
    if (!allFilled) {
      const nextRequired = getNextRequiredType();
      setToastMessage(`Please upload ${nextRequired?.label || "all required content"} first.`);
      setShowToast(true);
      return;
    }

    for (let i = 0; i < contentItems.length; i++) {
      const item = contentItems[i];
      if ((item.type === "lab" || item.type === "activity")) {
        if (!item.totalMarks || item.totalMarks <= 0) {
          setToastMessage(`Please enter total marks for ${item.type === "lab" ? "Lab" : "Activity"} #${i + 1}`);
          setShowToast(true);
          return;
        }
        const marksValue = parseInt(item.totalMarks, 10);
        if (isNaN(marksValue) || marksValue <= 0) {
          setToastMessage(`Please enter a valid whole number for total marks for ${item.type === "lab" ? "Lab" : "Activity"} #${i + 1}`);
          setShowToast(true);
          return;
        }
      }
    }

    if (!hasQuiz || !quizData) {
      setToastMessage("Please add  Quiz before saving.");
      setShowToast(true);
      return;
    }

    const userId = user?.id || user?._id;
    if (!user || !userId) {
      setToastMessage("User not found. Please login again.");
      setShowToast(true);
      return;
    }

    const finalContent = [
      ...contentItems.map((item, index) => ({
        ...item,
        order: index,
        totalMarks: item.totalMarks ? parseInt(item.totalMarks, 10) : undefined,
      })),
      {
        type: "quiz",
        order: contentItems.length,
        quizData: quizData,
        file: null,
      },
    ];

    try {
      const result = await dispatch(
        createPlaylist({
          title: title.trim(),
          description: description.trim(),
          price: priceValue, 
          content: finalContent,
          instructorId: userId,
        })
      ).unwrap();

      if (result.success) {
        setTitle("");
        setDescription("");
        setPrice("");
        setContentItems(INITIAL_SET.map((item) => ({ type: item.type, file: null, quizData: null })));
        setHasQuiz(false);
        setQuizData(null);
        setAdditionalSets(0);
        setShowQuizBuilder(false);

        const userId = user?.id || user?._id;
        if (userId) {
          try {
            await dispatch(fetchPlaylists(userId)).unwrap();
            console.log("Playlists refreshed successfully");
          } catch (fetchError) {
            console.error("Error fetching playlists after creation:", fetchError);
          }
        }

        setTimeout(() => {
          handleClose();
        }, 500);
      } else {
        setToast("Playlist creation failed. Please try again.");
        setShowToast(true);
      }
    } catch (err) {
      console.error("Error creating playlist:", err);
      setToastMessage(err || "Failed to create playlist. Please try again.");
      setShowToast(true);
    }
  };

  if (!open) return null;

  const nextRequired = getNextRequiredType();
  const allItemsFilled = allContentFilled();
  const showQuizAndAddMoreButtons = allItemsFilled && !hasQuiz;

  return (
    <>
      {showToast && toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => {
            setShowToast(false);
            setToastMessage("");
          }}
        />
      )}
      
      <div className="fixed inset-0 z-50 flex">
        
        <div
          className="flex-1 bg-black/40"
          onClick={handleClose}
        />

      
      <div className="w-full max-w-4xl bg-white shadow-lg flex flex-col">
       
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold mb-2">Add Playlist</h2>
          <p className="text-sm text-gray-600">
            Upload content in order: Video ... Lab ... Activity ...  Quiz 
          </p>
        </div>

      
        <div className="flex-1 overflow-y-auto p-6">
          {success && (
            <div className="mb-4 p-3 bg-[#4f7c82]/10 border border-[#4f7c82]/30 text-[#4f7c82] rounded">
              Playlist created successfully!
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-black/5 border border-black/20 text-black rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Playlist Title
              </label>
              <input
                type="text"
                placeholder="Enter playlist title"
                className="w-full border border-black/20 px-3 py-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Description
              
              </label>
              <textarea
                placeholder="Enter playlist description "
                className="w-full border px-3 text-black py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Price (PKR) 
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Enter price in PKR"
                className="w-full border border-black/20 px-3 py-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                value={price}
                onChange={(e) => {
                  const value = e.target.value;
                 
                  if (value === '' || /^\d+$/.test(value)) {
                    setPrice(value);
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value) || 0;
                  setPrice(numValue.toString());
                }}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content 
              </label>
              <div className="space-y-4">
                {contentItems.map((item, index) => {
                  const canAdd = canAddType(index);
                  const isFilled = item.file !== null;
                  const label = getContentLabel(index);
                  const accept = getAcceptType(index);

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${!canAdd && !isFilled
                        ? "bg-gray-100 opacity-60"
                        : isFilled
                          ? "bg-[#4f7c82]/10 border-[#4f7c82]/30"
                          : "bg-white"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {index + 1}. {label}
                          </span>

                          {isFilled && (
                            <span className="text-xs bg-[#4f7c82] text-white px-2 py-1 rounded">
                               Uploaded
                            </span>
                          )}

                          {!canAdd && !isFilled && (
                            <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">
                              Complete previous step first
                            </span>
                          )}
                        </div>

                        
                        {index >= INITIAL_SET.length &&
                          (index - INITIAL_SET.length) % ADDITIONAL_SET.length === 0 && (
                            <button
                              type="button"
                              onClick={handleRemoveLastSet}
                              className="text-red-500 hover:text-red-700 text-sm font-semibold"
                              disabled={loading}
                            >
                              ✕ Remove Set
                            </button>
                          )}
                      </div>

                      {isFilled ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-white p-3 rounded border">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.file.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(item.file.size)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="text-black hover:text-black/80 ml-3"
                              disabled={loading}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                          {(item.type === "lab" || item.type === "activity") && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Marks 
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.totalMarks || ""}
                                onChange={(e) => handleTotalMarksChange(index, e.target.value)}
                                onBlur={(e) => {
                                  // Ensure it's a whole number on blur
                                  const value = e.target.value;
                                  if (value && /^\d+$/.test(value)) {
                                    const numValue = parseInt(value, 10);
                                    handleTotalMarksChange(index, numValue.toString());
                                  }
                                }}
                                placeholder="Enter total marks"
                                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                                required
                                disabled={loading}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept={accept}
                            onChange={(e) => handleFileSelect(index, e)}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                            disabled={loading || !canAdd}
                          />
                          {(item.type === "lab" || item.type === "activity") && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Marks 
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.totalMarks || ""}
                                onChange={(e) => handleTotalMarksChange(index, e.target.value)}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  if (value && /^\d+$/.test(value)) {
                                    const numValue = parseInt(value, 10);
                                    handleTotalMarksChange(index, numValue.toString());
                                  }
                                }}
                                placeholder="Enter total marks"
                                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                                required
                                disabled={loading || !canAdd}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {showQuizAndAddMoreButtons && (
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-[#4f7c82]/5 border border-[#4f7c82]/20 rounded-lg">
                    <button
                      type="button"
                      onClick={handleAddFinalQuiz}
                      className="w-full py-2 px-4 bg-[#4f7c82] text-white rounded hover:bg-[#3d6166] transition-colors font-medium"
                      disabled={loading}
                    >
                       Quiz
                    </button>
                  </div>
                  <div className="p-4 bg-[#4f7c82]/5 border border-[#4f7c82]/20 rounded-lg">
                    <button
                      type="button"
                      onClick={handleAddMore}
                      className="w-full py-2 px-4 bg-[#4f7c82] text-white rounded hover:bg-[#3d6166] transition-colors font-medium"
                      disabled={loading}
                    >
                      + Add More
                    </button>
                    <p className="text-xs text-[#4f7c82] mt-2 text-center">
                      This will add: Video → Lab → Activity
                    </p>
                  </div>
                </div>
              )}

              {hasQuiz && (
                <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#4f7c82]">  Quiz Created</p>
                      <p className="text-xs text-gray-700 mt-1">
                        {quizData?.mcqs?.length || 0} MCQ{quizData?.mcqs?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHasQuiz(false);
                        setQuizData(null);
                      }}
                      className="text-green-800 hover:text-green-900"
                      disabled={loading}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {nextRequired && !showQuizAndAddMoreButtons && !hasQuiz && (
                <div className="mt-4 p-3 bg-[#4f7c82]/5 border border-[#4f7c82]/20 rounded">
                  <p className="text-sm text-[#4f7c82]">
                    <strong>Next:</strong> Please upload {nextRequired.label} to continue.
                  </p>
                </div>
              )}
            </div>

            {hasQuiz && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-[#4f7c82] text-white flex-1"
                  disabled={loading || !allItemsFilled}
                  isLoading={loading}
                >
                  {loading ? "Saving..." : "Save Playlist"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>

      {showQuizBuilder && (
        <QuizBuilder
          onSave={handleQuizSave}
          onClose={() => {
            setShowQuizBuilder(false);
          }}
          initialQuizData={quizData}
        />
      )}
      </div>
    </>
  );
}