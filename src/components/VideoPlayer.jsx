"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/Button";
import axios from "axios";
import { useAlert } from "./usealert";
import AlertModal from "./AlertModal";


export default function VideoPlayer({ playlist, open, onClose, fullPage = false }) {
  const { alertState, hideAlert, showError, showWarning } = useAlert();
  const { user } = useSelector((state) => state.auth);
  const isStudent = user?.role === "student";
  const isInstructor = user?.role === "instructor";
  const isPlaylistOwner = isInstructor && playlist?.instructor === (user?.id || user?._id);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showQuizMCQs, setShowQuizMCQs] = useState(false);
  const [videoProgress, setVideoProgress] = useState({});
  const [videoTracking, setVideoTracking] = useState({});
  const [videoDurations, setVideoDurations] = useState({});
  const [activityProgress, setActivityProgress] = useState({});
  const [labProgress, setLabProgress] = useState({});
  const [quizProgress, setQuizProgress] = useState({});
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isUploadingLab, setIsUploadingLab] = useState(false);
  const [selectedLabFiles, setSelectedLabFiles] = useState({});
  const [isUploadingActivity, setIsUploadingActivity] = useState(false);
  const [selectedActivityFiles, setSelectedActivityFiles] = useState({});
  
  // Volume state with sessionStorage persistence
  const [savedVolume, setSavedVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('videoVolume');
      return saved !== null ? parseFloat(saved) : 1.0;
    }
    return 1.0;
  });
  
  const videoRefsMap = useRef(new Map());
  const saveProgressTimeoutRef = useRef(null);
  const progressLoadedRef = useRef(false);
  const unlockedItemsRef = useRef(new Set());

  useEffect(() => {
    if (window.innerWidth <= 425) {
      setIsCommentsOpen(false);
    }
  }, []);


  const allContent = useMemo(() => {
    let content = [];
    if (playlist?.content && playlist.content.length > 0) {
      content = [...playlist.content];
    } else if (playlist?.videos && playlist.videos.length > 0) {
      content = playlist.videos.map((video, index) => ({
        ...video,
        type: "video",
        order: index,
      }));
    }
    return content.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [playlist]);

  const firstVideo = useMemo(() => {
    return allContent.find((item) => item.type === "video");
  }, [allContent]);

  const remainingContent = useMemo(() => {
    return allContent;
  }, [allContent]);

  useEffect(() => {
    if (!open || !isStudent || !playlist?._id || !user?.id) {
      if (!open || !playlist?._id) {
        progressLoadedRef.current = false;
        setVideoProgress({});
        setActivityProgress({});
        setLabProgress({});
        setQuizProgress({});
        setVideoTracking({});
        setVideoDurations({});
        setPurchaseInfo(null);
        unlockedItemsRef.current.clear();
      }
      return;
    }

    const fetchPurchaseInfo = async () => {
      try {
        const response = await axios.get(`/api/payment/purchase?studentId=${user.id}&playlistId=${playlist._id}`);
        if (response.data && response.data.purchased && response.data.purchase) {
          setPurchaseInfo(response.data.purchase);
        }
      } catch (error) {
        console.error('Error fetching purchase info:', error);
      }
    };

    fetchPurchaseInfo();

    const loadFromLocalStorage = () => {
      try {
        const savedProgress = localStorage.getItem(`videoProgress_${playlist._id}`);
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          const converted = {};
          Object.keys(parsed).forEach((path) => {
            if (typeof parsed[path] === 'number') {
              const maxProgress = parsed[path];
              converted[path] = {
                progress: maxProgress,
                maxProgress: maxProgress,
                watched: maxProgress >= 40,
              };
            } else {
              const maxProgress = parsed[path].maxProgress || parsed[path].progress || 0;
              const isWatched = parsed[path].watched === true || maxProgress >= 40;
              converted[path] = {
                progress: parsed[path].progress || maxProgress || 0,
                maxProgress: maxProgress,
                watched: isWatched, 
              };
            }
          });
          setVideoProgress(converted);
          console.log('Loaded video progress from localStorage:', converted);
          return converted;
        }
      } catch (e) {
        console.error("Error loading video progress from localStorage:", e);
      }
      return null;
    };

    const localProgress = loadFromLocalStorage();

    if (!progressLoadedRef.current) {
      progressLoadedRef.current = true;

      const loadProgressFromAPI = async () => {
        try {
          const response = await axios.get(`/api/playlist/progress?studentId=${user.id}&playlistId=${playlist._id}`);
          if (response.data.success && response.data.progress) {
            const progressData = response.data.progress;

            const apiProgress = progressData.videoProgress || {};
            const converted = {};

            Object.keys(apiProgress).forEach((path) => {
              const progressItem = apiProgress[path];
              const maxProgress = progressItem.maxProgress || progressItem.progress || 0;
              const isWatched = progressItem.watched === true || maxProgress >= 40;
              converted[path] = {
                progress: progressItem.progress || 0,
                maxProgress: maxProgress,
                completed: progressItem.completed || false,
                watched: isWatched,
              };
            });

            setVideoProgress(converted);

            const loadedActivityProgress = progressData.activityProgress || {};
            const loadedLabProgress = progressData.labProgress || {};
            const loadedQuizProgress = progressData.quizProgress || {};

            const enhancedQuizProgress = {};
            Object.keys(loadedQuizProgress).forEach((key) => {
              const quizItem = loadedQuizProgress[key];
              const attemptsUsed = quizItem.quizAttempts || purchaseInfo?.quizAttempts || 0;
              enhancedQuizProgress[key] = {
                ...quizItem,
                attemptsRemaining: quizItem.attemptsRemaining !== undefined 
                  ? quizItem.attemptsRemaining 
                  : Math.max(0, 3 - attemptsUsed),
                quizAttempts: attemptsUsed,
              };
            });

            setActivityProgress(loadedActivityProgress);
            setLabProgress(loadedLabProgress);
            setQuizProgress(enhancedQuizProgress);


            Object.keys(loadedActivityProgress).forEach((order) => {
              if (loadedActivityProgress[order]?.completed === true) {
                unlockedItemsRef.current.add(order);
              }
            });
            Object.keys(loadedLabProgress).forEach((order) => {
              if (loadedLabProgress[order]?.completed === true) {
                unlockedItemsRef.current.add(order);
              }
            });
            Object.keys(loadedQuizProgress).forEach((order) => {
              if (loadedQuizProgress[order]?.completed === true) {
                unlockedItemsRef.current.add(order);
              }
            });

            // Also save to localStorage as cache
            try {
              localStorage.setItem(`videoProgress_${playlist._id}`, JSON.stringify(converted));
            } catch (e) {
              console.error('Error caching progress to localStorage:', e);
            }

            console.log('Loaded progress from API');
          }
        } catch (error) {
          console.error("Error loading progress from API:", error);
        }
      };

      loadProgressFromAPI();
    }
  }, [open, playlist?._id, isStudent, user?.id]);

  // Update quiz progress with attemptsRemaining when purchaseInfo is loaded
  useEffect(() => {
    if (!purchaseInfo || !isStudent) return;
    
    setQuizProgress((currentQuizProgress) => {
      const updated = {};
      let hasChanges = false;
      
      Object.keys(currentQuizProgress).forEach((key) => {
        const quizItem = currentQuizProgress[key];
        const attemptsUsed = purchaseInfo.quizAttempts || 0;
        const calculatedAttemptsRemaining = Math.max(0, 3 - attemptsUsed);
        
        // Only update if attemptsRemaining is undefined or different
        if (quizItem.attemptsRemaining === undefined || quizItem.quizAttempts !== attemptsUsed) {
          updated[key] = {
            ...quizItem,
            attemptsRemaining: calculatedAttemptsRemaining,
            quizAttempts: attemptsUsed,
          };
          hasChanges = true;
        } else {
          updated[key] = quizItem;
        }
      });
      
      return hasChanges ? updated : currentQuizProgress;
    });
  }, [purchaseInfo, isStudent]);


  useEffect(() => {
    if (!isStudent || !playlist?._id) return;

    // Mark all completed activities as unlocked
    Object.keys(activityProgress).forEach((order) => {
      if (activityProgress[order]?.completed === true) {
        unlockedItemsRef.current.add(order);
      }
    });


    Object.keys(labProgress).forEach((order) => {
      if (labProgress[order]?.completed === true) {
        unlockedItemsRef.current.add(order);
      }
    });

    Object.keys(quizProgress).forEach((order) => {
      if (quizProgress[order]?.completed === true) {
        unlockedItemsRef.current.add(order);
      }
    });
  }, [activityProgress, labProgress, quizProgress, isStudent, playlist?._id]);

  const calculateOverallProgress = useCallback(() => {
    if (!playlist || !allContent.length) return 0;

    let totalProgress = 0;
    let totalItems = 0;

    // Calculate video progress
    const videos = allContent.filter(item => item.type === "video");
    videos.forEach(video => {
      const videoData = videoProgress[video.path];
      if (videoData) {
        totalProgress += videoData.maxProgress || videoData.progress || 0;
      }
      totalItems += 100; // Each video contributes up to 100%
    });

    // Calculate activity progress (completed = 100%, not completed = 0%)
    const activities = allContent.filter(item => item.type === "activity");
    activities.forEach(activity => {
      const activityData = activityProgress[activity.order?.toString()];
      if (activityData?.completed) {
        totalProgress += 100;
      }
      totalItems += 100; // Each activity contributes up to 100%
    });

    // Calculate lab progress (completed = 100%, not completed = 0%)
    const labs = allContent.filter(item => item.type === "lab");
    labs.forEach(lab => {
      const labData = labProgress[lab.order?.toString()];
      if (labData?.completed) {
        totalProgress += 100;
      }
      totalItems += 100; // Each lab contributes up to 100%
    });

    // Calculate quiz progress (passed = 100%, attempted but not passed = 50%, not attempted = 0%)
    const quizzes = allContent.filter(item => item.type === "quiz");
    const hasPassedQuiz = quizzes.some(quiz => {
      const quizData = quizProgress[quiz.order?.toString()];
      return quizData?.passed === true;
    });

    // If quiz is passed, return 100% regardless of other content
    if (hasPassedQuiz) {
      return 100;
    }

    quizzes.forEach(quiz => {
      const quizData = quizProgress[quiz.order?.toString()];
      if (quizData?.passed) {
        totalProgress += 100;
      } else if (quizData?.completed) {
        totalProgress += 50; // Attempted but not passed
      }
      totalItems += 100; // Each quiz contributes up to 100%
    });

    return totalItems > 0 ? Math.round((totalProgress / totalItems) * 100) : 0;
  }, [allContent, videoProgress, activityProgress, labProgress, quizProgress, playlist]);

  // Helper function to save progress to API (with debouncing)
  const saveProgressToAPI = useCallback((progressData) => {
    if (!isStudent || !playlist?._id || !user?.id) return;


    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }

    saveProgressTimeoutRef.current = setTimeout(async () => {
      try {

        const overallProgress = calculateOverallProgress();


        const videos = allContent.filter(item => item.type === "video");
        const activities = allContent.filter(item => item.type === "activity");
        const labs = allContent.filter(item => item.type === "lab");
        const quizzes = allContent.filter(item => item.type === "quiz");

        const allVideosCompleted = videos.length > 0 && videos.every(video => {
          const videoData = videoProgress[video.path];
          return (videoData?.maxProgress || videoData?.progress || 0) >= 100;
        });

        const allActivitiesCompleted = activities.length === 0 || activities.every(activity => {
          const activityData = activityProgress[activity.order?.toString()];
          return activityData?.completed === true;
        });

        const allLabsCompleted = labs.length === 0 || labs.every(lab => {
          const labData = labProgress[lab.order?.toString()];
          return labData?.completed === true;
        });

        const allQuizzesPassed = quizzes.length === 0 || quizzes.every(quiz => {
          const quizData = quizProgress[quiz.order?.toString()];
          return quizData?.passed === true;
        });

        const allCompleted = allVideosCompleted && allActivitiesCompleted && allLabsCompleted && allQuizzesPassed;

        
        const hasPassedQuiz = quizzes.some(quiz => {
          const quizData = quizProgress[quiz.order?.toString()];
          return quizData?.passed === true;
        });

        const finalOverallProgress = hasPassedQuiz ? 100 : overallProgress;
        const finalCompleted = hasPassedQuiz ? true : allCompleted;

        const response = await axios.post('/api/playlist/progress', {
          studentId: user.id,
          playlistId: playlist._id,
          videoProgress: progressData,
          activityProgress: activityProgress,
          labProgress: labProgress,
          quizProgress: quizProgress,
          overallProgress: finalOverallProgress,
          completed: finalCompleted,
        });

        if (response.data && response.data.success) {
          // Also cache in localStorage
          try {
            localStorage.setItem(`videoProgress_${playlist._id}`, JSON.stringify(progressData));
          } catch (e) {
            console.error('Error caching progress to localStorage:', e);
          }
        } else {
          throw new Error(response.data?.message || 'Unknown error from API');
        }
      } catch (error) {
        console.error('Error saving progress to API:', error);
        // Fallback: save to localStorage
        try {
          localStorage.setItem(`videoProgress_${playlist._id}`, JSON.stringify(progressData));
        } catch (e) {
          console.error('Error saving progress to localStorage:', e);
        }
      }
    }, 5000); // 5 second debounce - reduced API calls
  }, [isStudent, playlist?._id, user?.id, calculateOverallProgress, allContent, videoProgress, activityProgress, labProgress, quizProgress]);
  useEffect(() => {
    if (playlist && allContent.length > 0) {
      setSelectedContent(firstVideo || allContent[0]);
      setSelectedIndex(0);
      // Reset quiz state when playlist changes
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  }, [playlist?._id, allContent, firstVideo]);


  useEffect(() => {
    if (selectedContent?.type === "quiz") {
      const quizOrder = selectedContent.order?.toString();
      const currentQuizProgress = quizProgress[quizOrder];
      const attemptsUsed = purchaseInfo?.quizAttempts || currentQuizProgress?.quizAttempts || 0;
      const isPassed = purchaseInfo?.quizPassed || currentQuizProgress?.passed || false;
      const attemptsRemaining = currentQuizProgress?.attemptsRemaining !== undefined
        ? currentQuizProgress.attemptsRemaining
        : (3 - attemptsUsed);

      // Only restore state if quiz has been completed before
      if (isPassed) {
        // If passed, keep submitted state and restore answers
        setQuizSubmitted(true);
        if (currentQuizProgress?.answers) {
          setQuizAnswers(currentQuizProgress.answers);
        }
      } else if (attemptsRemaining === 0) {
        // If attempts exhausted, keep submitted state and restore answers
        setQuizSubmitted(true);
        if (currentQuizProgress?.answers) {
          setQuizAnswers(currentQuizProgress.answers);
        }
      } else if (currentQuizProgress?.completed) {
        // If quiz was attempted but not passed, show results
        setQuizSubmitted(true);
        if (currentQuizProgress?.answers) {
          setQuizAnswers(currentQuizProgress.answers);
        }
      }
    }
  }, [selectedContent?._id, quizProgress, purchaseInfo]);

  // Load comments when video content changes
  useEffect(() => {
    const loadComments = async () => {
      if (selectedContent?.type === "video" && selectedContent?.path && playlist?._id) {
        setIsLoadingComments(true);
        try {
          const response = await axios.get(
            `/api/playlist/comments?videoId=${encodeURIComponent(selectedContent.path)}&playlistId=${playlist._id}`
          );
          if (response.data.success) {
            setComments(response.data.comments || []);
          }
        } catch (error) {
          console.error("Error loading comments:", error);
          setComments([]);
        } finally {
          setIsLoadingComments(false);
        }
      } else {
        setComments([]);
      }
    };

    loadComments();
  }, [selectedContent?.path, playlist?._id, selectedContent?.type]);

  // Function to post a new comment (for both students and instructors)
  const handlePostComment = async () => {
    const userId = user?.id || user?._id;
    console.log("Posting comment - User ID:", userId);
    console.log("Selected content:", selectedContent);
    console.log("Playlist ID:", playlist?._id);

    if (!userId) {
      showError("You must be logged in to comment", "Authentication Required");
      return;
    }

    if (!newComment.trim()) {
      showWarning("Please enter a comment", "Empty Comment");
      return;
    }

    if (!selectedContent || selectedContent.type !== "video" || !selectedContent.path) {
      showError("Cannot post comment on this content type", "Invalid Content");
      return;
    }

    setIsPostingComment(true);
    try {
      console.log("Sending comment request with data:", {
        videoId: selectedContent.path,
        playlistId: playlist?._id,
        userId: userId,
        text: newComment.trim(),
      });

      const response = await axios.post("/api/playlist/comments", {
        videoId: selectedContent.path,
        playlistId: playlist?._id,
        userId: userId,
        text: newComment.trim(),
      });

      console.log("Comment response:", response.data);

      if (response.data.success) {
        // Add new comment to the beginning of the list
        setComments((prev) => [response.data.comment, ...prev]);
        setNewComment(""); // Clear input
      } else {
        showError(response.data.message || "Failed to post comment", "Comment Error");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      console.error("Error response:", error.response?.data);
      showError(error.response?.data?.message || "Failed to post comment. Please try again.", "Comment Error");
    } finally {
      setIsPostingComment(false);
    }
  };

  // Handle Enter key press for comment
  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  // Handle Enter key press for reply
  const handleReplyKeyDown = (e, commentId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostReply(commentId);
    }
  };

  // Function to post a reply
  const handlePostReply = async (parentCommentId) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      showError("You must be logged in to reply", "Authentication Required");
      return;
    }

    if (!replyText.trim()) {
      showWarning("Please enter a reply", "Empty Reply");
      return;
    }

    if (!selectedContent || selectedContent.type !== "video" || !selectedContent.path) {
      showError("Cannot post reply on this content type", "Invalid Content");
      return;
    }

    setIsPostingComment(true);
    try {
      const response = await axios.post("/api/playlist/comments", {
        videoId: selectedContent.path,
        playlistId: playlist?._id,
        userId: userId,
        text: replyText.trim(),
        parentCommentId: parentCommentId,
      });

      if (response.data.success) {
        // Add reply to the parent comment
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === parentCommentId
              ? {
                ...comment,
                replies: [...(comment.replies || []), response.data.comment],
              }
              : comment
          )
        );
        setReplyText(""); // Clear input
        setReplyingTo(null); // Close reply box
      } else {
        showError(response.data.message || "Failed to post reply", "Reply Error");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      showError(error.response?.data?.message || "Failed to post reply. Please try again.", "Reply Error");
    } finally {
      setIsPostingComment(false);
    }
  };

  useEffect(() => {
    return () => {

      videoRefsMap.current.forEach((cleanup) => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      videoRefsMap.current.clear();


      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }


      progressLoadedRef.current = false;
    };
  }, [playlist?._id]);


  const findContentByOrder = useCallback((order) => {
    return allContent.find(item => item.order === order);
  }, [allContent]);


  const findPreviousContent = useCallback((currentContent) => {
    if (!currentContent) return null;
    const currentIndex = allContent.findIndex(item => item.order === currentContent.order);
    if (currentIndex <= 0) return null;
    return allContent[currentIndex - 1];
  }, [allContent]);


  const isContentUnlocked = useCallback((content, index) => {
    if (!isStudent) return true; // Instructors can access everything

    if (!content) return false;

    const contentKey = content.order?.toString() || index.toString();

    if (unlockedItemsRef.current.has(contentKey)) {
      return true;
    }

    if (index === 0) {
      unlockedItemsRef.current.add(contentKey);
      return true;
    }

    let shouldUnlock = false;

    // Check if it's a video
    if (content.type === "video") {

      const previousVideos = allContent.slice(0, index).filter(item => item.type === "video");
      if (previousVideos.length === 0) {

        shouldUnlock = true;
      } else {
        const previousContent = allContent[index - 1];
        if (previousContent && previousContent.type === "activity") {
          const activityProgressItem = activityProgress[previousContent.order?.toString()];
          shouldUnlock = activityProgressItem?.completed === true;
        } else {
          shouldUnlock = false;
        }
      }
    }

    else if (content.type === "lab") {

      const labProgressItem = labProgress[content.order?.toString()];
      if (labProgressItem?.completed === true) {
        shouldUnlock = true;
      } else {

        const previousContent = allContent[index - 1];
        if (previousContent && previousContent.type === "video") {
          const videoProgressItem = videoProgress[previousContent.path];
          shouldUnlock = videoProgressItem?.watched === true || (videoProgressItem?.maxProgress || 0) >= 40;
        } else {
          shouldUnlock = false;
        }
      }
    }
    else if (content.type === "activity") {
      const activityProgressItem = activityProgress[content.order?.toString()];
      if (activityProgressItem?.completed === true) {
        shouldUnlock = true;
      } else {
        const previousContent = allContent[index - 1];
        if (previousContent && previousContent.type === "lab") {
          const labProgressItem = labProgress[previousContent.order?.toString()];
          shouldUnlock = labProgressItem?.completed === true;
        } else {
          shouldUnlock = false;
        }
      }
    }
    else if (content.type === "quiz") {
      const quizProgressItem = quizProgress[content.order?.toString()];
      if (quizProgressItem?.completed === true) {
        shouldUnlock = true;
      } else {
        const previousContent = allContent[index - 1];
        if (previousContent && previousContent.type === "activity") {
          const activityProgressItem = activityProgress[previousContent.order?.toString()];
          shouldUnlock = activityProgressItem?.completed === true;
        } else {
          const allPreviousContent = allContent.slice(0, index);
          shouldUnlock = allPreviousContent.every(item => {
            if (item.type === "video") {
              const videoProgressItem = videoProgress[item.path];
              return videoProgressItem?.completed === true || (videoProgressItem?.maxProgress || 0) >= 100;
            } else if (item.type === "activity") {
              const activityProgressItem = activityProgress[item.order?.toString()];
              return activityProgressItem?.completed === true;
            } else if (item.type === "lab") {
              const labProgressItem = labProgress[item.order?.toString()];
              return labProgressItem?.completed === true;
            }
            return true;
          });
        }
      }
    }

    if (shouldUnlock) {
      unlockedItemsRef.current.add(contentKey);
    }

    return shouldUnlock;
  }, [isStudent, allContent, videoProgress, activityProgress, labProgress, quizProgress]);

  const handleContentClick = useCallback((content, index) => {
    if (!isStudent || isContentUnlocked(content, index)) {
      setSelectedContent(content);
      setSelectedIndex(index);

    }
  }, [isStudent, isContentUnlocked, labProgress, playlist?._id, user?.id]);

  const handleVideoTimeUpdate = useCallback((e, videoPath) => {
    if (!isStudent) return;
    const video = e.target;
    const currentTime = video.currentTime;
    const duration = video.duration;

    if (duration <= 0) return;

    setVideoTracking((prevTracking) => {
      const tracking = prevTracking[videoPath] || { lastTime: 0, isPlaying: false, maxTimeReached: 0 };

      if (tracking.isPlaying && currentTime >= tracking.lastTime) {
        const timeDiff = currentTime - tracking.lastTime;
        const savedMaxTime = tracking.maxTimeReached || 0;


        if (timeDiff > 0 && timeDiff < 5 && currentTime > savedMaxTime) {
          const maxTimeReached = currentTime;

          const progress = (maxTimeReached / duration) * 100;

          setVideoProgress((prevProgress) => {
            const progressData = prevProgress[videoPath] || { progress: 0, maxProgress: 0 };
            const newMaxProgress = Math.max(progressData.maxProgress || 0, progress);


            const existingProgress = prevProgress[videoPath] || { progress: 0, maxProgress: 0, watched: false };
            const isWatched = existingProgress.watched === true || newMaxProgress >= 40;

            const newData = {
              ...prevProgress,
              [videoPath]: {
                progress: Math.min(progress, 100),
                maxProgress: Math.min(newMaxProgress, 100),
                watched: isWatched
              }
            };

            if (playlist?._id) {
              try {
                localStorage.setItem(`videoProgress_${playlist._id}`, JSON.stringify(newData));
              } catch (e) {
                console.error('Error saving progress to localStorage:', e);
              }
            }

            // Only call saveProgressToAPI every 10 seconds (throttle)
            const now = Date.now();
            const lastSaveTime = window._lastProgressSaveTime || 0;
            if (now - lastSaveTime > 10000) {
              window._lastProgressSaveTime = now;
              saveProgressToAPI(newData);
            }

            return newData;
          });

          return {
            ...prevTracking,
            [videoPath]: {
              ...tracking,
              lastTime: currentTime,
              maxTimeReached: maxTimeReached
            }
          };
        }
      }

      return {
        ...prevTracking,
        [videoPath]: {
          ...tracking,
          lastTime: currentTime
        }
      };
    });
  }, [isStudent, playlist?._id, saveProgressToAPI]);


  const handleVideoPlay = useCallback((e, videoPath) => {
    if (!isStudent) return;
    const video = e.target;
    const duration = video.duration;
    const currentTime = video.currentTime;


    if (duration > 0) {
      setVideoDurations((prev) => ({
        ...prev,
        [videoPath]: duration
      }));
    }


    setVideoProgress((prevProgress) => {
      const progressData = prevProgress[videoPath] || { progress: 0, maxProgress: 0 };
      const savedMaxProgress = progressData.maxProgress || 0;
      const savedMaxTime = duration > 0 ? (savedMaxProgress / 100) * duration : 0;


      setVideoTracking((prevTracking) => {
        const tracking = prevTracking[videoPath] || { lastTime: 0, isPlaying: false, maxTimeReached: 0 };
        return {
          ...prevTracking,
          [videoPath]: {
            lastTime: currentTime,
            isPlaying: true,
            maxTimeReached: Math.max(tracking.maxTimeReached || 0, savedMaxTime)
          }
        };
      });

      return prevProgress;
    });
  }, [isStudent, videoProgress, videoTracking]);

  const handleVideoSeeked = useCallback((e, videoPath) => {
    if (!isStudent) return;
    const video = e.target;
    const currentTime = video.currentTime;
    const tracking = videoTracking[videoPath] || { lastTime: 0, isPlaying: false, maxTimeReached: 0 };


    setVideoTracking((prev) => ({
      ...prev,
      [videoPath]: {
        ...tracking,
        lastTime: currentTime,
        maxTimeReached: tracking.maxTimeReached || 0
      }
    }));
  }, [isStudent, videoTracking]);

  const handleVideoPause = useCallback((e, videoPath) => {
    if (!isStudent) return;
    const video = e.target;
    const duration = video.duration;
    const currentTime = video.currentTime;

    if (duration <= 0) return;

    // Use functional updates to get latest state
    setVideoTracking((prevTracking) => {
      const tracking = prevTracking[videoPath] || { lastTime: 0, isPlaying: false, maxTimeReached: 0 };

      // Use the maximum of saved maxTimeReached and current time (never decrease)
      const maxTimeReached = Math.max(tracking.maxTimeReached || 0, currentTime);
      const progress = (maxTimeReached / duration) * 100;

      // Update progress state - NEVER decrease progress
      setVideoProgress((prevProgress) => {
        const progressData = prevProgress[videoPath] || { progress: 0, maxProgress: 0 };
        // Always keep the maximum progress (never decrease)
        const newMaxProgress = Math.max(progressData.maxProgress || 0, progress);

        // Once watched (>= 40%), keep watched flag true permanently
        const existingProgress = prevProgress[videoPath] || { progress: 0, maxProgress: 0, watched: false };
        const isWatched = existingProgress.watched === true || newMaxProgress >= 40;

        const newData = {
          ...prevProgress,
          [videoPath]: {
            progress: Math.min(progress, 100),
            maxProgress: Math.min(newMaxProgress, 100),
            watched: isWatched // Permanent once true
          }
        };

        // Immediately save to localStorage for instant persistence
        if (playlist?._id) {
          try {
            localStorage.setItem(`videoProgress_${playlist._id}`, JSON.stringify(newData));
          } catch (e) {
            console.error('Error saving progress to localStorage:', e);
          }
        }

        // Save to API (with debouncing)
        saveProgressToAPI(newData);

        return newData;
      });

      return {
        ...prevTracking,
        [videoPath]: {
          ...tracking,
          isPlaying: false,
          lastTime: currentTime,
          maxTimeReached: maxTimeReached
        }
      };
    });
  }, [isStudent, playlist?._id, saveProgressToAPI]);

  // Handle video ended event - mark as 100% watched
  const handleVideoEnded = useCallback((e, videoPath) => {
    if (!isStudent) return;
    const video = e.target;
    const duration = video.duration;

    if (duration <= 0) return;

    // Mark video as 100% watched when it ends - NEVER decrease from 100%
    setVideoProgress((prevProgress) => {
      const progressData = prevProgress[videoPath] || { progress: 0, maxProgress: 0 };
      // Always keep maximum - if already 100%, don't change
      const newMaxProgress = Math.max(progressData.maxProgress || 0, 100);


      const existingProgress = prevProgress[videoPath] || { progress: 0, maxProgress: 0, watched: false };
      const isWatched = true;

      const newData = {
        ...prevProgress,
        [videoPath]: {
          progress: 100,
          maxProgress: newMaxProgress,
          watched: isWatched
        }
      };

      if (playlist?._id) {
        try {
          localStorage.setItem(`videoProgress_${playlist._id}`, JSON.stringify(newData));
        } catch (e) {
          console.error('Error saving progress to localStorage:', e);
        }
      }

      if (isStudent && playlist?._id && user?.id) {
        saveProgressToAPI(newData);
      }

      return newData;
    });

    setVideoTracking((prevTracking) => ({
      ...prevTracking,
      [videoPath]: {
        ...prevTracking[videoPath] || { lastTime: 0, isPlaying: false, maxTimeReached: 0 },
        isPlaying: false,
        lastTime: duration,
        maxTimeReached: duration
      }
    }));
  }, [isStudent, playlist?._id, user?.id]);

  if (!playlist || allContent.length === 0) {
    if (fullPage) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">No content available</p>
        </div>
      );
    }
    return null;
  }

  if (!open && !fullPage) {
    return null;
  }

  const getContentIcon = (type) => {
    switch (type) {
      case "video":
        return "";
      case "activity":
        return "";
      case "lab":
        return "";
      case "quiz":
        return "";
      default:
        return "";
    }
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case "video":
        return "Video";
      case "activity":
        return "Activity";
      case "lab":
        return "Lab";
      case "quiz":
        return "Quiz";
      default:
        return "Content";
    }
  };

  const renderContent = (content) => {
    if (!content) return null;

    if (content.type === "video") {
      return (
        <div className="w-full">
          <video
            key={content.path}
            ref={(el) => {
              if (!el || !isStudent) return;

              if (videoRefsMap.current.has(content.path)) return;

              const handleError = (e) => {
                console.error("Video error:", e);
                console.error("Video path:", content.path);
                console.error("Error code:", el.error?.code);
                console.error("Error message:", el.error?.message);
                
                // Show user-friendly error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center';
                errorDiv.innerHTML = `
                  <div>
                    <p class="text-lg font-semibold mb-2">Video Not Available</p>
                    <p class="text-sm">This video file is missing or corrupted.</p>
                    <p class="text-xs mt-2 text-gray-300">Please contact the instructor.</p>
                  </div>
                `;
                el.parentElement?.appendChild(errorDiv);
              };

              const handleVolumeChange = () => {
                // Save volume to sessionStorage whenever it changes
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('videoVolume', el.volume.toString());
                  setSavedVolume(el.volume);
                }
              };

              const handleLoadedMetadata = () => {
                console.log("Video loaded:", content.path, "Duration:", el.duration);
                
                // Apply saved volume
                el.volume = savedVolume;
                
                if (el.duration > 0) {
                  setVideoDurations((prev) => ({
                    ...prev,
                    [content.path]: el.duration
                  }));

                  if (isStudent) {
                    const progressData = videoProgress[content.path];
                    if (progressData && progressData.maxProgress > 0) {
                      const savedTime = (progressData.maxProgress / 100) * el.duration;
                      if (savedTime > 0 && savedTime < el.duration) {
                        setTimeout(() => {
                          el.currentTime = savedTime;
                          setVideoTracking((prev) => ({
                            ...prev,
                            [content.path]: {
                              lastTime: savedTime,
                              isPlaying: false,
                              maxTimeReached: savedTime
                            }
                          }));
                        }, 50);
                      }
                    }
                  }
                }
              };

              const handleTimeUpdate = (e) => handleVideoTimeUpdate(e, content.path);
              const handlePlay = (e) => handleVideoPlay(e, content.path);
              const handlePause = (e) => handleVideoPause(e, content.path);
              const handleEnded = (e) => handleVideoEnded(e, content.path);
              const handleSeeked = (e) => handleVideoSeeked(e, content.path);

              el.addEventListener('error', handleError);
              el.addEventListener('volumechange', handleVolumeChange);
              el.addEventListener('loadedmetadata', handleLoadedMetadata);
              el.addEventListener('timeupdate', handleTimeUpdate);
              el.addEventListener('play', handlePlay);
              el.addEventListener('pause', handlePause);
              el.addEventListener('ended', handleEnded);
              el.addEventListener('seeked', handleSeeked);


              videoRefsMap.current.set(content.path, () => {
                el.removeEventListener('error', handleError);
                el.removeEventListener('volumechange', handleVolumeChange);
                el.removeEventListener('loadedmetadata', handleLoadedMetadata);
                el.removeEventListener('timeupdate', handleTimeUpdate);
                el.removeEventListener('play', handlePlay);
                el.removeEventListener('pause', handlePause);
                el.removeEventListener('ended', handleEnded);
                el.removeEventListener('seeked', handleSeeked);
              });
            }}
            controls
            preload="metadata"
            className="w-full rounded-lg"
            style={{ maxHeight: "60vh" }}
            onError={(e) => {
              console.error("Video element error:", e);
              console.error("Video src:", content.path);
            }}
            onLoadedData={(e) => {
              // Also set volume when video data is loaded (backup)
              e.target.volume = savedVolume;
            }}
          >
            <source src={content.path} type={content.mimetype} />
            Your browser does not support the video tag.
          </video>
          
          {/* Video Description */}
          {playlist?.description && (
            <div className="mt-3 sm:mt-4 ">
              {/* <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-gray-700 mb-1 sm:mb-2">Description</h4> */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{playlist.description}</p>
            </div>
          )}

          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex">
                {/* <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg> */}
                <h3 className="text-sm sm:text-base lg:text-md tracking-tight font-medium sm:font-medium text-gray-800">
                  Comments ({comments.length})
                </h3>
              </div>

              <button
                onClick={() => setIsCommentsOpen(prev => !prev)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label={isCommentsOpen ? "Close comments" : "Open comments"}
              >
                {isCommentsOpen ? (
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
                ) : (
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
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                )}
              </button>
            </div>

            {isCommentsOpen && (
              <div className="max-h-96 overflow-y-auto">
                {(isStudent || isInstructor) && user && (
                  <div className="mb-6">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Write a comment.."
                      maxLength={1000}
                      className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-[#4f7c82] focus:outline-none transition-colors"
                    />
                    {newComment.trim() && (
                      <div className="flex items-center justify-end gap-2 mt-3">
                        <button
                          onClick={() => setNewComment("")}
                          className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-xs tracking-tight sm:text-sm font-normal"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePostComment}
                          disabled={isPostingComment}
                          className="px-3 sm:px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] tracking-tight disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-normal"
                        >
                          {isPostingComment ? "Posting..." : "Comment"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {isLoadingComments ? (
                  <div className="text-center py-8 text-black/60">
                    <p>Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-black/60">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {comments.map((comment, index) => {
                      const commentUserId = comment.userId?._id?.toString() || comment.userId?._id;
                      const playlistInstructorId = playlist?.instructor?.toString() || playlist?.instructor;
                      const isCommentAuthor = comment.userId?.role === "instructor" &&
                        commentUserId === playlistInstructorId;

                      const getTimeAgo = (date) => {
                        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
                        const intervals = {
                          year: 31536000,
                          month: 2592000,
                          week: 604800,
                          day: 86400,
                          hour: 3600,
                          minute: 60
                        };

                        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
                          const interval = Math.floor(seconds / secondsInUnit);
                          if (interval >= 1) {
                            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
                          }
                        }
                        return 'just now';
                      };

                      return (
                        <div key={comment._id}>
                          <div
                            className="flex items-start gap-3 py-3"
                          >
                            {comment.userId?.profilePicture ? (
                              <img
                                src={comment.userId.profilePicture}
                                alt={comment.userId.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-[#4f7c82] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-lg">
                                  {comment.userId?.name?.charAt(0)?.toUpperCase() || "U"}
                                </span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900 text-sm">
                                  @{comment.userId?.name?.toLowerCase().replace(/\s+/g, '') || "unknown"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(comment.createdAt)}
                                </span>
                                {comment.userId?.role === "instructor" && (
                                  <span className="bg-[#4f7c82] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    Instructor
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                          {index < comments.length - 1 && (
                            <div className="border-b border-gray-200"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      );
    } else if (content.type === "quiz" && content.quizData) {
      const handleAnswerSelect = (mcqIndex, optionIndex) => {
        if (quizSubmitted) return;
        setQuizAnswers((prev) => ({
          ...prev,
          [mcqIndex]: optionIndex,
        }));
      };

      const handleSubmitQuiz = async () => {
        const totalQuestions = content.quizData.mcqs?.length || 0;
        const answeredQuestions = Object.keys(quizAnswers).length;

        if (answeredQuestions < totalQuestions) {
          showWarning(`Please answer all ${totalQuestions} questions before submitting.`, "Incomplete Quiz");
          return;
        }

        const attemptsUsed = purchaseInfo?.quizAttempts || quizProgress[content.order?.toString()]?.quizAttempts || 0;
        const isPassed = purchaseInfo?.quizPassed || quizProgress[content.order?.toString()]?.passed || false;

        if (attemptsUsed >= 3 && !isPassed) {
          showError("You have exhausted all 3 attempts. Please repurchase the playlist to try again.", "No Attempts Remaining");
          return;
        }

        setQuizSubmitted(true);

        let totalScore = 0;
        let calculatedTotalMarks = 0;


        content.quizData.mcqs?.forEach((mcq) => {
          const mcqMarks = parseFloat(mcq.marks) || 1;
          calculatedTotalMarks += mcqMarks;
        });

        content.quizData.mcqs?.forEach((mcq, index) => {
          const selectedAnswer = quizAnswers[index];
          const correctAnswer = parseInt(mcq.correctAnswer);
          const mcqMarks = parseFloat(mcq.marks) || 1;

          if (selectedAnswer === correctAnswer) {
            totalScore += mcqMarks;
          }
        });

        const totalMarks = content.quizData.totalMarks || calculatedTotalMarks;

        const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
        const passed = percentage >= 50;

        if (isStudent && content.order !== undefined) {
        
          const currentAttempts = purchaseInfo?.quizAttempts || quizProgress[content.order?.toString()]?.quizAttempts || 0;
          const newAttemptsUsed = currentAttempts + 1;
          const calculatedAttemptsRemaining = Math.max(0, 3 - newAttemptsUsed);
          
          const newQuizProgress = {
            ...quizProgress,
            [content.order.toString()]: {
              contentOrder: content.order,
              completed: true,
              attemptedAt: new Date(),
              score: totalScore,
              totalMarks: totalMarks,
              percentage: percentage,
              passed: passed,
              passedAt: passed ? new Date() : null,
              answers: quizAnswers,
              quizAttempts: newAttemptsUsed,
              attemptsRemaining: calculatedAttemptsRemaining,
            }
          };
          setQuizProgress(newQuizProgress);

          const contentKey = content.order?.toString();
          if (contentKey) {
            unlockedItemsRef.current.add(contentKey);
          }

          try {
            await axios.post('/api/playlist/progress', {
              studentId: user.id,
              playlistId: playlist._id,
              quizProgress: newQuizProgress,
              completed: passed,
            });

            const quizResponse = await axios.post('/api/payment/quiz-complete', {
              studentId: user.id,
              playlistId: playlist._id,
              quizPassed: passed,
              score: totalScore,
              totalMarks: totalMarks,
              percentage: percentage,
            });

            if (quizResponse.data && quizResponse.data.purchase) {
              const updatedProgress = {
                ...newQuizProgress,
                [content.order.toString()]: {
                  ...newQuizProgress[content.order.toString()],
                  attemptsRemaining: quizResponse.data.purchase.attemptsRemaining || 0,
                  quizAttempts: quizResponse.data.purchase.quizAttempts || 0,
                }
              };
              setQuizProgress(updatedProgress);

              setPurchaseInfo({
                ...purchaseInfo,
                quizAttempts: quizResponse.data.purchase.quizAttempts || 0,
                quizPassed: quizResponse.data.purchase.quizPassed || false,
              });

              setTimeout(() => {
                saveProgressToAPI(videoProgress);
              }, 100);
            }
          } catch (error) {
            console.error('Error saving quiz progress:', error);
            if (error.response?.data?.message) {
              showError(error.response.data.message, "Quiz Submission Error");
            }
          }
        }
      };

      const showAnswers = quizSubmitted || !isStudent;

      if (isStudent && !quizStarted && !quizSubmitted) {
        return (
          <div className="w-full">
            <div className="bg-white rounded-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-black mb-2">
                   Quiz
                </h3>
                <p className="text-black/70 mb-2">
                  {content.quizData.mcqs?.length || 0} MCQ{content.quizData.mcqs?.length !== 1 ? "s" : ""}
                </p>
                {content.quizData.totalMarks && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-lg font-semibold text-gray-800">
                      Total Marks: <span className="text-[#4f7c82]">{content.quizData.totalMarks}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Minimum 50% required to pass ({content.quizData.totalMarks * 0.5} marks)
                    </p>
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-gray-600">
                        Maximum 3 attempts allowed
                      </p>
                      {purchaseInfo && !purchaseInfo.quizPassed && (
                        <p className={`text-sm font-medium ${purchaseInfo.quizAttempts >= 3 && !purchaseInfo.quizPassed
                          ? "text-red-600"
                          : purchaseInfo.quizAttempts > 0
                            ? "text-gray-700"
                            : "text-gray-600"
                          }`}>
                          Attempts used: {purchaseInfo.quizAttempts || 0} / 3 ({3 - (purchaseInfo.quizAttempts || 0)} remaining)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center mt-6">
                {purchaseInfo && purchaseInfo.quizAttempts >= 3 && !purchaseInfo.quizPassed ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-[#4f7c82] font-medium">
                      All 3 attempts used. You have 1 year access to this playlist.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuizStarted(true)}
                    className="px-8 py-3 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] font-medium text-lg"
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="w-full">
          <div className="bg-white rounded-lg p-6">
            {isStudent && quizSubmitted && showQuizMCQs ? (
              <>

                {/* <div className="mb-4">
                  <button
                    onClick={() => setShowQuizMCQs(false)}
                    className="flex items-center gap-2 text-[#4f7c82] hover:text-[#3f6468] font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Summary
                  </button>
                </div> */}


                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-black mb-2">
                    Quiz Results
                  </h3>
                  <p className="text-black/70">
                    Review your answers
                  </p>
                </div>


                <div className="space-y-6">
                  {content.quizData.mcqs?.map((mcq, index) => {
                    const savedAnswers = quizProgress[content.order?.toString()]?.answers || quizAnswers;
                    const selectedAnswer = savedAnswers[index];
                    const correctAnswer = parseInt(mcq.correctAnswer);
                    const isCorrect = selectedAnswer === correctAnswer;

                    return (
                      <div key={index} className="border border-black/10 rounded-lg p-4 bg-white">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#4f7c82] bg-[#4f7c82]/10 px-2 py-1 rounded">
                              MCQ {index + 1}
                            </span>
                            {mcq.marks && (
                              <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {mcq.marks} mark{mcq.marks !== 1 ? "s" : ""}
                              </span>
                            )}
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${isCorrect
                              ? "bg-gray-100 text-[#4f7c82]"
                              : "bg-gray-200"
                              }`}>
                              {isCorrect ? " Correct" : " Incorrect"}
                            </span>
                          </div>
                          <p className="font-medium text-black text-lg">
                            {mcq.question}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {mcq.options?.map((option, optIndex) => {
                            const isSelected = selectedAnswer === optIndex;
                            const isCorrectOption = correctAnswer === optIndex;

                            let bgColor = "bg-white";
                            let borderColor = "border-black/10";

                            if (isCorrectOption) {
                              bgColor = "bg-green-50";
                              borderColor = "border-green-300";
                            } else if (isSelected && !isCorrect) {
                              bgColor = "bg-red-50";
                              borderColor = "border-red-300";
                            }

                            return (
                              <div
                                key={optIndex}
                                className={`border-2 ${borderColor} ${bgColor} rounded-lg p-3 cursor-not-allowed`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCorrectOption
                                      ? "border-green-500 bg-green-500"
                                      : isSelected
                                        ? "border-red-500 bg-red-500"
                                        : "border-gray-300"
                                    }`}>
                                    {(isSelected || isCorrectOption) && (
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                  </div>
                                  <span className="text-black font-medium">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span className="text-black flex-1">{option}</span>
                                  {isCorrectOption && (
                                    <span className="text-[#4f7c82] font-semibold text-sm">Correct Answer</span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="font-semibold text-sm">Your Answer</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  {/* <h3 className="text-2xl font-semibold text-black mb-2">
                    Final Quiz
                  </h3> */}
                  <p className="text-black/70 mb-2">
                    {content.quizData.mcqs?.length || 0} MCQ{content.quizData.mcqs?.length !== 1 ? "s" : ""}
                  </p>
                  {content.quizData.totalMarks && !quizSubmitted && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-lg font-semibold text-gray-800">
                        Total Marks: <span className="text-[#4f7c82]">{content.quizData.totalMarks}</span>
                      </p>
                    </div>
                  )}
                </div>

                {!quizSubmitted && (
                  <div className="space-y-6">
                    {content.quizData.mcqs?.map((mcq, index) => {
                      const selectedAnswer = quizAnswers[index];
                      const correctAnswer = parseInt(mcq.correctAnswer);
                      const isCorrect = selectedAnswer === correctAnswer;

                      return (
                        <div key={index} className="border border-black/10 rounded-lg p-4 bg-white">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-sm font-semibold text-[#4f7c82] bg-[#4f7c82]/10 px-2 py-1 rounded">
                                MCQ {index + 1}
                              </span>
                              {mcq.marks && (
                                <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                  {mcq.marks} mark{mcq.marks !== 1 ? "s" : ""}
                                </span>
                              )}
                              <span className="text-xs text-black/60">
                                {mcq.options?.length || 0} options
                              </span>
                              {/* {quizSubmitted && isStudent && !quizProgress[content.order?.toString()]?.passed && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${isCorrect
                            ? "bg-[#4f7c82]/10 text-[#4f7c82]"
                            : "bg-black/10 text-black"
                            }`}>
                            {isCorrect ? `✓ Correct (+${mcq.marks || 0})` : "✗ Incorrect (0)"}
                          </span>
                        )} */}
                            </div>
                            <p className="font-medium text-black text-lg">
                              {mcq.question}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {mcq.options?.map((option, optIndex) => {
                              const isSelected = selectedAnswer === optIndex;
                              const isCorrectOption = correctAnswer === optIndex;

                              let bgColor = "bg-white";
                              let borderColor = "border-black/10";
                              let textColor = "text-black";

                            
                              if (showAnswers && isCorrectOption) {
                                bgColor = "bg-[#4f7c82]/10";
                                borderColor = "border-[#4f7c82]/30";
                              }

                              if (isStudent && !showAnswers && isSelected) {
                                bgColor = "bg-[#4f7c82]/5";
                                borderColor = "border-[#4f7c82]/30";
                              }

                              if (quizSubmitted && isStudent && isSelected && !isCorrectOption) {
                                bgColor = "bg-black/5";
                                borderColor = "border-black/20";
                                textColor = "text-black";
                              }

                              return (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded border transition-colors ${bgColor} ${borderColor} ${isStudent && !quizSubmitted ? "cursor-pointer hover:bg-[#4f7c82]/5" : ""
                                    }`}
                                  onClick={() => isStudent && !quizSubmitted && handleAnswerSelect(index, optIndex)}
                                >
                                  <div className="flex items-center gap-2">
                                    {isStudent && !quizSubmitted ? (
                                      <>
                                        <input
                                          type="radio"
                                          name={`mcq-${index}`}
                                          checked={isSelected}
                                          onChange={() => handleAnswerSelect(index, optIndex)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-4 h-4 text-[#4f7c82]"
                                        />
                                        <span className="font-semibold text-black/70">
                                          {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                      </>
                                    ) : (
                                      <span className="font-semibold text-black/70">
                                        {String.fromCharCode(65 + optIndex)}.
                                      </span>
                                    )}
                                    <span className={`flex-1 ${textColor}`}>{option}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {isStudent && !quizSubmitted && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleSubmitQuiz}
                  variant="primary"
                  className="bg-[#4f7c82] text-white hover:bg-[#3d6166] px-8 py-3 text-lg font-semibold"
                >
                  Submit Quiz
                </Button>
              </div>
            )}

            {isStudent && quizSubmitted && quizProgress[content.order?.toString()] && (
              <div className="mt-6 p-6 rounded-lg border border-gray-300 bg-white">

                <div className="mb-4 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Result Summary</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let correctCount = 0;
                        let incorrectCount = 0;

                        const savedAnswers = quizProgress[content.order?.toString()]?.answers || quizAnswers;

                        content.quizData.mcqs?.forEach((mcq, index) => {
                          const selectedAnswer = savedAnswers[index];
                          const correctAnswer = parseInt(mcq.correctAnswer);
                          if (selectedAnswer === correctAnswer) {
                            correctCount++;
                          } else {
                            incorrectCount++;
                          }
                        });

                        const obtainedMarks = quizProgress[content.order?.toString()].score?.toFixed(2) || 0;
                        const totalMarks = content.quizData?.totalMarks || quizProgress[content.order?.toString()].totalMarks || 0;
                        const totalMCQs = content.quizData.mcqs?.length || 0;

                        return (
                          <>
                            <tr className="bg-white">
                              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Total MCQs</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-[#4f7c82]">{totalMCQs}</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Total Marks</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-[#4f7c82]">{totalMarks}</td>
                            </tr>
                            <tr className="bg-white">
                              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Obtained Marks</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-[#4f7c82]">{obtainedMarks}</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Correct MCQs</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-[#4f7c82]">{correctCount}</td>
                            </tr>
                            <tr className="bg-white">
                              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Incorrect MCQs</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-[#4f7c82]">{incorrectCount}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                <p className={`text-center font-semibold mb-4 ${quizProgress[content.order?.toString()].passed
                  ? "text-[#4f7c82]"
                  : quizProgress[content.order?.toString()].attemptsRemaining === 0
                    ? "text-[#4f7c82]"
                    : "text-[#4f7c82]"
                  }`}>
                  {quizProgress[content.order?.toString()].passed
                    ? " Quiz Passed! You have earned lifetime access!"
                    : quizProgress[content.order?.toString()].attemptsRemaining === 0
                      ? " All 3 attempts used. You have 1 year access to this playlist."
                      : ` Quiz Failed. You need 50% to pass.`}
                </p>

                {/* <div className="text-center mb-4">
                  <button
                    onClick={() => setShowQuizMCQs(!showQuizMCQs)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                  >
                    {showQuizMCQs ? "Hide MCQs" : "View MCQs"}
                  </button>
                </div> */}


                {!quizProgress[content.order?.toString()].passed && quizProgress[content.order?.toString()].attemptsRemaining !== undefined && (
                  <div className="text-center text-sm mt-2">
                    {quizProgress[content.order?.toString()].attemptsRemaining === 0 ? (
                      null
                    ) : (
                      <>
                        <p className=" font-medium mb-3">
                          Attempts remaining: {quizProgress[content.order?.toString()].attemptsRemaining}
                        </p>
                        <Button
                          onClick={() => {
                            const attemptsUsed = purchaseInfo?.quizAttempts || quizProgress[content.order?.toString()]?.quizAttempts || 0;
                            const attemptsRemaining = quizProgress[content.order?.toString()]?.attemptsRemaining !== undefined
                              ? quizProgress[content.order?.toString()].attemptsRemaining
                              : (3 - attemptsUsed);

                            if (attemptsRemaining > 0) {
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                              setShowQuizMCQs(false);
                            } else {
                              showError("You have exhausted all 3 attempts. Please repurchase the playlist to try again.", "No Attempts Remaining");
                            }
                          }}
                          className="bg-[#4f7c82] hover:bg-[#3f6468] text-white px-6 py-2 rounded-lg font-medium"
                        >
                          Retake Quiz
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else if (content.type === "lab") {
      const labProgressItem = labProgress[content.order?.toString()];
      const isCompleted = labProgressItem?.completed === true;
      const selectedFile = selectedLabFiles[content.order];

      const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          setSelectedLabFiles(prev => ({ ...prev, [content.order]: file }));
        }
      };

      const handleLabUpload = async () => {
        const file = selectedLabFiles[content.order];
        if (!file || !isStudent) {
          showWarning("Please select a file to upload", "No File Selected");
          return;
        }

        setIsUploadingLab(true);
        try {
          const formData = new FormData();
          formData.append("studentId", user.id);
          formData.append("playlistId", playlist._id);
          formData.append("contentOrder", content.order);
          formData.append("file", file);

          const response = await axios.post('/api/playlist/lab-submission', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.data.success) {
            const updatedLabProgress = response.data.labProgress;
            setLabProgress(updatedLabProgress);
            const contentKey = content.order?.toString();
            if (contentKey) {
              unlockedItemsRef.current.add(contentKey);
            }
            setSelectedLabFiles(prev => {
              const updated = { ...prev };
              delete updated[content.order];
              return updated;
            });

            setTimeout(() => {
              saveProgressToAPI(videoProgress);
            }, 100);

            // alert("Lab submitted successfully!");
          }
        } catch (error) {
          console.error('Error uploading lab:', error);
          showError(error.response?.data?.message || "Failed to upload lab. Please try again.", "Upload Error");
        } finally {
          setIsUploadingLab(false);
        }
      };

      return (
        <div className="w-full flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="flex flex-col justify-center">
                <div className="text-center mb-2 sm:mb-6">
                  <div className="text-3xl sm:text-5xl lg:text-6xl mb-2 sm:mb-4">{getContentIcon(content.type)}</div>
                  <h3 className="text-sm sm:text-xl font-normal sm:font-semibold text-black mb-1 sm:mb-2">
                    {getContentTypeLabel(content.type)}
                  </h3>
                  <p className="text-xs sm:text-base text-black/70 mb-2 sm:mb-4">{content.originalName}</p>
                  {content.totalMarks && (
                    <p className="font-normal sm:font-semibold text-[#4f7c82] text-xs sm:text-sm mb-2 sm:mb-4">
                      Total Marks: {content.totalMarks}
                    </p>
                  )}
                </div>

                <div>
                  <a
                    href={content.path}
                    download={content.originalName}
                    className="inline-block w-full px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-colors bg-[#4f7c82] text-white hover:bg-[#3d6166] cursor-pointer text-center text-xs sm:text-sm font-normal"
                  >
                    Download Lab File
                  </a>
                </div>
              </div>


              {isStudent && (
                <div className="border-l md:pl-6 flex flex-col justify-center">
                  <h4 className="font-normal sm:font-semibold text-black mb-3 sm:mb-4 text-sm sm:text-lg">Submit Your Lab</h4>
                  {isCompleted ? (
                    <div className="p-3 sm:p-4 border-[#4f7c82] rounded-lg">
                      <p className="text-[#4f7c82] font-normal sm:font-semibold text-xs sm:text-base"> Lab Submitted</p>
                      {labProgressItem?.submittedAt && (
                        <p className="text-xs sm:text-sm text-[#4f7c82] mt-1">
                          Submitted on {new Date(labProgressItem.submittedAt).toLocaleDateString()}
                        </p>
                      )}
                      {labProgressItem?.grade !== null && labProgressItem?.grade !== undefined && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white rounded border">
                          <p className="text-xs sm:text-sm font-normal sm:font-medium text-gray-700">Your Grade:</p>
                          <p className="text-base sm:text-lg font-bold text-[#4f7c82]">
                            {labProgressItem.grade}
                            {content.totalMarks ? ` / ${content.totalMarks}` : "%"}
                          </p>
                          {labProgressItem.feedback && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-2">
                              <strong>Feedback:</strong> {labProgressItem.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-normal sm:font-medium text-black mb-2">
                          Select File to Upload
                        </label>
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82] text-xs sm:text-sm"
                          disabled={isUploadingLab}
                        />
                      </div>
                      <button
                        onClick={handleLabUpload}
                        disabled={!selectedFile || isUploadingLab}
                        className="w-full px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-colors bg-[#4f7c82] text-white hover:bg-[#3d6166] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-normal"
                      >
                        {isUploadingLab ? "Uploading..." : "Upload Lab"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else if (content.type === "activity") {

      const activityProgressItem = activityProgress[content.order?.toString()];
      const isCompleted = activityProgressItem?.completed === true;
      const selectedFile = selectedActivityFiles[content.order];

      const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          setSelectedActivityFiles(prev => ({ ...prev, [content.order]: file }));
        }
      };

      const handleActivityUpload = async () => {
        const file = selectedActivityFiles[content.order];
        if (!file || !isStudent) {
          showWarning("Please select a file to upload", "No File Selected");
          return;
        }

        setIsUploadingActivity(true);
        try {
          const formData = new FormData();
          formData.append("studentId", user.id);
          formData.append("playlistId", playlist._id);
          formData.append("contentOrder", content.order);
          formData.append("file", file);

          const response = await axios.post('/api/playlist/activity-submission', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.data.success) {
            const updatedActivityProgress = response.data.activityProgress;
            setActivityProgress(updatedActivityProgress);
            const contentKey = content.order?.toString();
            if (contentKey) {
              unlockedItemsRef.current.add(contentKey);
            }
            setSelectedActivityFiles(prev => {
              const updated = { ...prev };
              delete updated[content.order];
              return updated;
            });

            setTimeout(() => {
              saveProgressToAPI(videoProgress);
            }, 100);

            // alert("Activity submitted successfully!");

          }
        } catch (error) {
          console.error('Error uploading activity:', error);
          showError(error.response?.data?.message || "Failed to upload activity. Please try again.", "Upload Error");
        } finally {
          setIsUploadingActivity(false);
        }
      };

      return (
        <div className="w-full min-h-[60vh] flex items-center justify-center py-4 sm:py-6">
          <div className="w-full max-w-5xl mx-auto px-3 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">

              <div className="flex flex-col justify-center items-center">
                <div className="text-center mb-3 sm:mb-4">
                  <div className="text-2xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">{getContentIcon(content.type)}</div>
                  <h3 className="text-sm sm:text-xl font-normal sm:font-semibold text-black mb-1 sm:mb-2">
                    {getContentTypeLabel(content.type)}
                  </h3>
                  <p className="text-xs sm:text-base text-black/70 mb-2 sm:mb-3">{content.originalName}</p>
                  {content.totalMarks && (
                    <p className="font-normal sm:font-semibold text-[#4f7c82] text-xs sm:text-sm">
                      Total Marks: {content.totalMarks}
                    </p>
                  )}
                </div>

                <div className="w-full max-w-xs">
                  <a
                    href={content.path}
                    download={content.originalName}
                    className="inline-block w-full px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-colors bg-[#4f7c82] text-white hover:bg-[#3d6166] cursor-pointer text-center text-xs sm:text-sm font-normal"
                  >
                    Download Activity File
                  </a>
                </div>
              </div>

              {isStudent && (
                <div className="border-l md:pl-6 flex flex-col justify-center">
                  <h4 className="font-normal sm:font-semibold text-black mb-2 sm:mb-4 text-sm sm:text-lg">Submit Your Activity</h4>
                  {isCompleted ? (
                    <div className="p-3 sm:p-4 rounded-lg">
                      <p className="text-[#4f7c82] font-normal sm:font-semibold text-xs sm:text-base"> Activity Submitted</p>
                      {activityProgressItem?.submittedAt && (
                        <p className="text-xs sm:text-sm text-[#4f7c82] mt-1">
                          Submitted on {new Date(activityProgressItem.submittedAt).toLocaleDateString()}
                        </p>
                      )}
                      {activityProgressItem?.grade !== null && activityProgressItem?.grade !== undefined && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white rounded border">
                          <p className="text-xs sm:text-sm font-normal sm:font-medium text-gray-700">Your Grade:</p>
                          <p className="text-base sm:text-lg font-bold text-[#4f7c82]">
                            {activityProgressItem.grade}
                            {content.totalMarks ? ` / ${content.totalMarks}` : "%"}
                          </p>
                          {activityProgressItem.feedback && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-2">
                              <strong>Feedback:</strong> {activityProgressItem.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-normal sm:font-medium text-black mb-2">
                          Select File to Upload
                        </label>
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82] text-xs sm:text-sm"
                          disabled={isUploadingActivity}
                        />
                      </div>
                      <button
                        onClick={handleActivityUpload}
                        disabled={!selectedFile || isUploadingActivity}
                        className="w-full px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-colors bg-[#4f7c82] text-white hover:bg-[#3d6166] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-normal"
                      >
                        {isUploadingActivity ? "Uploading..." : "Upload Activity"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  };

  const containerClass = fullPage
    ? "min-h-screen bg-gray-50"
    : "fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75";

  const innerClass = fullPage
    ? "bg-white w-full min-h-screen flex flex-col"
    : "bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] flex flex-col";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold sm:font-bold text-gray-800">{playlist.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>


        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="w-full lg:w-2/3 border-b lg:border-b-0 lg:border-r p-3 sm:p-4 lg:p-6 overflow-y-auto bg-gray-50 lg:h-[calc(100vh-4rem)]">
            <div className="bg-gray-50 pb-2 sm:pb-3 mb-2 sm:mb-3 border-b">
              <h3 className="text-sm sm:text-base lg:text-lg font-normal sm:font-medium text-gray-800">
                {selectedContent === firstVideo || (!selectedContent && firstVideo)
                  ? "First Video"
                  : selectedContent
                    ? selectedContent.type === "quiz"
                      ? selectedContent.quizData?.title || selectedContent.title || "Quiz"
                      : `${getContentTypeLabel(selectedContent.type)}: ${selectedContent.originalName || ""}`
                    : "No content"}
              </h3>
            </div>
            {renderContent(selectedContent || firstVideo || allContent[0])}
          </div>

          <div className="w-full lg:w-1/3 lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-y-auto hide-scrollbar p-3 sm:p-4 lg:p-6 bg-white">
            <div className="sticky top-0 bg-white pb-3 sm:pb-4 mb-3 sm:mb-4 border-b z-10">
              <h3 className="text-sm sm:text-base lg:text-lg font-normal sm:font-medium text-gray-800">
                Content List ({remainingContent.length} items)
              </h3> 
              
            </div>
            <div className="space-y-2 sm:space-y-3">
              {remainingContent.map((content, index) => {
                const isSelected = selectedContent === content || (!selectedContent && content === firstVideo);
                const isFirstVideo = content === firstVideo;
                const isUnlocked = isContentUnlocked(content, index);

                return (
                  <button
                    key={index}
                    onClick={() => handleContentClick(content, index)}
                    disabled={!isUnlocked && isStudent}
                    className={`w-full text-left p-2 sm:p-3 lg:p-4 rounded-lg border-2 transition-all ${!isUnlocked && isStudent
                      ? "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
                      : isSelected
                        ? "border-[#4f7c82] bg-[#4f7c82]/5 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="text-lg sm:text-xl lg:text-2xl flex-shrink-0">
                        {!isUnlocked && isStudent ? "" : getContentIcon(content.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] sm:text-xs font-medium sm:font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${!isUnlocked && isStudent
                            ? "bg-gray-200 text-gray-600"
                            : "text-[#4f7c82] bg-[#4f7c82]/10"
                            }`}>
                            {getContentTypeLabel(content.type)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            #{index + 1}
                          </span>
                          {!isUnlocked && isStudent && (
                            <span className="text-[10px] sm:text-xs font-medium sm:font-semibold bg-gray-200 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                              Locked
                            </span>
                          )}
                          {isFirstVideo && (
                            <span className="text-[10px] sm:text-xs hidden md:block font-medium sm:font-semibold text-[#4f7c82] bg-[#4f7c82]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                              First Video
                            </span>
                          )}
                        </div>
                        <p className={`text-xs sm:text-sm font-medium truncate ${!isUnlocked && isStudent ? "text-gray-500" : "text-gray-800"
                          }`}>
                          {content.type === "quiz" && content.quizData
                            ? `Quiz (${content.quizData.mcqs?.length || 0} MCQs)`
                            : content.originalName}
                        </p>
                        {!isUnlocked && isStudent && (
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                            Complete previous content to unlock
                          </p>
                        )}
                      </div>
                      {isSelected && isUnlocked && (
                        <div className="flex-shrink-0 text-[#4f7c82]">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {remainingContent.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No content available.</p>
              </div>
            )}
          </div>
        </div>

        {selectedContent && selectedContent !== firstVideo && firstVideo && (
          <div className="border-t border-black/10 p-4 bg-white">
            <div className="flex items-center justify-between">
              {/* <div>
                <p className="text-sm text-black/70">
                  Currently viewing: <span className="font-semibold">{selectedContent.type === "quiz" ? " Quiz" : (selectedContent.originalName || "Content")}</span>
                </p>
              </div> */}
              <Button
                onClick={() => {
                  setSelectedContent(firstVideo);
                  setSelectedIndex(0);
                }}
                variant="secondary"
                className="text-sm"
              >
                Back to First Video
              </Button>
            </div>
          </div>
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
    </div>
  );
}
