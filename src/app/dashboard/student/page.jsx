"use client";

import { useEffect, useState, useCallback, memo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "@/store/auth_temp.js";
import { fetchStudentPlaylists } from "@/store/playlist";
import { Button } from "@/components/Button";
import PaymentModal from "@/components/PaymentModal";
import Link from "next/link";
import StudentMessages from "./messages";
import Insmsg from "@/components/msg";
import MessageModal from "@/components/MessageModal";
import PendingApprovals from "./pending-approvals";
import AlertModal from "@/components/AlertModal";
import { useAlert } from "@/components/usealert";
import Sidebar from "@/components/leftmenu";

const getPlaylistThumb = (playlist) => {
  return (
    playlist?.thumbnail ||
    playlist?.thumbnailUrl ||
    playlist?.coverImage ||
    playlist?.cover ||
    playlist?.image ||
    playlist?.poster ||
    (playlist?.content && playlist.content.find((c) => c?.thumbnail || c?.poster)?.thumbnail) ||
    (playlist?.content && playlist.content.find((c) => c?.thumbnail || c?.poster)?.poster) ||
    null
  );
};

const PlaylistThumb = ({ playlist }) => {
  const [imgSrc, setImgSrc] = useState(getPlaylistThumb(playlist));
  const videoSrc =
    (playlist?.content && playlist.content.find((c) => c?.type === "video" && c?.path)?.path) ||
    (playlist?.videos && playlist.videos[0]);

  useEffect(() => {
    if (!imgSrc && videoSrc) {
      const video = document.createElement("video");
      video.src = videoSrc;
      video.muted = true;
      video.preload = "metadata";
      const draw = () => {
        const canvas = document.createElement("canvas");
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          try {
            const url = canvas.toDataURL("image/jpeg", 0.7);
            setImgSrc(url);
          } catch {}
        }
      };
      const onMetadata = () => {
        try {
          const t = Math.min(1, Math.max(0, (video.duration || 3) / 10));
          const onSeeked = () => {
            draw();
          };
          video.addEventListener("seeked", onSeeked, { once: true });
          video.currentTime = t;
        } catch {
          draw();
        }
      };
      video.addEventListener("loadedmetadata", onMetadata, { once: true });
      video.addEventListener("loadeddata", draw, { once: true });
      return () => {
        video.removeEventListener("loadedmetadata", onMetadata);
        video.removeEventListener("loadeddata", draw);
      };
    }
  }, [imgSrc, videoSrc]);

  return (
    <div
      className="relative w-full bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity"
      style={{ aspectRatio: "16/9", minHeight: "180px" }}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={playlist?.title || "thumbnail"} className="w-full h-full object-cover" />
      ) : videoSrc ? (
        <video className="w-full h-full object-cover" src={videoSrc} muted playsInline preload="metadata" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
        {playlist?.content?.length || playlist?.videos?.length || 0} items
      </div>
    </div>
  );
};

function StudentDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { alertState, hideAlert, showError } = useAlert();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { studentPlaylists, loading, error } = useSelector((state) => state.playlist);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [activeTab, setActiveTab] = useState("playlists");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasePlaylist, setPurchasePlaylist] = useState(null);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [purchasesSearchQuery, setPurchasesSearchQuery] = useState("");
  const [completedSearchQuery, setCompletedSearchQuery] = useState("");
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");



useEffect(() => {
  setMounted(true);
  
  if (typeof window !== 'undefined') {
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, '', window.location.href);
    };
  }
  
  return () => {
    if (typeof window !== 'undefined') {
      window.onpopstate = null;
    }
  };
}, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        const res = await fetch(`/api/messages?userId=${userId}`);
        const data = await res.json();

        if (data.success && data.conversations) {
          const totalUnread = data.conversations.reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadMessageCount(totalUnread);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
    } else if (user.role !== "student") {
      
      if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else if (user.role === "instructor") {
        router.push("/dashboard/instructor");
      }
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
  const handleClickOutside = () => {
    setShowProfileDropdown(false);
  };

  if (showProfileDropdown) {
    window.addEventListener("click", handleClickOutside);
  }

  return () => {
    window.removeEventListener("click", handleClickOutside);
  };
}, [showProfileDropdown]);


 
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId && user?.role === "student") {
      setIsLoadingPlaylists(true);
      dispatch(fetchStudentPlaylists(userId))
        .finally(() => {
          setIsLoadingPlaylists(false);
        });
    }
  }, [user?.id, user?._id, user?.role, dispatch]);

  useEffect(() => {
    if (activeTab !== "playlists") {
      setSearchQuery("");
    }
  }, [activeTab]);


  const handleLogout = useCallback(() => {
    try {
      dispatch(logout());
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      
      dispatch(logout());
      router.replace("/login");
    }
  }, [dispatch, router]);

  const handleBuyNow = useCallback((e, playlist) => {
    e.stopPropagation();
    setPurchasePlaylist(playlist);
    setShowPaymentModal(true);
  }, []);

  const handlePurchaseSuccess = useCallback(() => {
  
    const userId = user?.id || user?._id;
    if (userId) {
      setIsLoadingPlaylists(true);
      dispatch(fetchStudentPlaylists(userId))
        .finally(() => {
          setIsLoadingPlaylists(false);
        });
    }
    setShowPaymentModal(false);
    setPurchasePlaylist(null);
  }, [user, dispatch]);

  const handleViewCertificate = useCallback((e, playlist) => {
    e.stopPropagation();
    router.push(`/certificate/${playlist._id}`);
  }, [router]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [playingPlaylistId, setPlayingPlaylistId] = useState(null); // For loading state

  const filteredPlaylists = studentPlaylists.filter((playlist) => {
    const matchesSearch = playlist.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handlePlaylistClick = useCallback((playlist) => {
    // Set loading state
    setPlayingPlaylistId(playlist._id);
    
    if (playlist.purchase && playlist.purchase.hasAccess) {
      router.push(`/dashboard/student/playlist/${playlist._id}`);
    } else if (playlist.price > 0) {
      // Reset loading state for payment modal
      setPlayingPlaylistId(null);
      setPurchasePlaylist(playlist);
      setShowPaymentModal(true);
    } else {
      router.push(`/dashboard/student/playlist/${playlist._id}`);
    }
  }, [router]);

  const handleProfilePictureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleProfilePictureChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showError("Only image files (JPEG, PNG, GIF, WebP) are allowed", "Invalid File Type");
      return;
    }

    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      showError("Image size must be less than 5MB", "File Too Large");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result);
    };
    reader.readAsDataURL(file);

    const userId = user?.id || user?._id;
    if (!userId) return;

    setUploadingProfilePicture(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("image", file);

      const response = await fetch("/api/user/profile-picture", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        dispatch(setUser({ ...user, profilePicture: data.profilePicture }));
        setProfilePicturePreview(null);
      } else {
        showError(data.message || "Failed to upload profile picture", "Upload Failed");
        setProfilePicturePreview(null);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      showError("Failed to upload profile picture", "Upload Error");
      setProfilePicturePreview(null);
    } finally {
      setUploadingProfilePicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [user, dispatch, showError]);

  if (!isAuthenticated ||!mounted ||  !user || user.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const menuItems = [
    {
      id: "playlists",
      label: "Available Playlists",
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-colors">
        <path d="M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965V16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877 18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461V16.5963C19.5 16.8724 19.2749 17.09 18.9989 17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909V20.5" stroke="currentColor" strokeLinejoin="round" />
        <path d="M19.2353 6H21.5C21.7761 6 22 6.22386 22 6.5V19.539C22 19.9436 21.5233 20.2124 21.1535 20.0481C20.3584 19.6948 19.0315 19.2632 17.2941 19.2632C14.3529 19.2632 12 21 12 21C12 21 9.64706 19.2632 6.70588 19.2632C4.96845 19.2632 3.64156 19.6948 2.84647 20.0481C2.47668 20.2124 2 19.9436 2 19.539V6.5C2 6.22386 2.22386 6 2.5 6H4.76471" stroke="currentColor" strokeLinejoin="round" />
      </svg>
    },
    {
      id: "purchases",
      label: "My Purchases",
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 14C2 10.2288 2 8.34315 3.17157 7.17157C4.34315 6 6.22876 6 10 6H14C17.7712 6 19.6569 6 20.8284 7.17157C22 8.34315 22 10.2288 22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14Z" />
        <path d="M16 6C16 4.11438 16 3.17157 15.4142 2.58579C14.8284 2 13.8856 2 12 2C10.1144 2 9.17157 2 8.58579 2.58579C8 3.17157 8 4.11438 8 6" />
        <path d="M12 17.3333C13.1046 17.3333 14 16.5871 14 15.6667C14 14.7462 13.1046 14 12 14C10.8954 14 10 13.2538 10 12.3333C10 11.4129 10.8954 10.6667 12 10.6667M12 17.3333C10.8954 17.3333 10 16.5871 10 15.6667M12 17.3333V18M12 10V10.6667M12 10.6667C13.1046 10.6667 14 11.4129 14 12.3333" strokeLinecap="round" />
      </svg>
    },
    {
      id: "completed",
      label: "Completed Playlist",
      icon: <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M10 16 L14 20 L22 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    },
    {
      id: "pendingPlaylists",
      label: "Pending Playlists",
      icon: <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M16 10L18.5768 8.45392C19.3699 7.97803 19.7665 7.74009 20.0928 7.77051C20.3773 7.79703 20.6369 7.944 20.806 8.17433C21 8.43848 21 8.90095 21 9.8259V14.1741C21 15.099 21 15.5615 20.806 15.8257C20.6369 16.056 20.3773 16.203 20.0928 16.2295C19.7665 16.2599 19.3699 16.022 18.5768 15.5461L16 14M6.2 18H12.8C13.9201 18 14.4802 18 14.908 17.782C15.2843 17.5903 15.5903 17.2843 15.782 16.908C16 16.4802 16 15.9201 16 14.8V9.2C16 8.0799 16 7.51984 15.782 7.09202C15.5903 6.71569 15.2843 6.40973 14.908 6.21799C14.4802 6 13.9201 6 12.8 6H6.2C5.0799 6 4.51984 6 4.09202 6.21799C3.71569 6.40973 3.40973 6.71569 3.21799 7.09202C3 7.51984 3 8.07989 3 9.2V14.8C3 15.9201 3 16.4802 3.21799 16.908C3.40973 17.2843 3.71569 17.5903 4.09202 17.782C4.51984 18 5.07989 18 6.2 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    },
    {
      id: "messages",
      label: "Messages",
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21.0039 12C21.0039 16.9706 16.9745 21 12.0039 21C9.9675 21 3.00463 21 3.00463 21C3.00463 21 4.56382 17.2561 3.93982 16.0008C3.34076 14.7956 3.00391 13.4372 3.00391 12C3.00391 7.02944 7.03334 3 12.0039 3C16.9745 3 21.0039 7.02944 21.0039 12Z" />
      </svg>
    },
    {
      id: "pending",
      label: "Pending Approvals",
      icon: <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
        <polygon points="4,11 15,18 28,9 17,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4,11v6l11,7l13-9c-1.2-1.2-1.5-3-0.7-4.5L28,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4,17v6l11,7l13-9c-1.2-1.2-1.5-3-0.7-4.5L28,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    }
  ];

  return (
    <div className="h-screen bg-white tracking-tight flex flex-col overflow-hidden relative">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full max-w-[1920px] 2xl:max-w-[1600px] mx-auto flex">



{isSidebarOpen && (
  <div
    onClick={() => setIsSidebarOpen(false)}
    className="fixed inset-0 bg-black/40 z-40 md:hidden"
  />
)}


     
      {/* Mobile Header - Show on all mobile screens including 320px */}
      <div className={`flex md:hidden items-center justify-between px-4 py-3 border-b bg-white fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''}`}>
        <h1 className="text-lg font-semibold">Student Panel</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-2xl"
        >
          ☰
        </button>
      </div>


     <div
   className={`
fixed lg:static top-0 left-0 z-20
h-screen bg-white shadow-lg flex flex-col
transition-all duration-300 ease-in-out

/* Desktop width */
${isSidebarCollapsed ? "lg:w-16" : "lg:w-56"}

/* Mobile width */
${isSidebarOpen ? "w-56" : "w-0"}

/* Slide behavior */
${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
`}
>

  <div className="lg:hidden flex justify-end p-3">
  <button
    onClick={() => setIsSidebarOpen(false)}
    className="text-2xl"
  >
    ✕
  </button>
</div>

        <div className="pt-4 pl-4 pb-4 border-b flex-shrink-0 items-center justify-between">
          <div className="flex items-center justify-between w-full">

            <h1 className={`${isSidebarCollapsed ? "hidden" : "hidden lg:block"} text-2xl font-semibold trackin-tighter text-black`}>
               Student Panel
           </h1>
           <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex text-xl hover:bg-gray-100 mt-1 rounded p-2" >
               {isSidebarCollapsed ? (
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
             </button>

          </div>
          <div className="relative">
            <div
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`flex items-center ${
  isSidebarCollapsed ? "justify-center" : "gap-3"
} cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors`}

            >
              {!isSidebarCollapsed && (
  <div
    onClick={(e) => {
      e.stopPropagation();
      handleProfilePictureClick();
    }}
    className="w-10 h-10 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 cursor-pointer hover:border-[#4f7c82]/40 transition-colors relative overflow-hidden"
  >

                {(profilePicturePreview || user?.profilePicture) ? (
                  <img
                    src={profilePicturePreview || user.profilePicture}
                    alt={user.name || user.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {uploadingProfilePicture && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              <div
  className={`flex-1 min-w-0 ${
    isSidebarCollapsed
      ? "text-center flex justify-center"
      : ""
  }`}
>

  {!isSidebarCollapsed && (
    <p className="text-sm font-medium text-gray-800 truncate">
      {user?.name || user?.username || user?.email || "Student"}
    </p>
  )}

  <p className="hidden sm:block text-xs text-gray-500">
    Welcome
  </p>
</div>


            </div>

          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3">
             <div className="flex items-center justify-between px-3 mb-2">
  {!isSidebarCollapsed && (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      Main
    </p>
  )}
</div>


<button
  onClick={() => {
    setActiveTab("playlists");
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }}
  className={`w-full flex items-center ${
    isSidebarCollapsed ? "justify-center" : "gap-3"
  } px-3 py-2.5 rounded-lg mb-1 transition-colors ${
    activeTab === "playlists"
      ? "bg-[#4f7c82] text-white"
      : "text-black hover:bg-black/5"
  }`}
>
  <span className="text-lg"><svg
  viewBox="0 0 24 24"
  width="24"
  height="24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className="transition-colors"
>
  <path
    d="M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965V16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877 18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461V16.5963C19.5 16.8724 19.2749 17.09 18.9989 17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909V20.5"
    stroke="currentColor"
    strokeLinejoin="round"
  />
  <path
    d="M19.2353 6H21.5C21.7761 6 22 6.22386 22 6.5V19.539C22 19.9436 21.5233 20.2124 21.1535 20.0481C20.3584 19.6948 19.0315 19.2632 17.2941 19.2632C14.3529 19.2632 12 21 12 21C12 21 9.64706 19.2632 6.70588 19.2632C4.96845 19.2632 3.64156 19.6948 2.84647 20.0481C2.47668 20.2124 2 19.9436 2 19.539V6.5C2 6.22386 2.22386 6 2.5 6H4.76471"
    stroke="currentColor"
    strokeLinejoin="round"
  />
</svg></span>

  {!isSidebarCollapsed && (
    <span className="font-medium whitespace-nowrap">Available Playlists</span>
  )}

  {activeTab === "playlists" && (
    <div className="ml-auto w-1 h-6 bg-white rounded"></div>
  )}
</button>

            <button
              onClick={() => setActiveTab("purchases")}
              className={`w-full flex items-center ${
    isSidebarCollapsed ? "justify-center" : "gap-3"
  } px-3 py-2.5 rounded-lg mb-1 transition-colors ${
    activeTab === "purchases"
      ? "bg-[#4f7c82] text-white"
      : "text-black hover:bg-black/5"
  }`}
            >
              <span className="text-lg"> <svg
  className="w-5 h-5"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.5"
>
  <path d="M2 14C2 10.2288 2 8.34315 3.17157 7.17157C4.34315 6 6.22876 6 10 6H14C17.7712 6 19.6569 6 20.8284 7.17157C22 8.34315 22 10.2288 22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14Z" />
  
  <path d="M16 6C16 4.11438 16 3.17157 15.4142 2.58579C14.8284 2 13.8856 2 12 2C10.1144 2 9.17157 2 8.58579 2.58579C8 3.17157 8 4.11438 8 6" />
  
  <path
    d="M12 17.3333C13.1046 17.3333 14 16.5871 14 15.6667C14 14.7462 13.1046 14 12 14C10.8954 14 10 13.2538 10 12.3333C10 11.4129 10.8954 10.6667 12 10.6667M12 17.3333C10.8954 17.3333 10 16.5871 10 15.6667M12 17.3333V18M12 10V10.6667M12 10.6667C13.1046 10.6667 14 11.4129 14 12.3333"
    strokeLinecap="round"
  />
</svg> </span>
              {!isSidebarCollapsed && (
  <span className="font-medium whitespace-nowrap">My Purchases</span>
)}

              {activeTab === "purchases" && (
                <div className="ml-auto w-1 h-6 bg-white rounded"></div>
              )}
            </button>

            
            <button
              onClick={() => setActiveTab("completed")}
              className={`w-full flex items-center ${
  isSidebarCollapsed ? "justify-center" : "gap-3"
} px-3 py-2.5 rounded-lg mb-1 transition-colors ${
  activeTab === "completed"
    ? "bg-[#4f7c82] text-white"
    : "text-black hover:bg-black/5"
}`}

            >
              <span className="text-lg"><svg
  viewBox="0 0 32 32"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className="w-5 h-5"
>
  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
  <path
    d="M10 16 L14 20 L22 12"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg></span>
              {!isSidebarCollapsed && (
  <span className="font-medium whitespace-nowrap">Completed Playlist</span>
)}
              {activeTab === "completed" && (
                <div className="ml-auto w-1 h-6 bg-white rounded"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("pendingPlaylists")}
              className={`w-full flex items-center ${
    isSidebarCollapsed ? "justify-center" : "gap-3"
  } px-3 py-2.5 rounded-lg mb-1 transition-colors ${
    activeTab === "pendingPlaylists"
      ? "bg-[#4f7c82] text-white"
      : "text-black hover:bg-black/5"
  }`}
            >
              <span className="text-lg"><svg
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className="w-6 h-6"
>
  <path
    d="M16 10L18.5768 8.45392C19.3699 7.97803 19.7665 7.74009 20.0928 7.77051C20.3773 7.79703 20.6369 7.944 20.806 8.17433C21 8.43848 21 8.90095 21 9.8259V14.1741C21 15.099 21 15.5615 20.806 15.8257C20.6369 16.056 20.3773 16.203 20.0928 16.2295C19.7665 16.2599 19.3699 16.022 18.5768 15.5461L16 14M6.2 18H12.8C13.9201 18 14.4802 18 14.908 17.782C15.2843 17.5903 15.5903 17.2843 15.782 16.908C16 16.4802 16 15.9201 16 14.8V9.2C16 8.0799 16 7.51984 15.782 7.09202C15.5903 6.71569 15.2843 6.40973 14.908 6.21799C14.4802 6 13.9201 6 12.8 6H6.2C5.0799 6 4.51984 6 4.09202 6.21799C3.71569 6.40973 3.40973 6.71569 3.21799 7.09202C3 7.51984 3 8.07989 3 9.2V14.8C3 15.9201 3 16.4802 3.21799 16.908C3.40973 17.2843 3.71569 17.5903 4.09202 17.782C4.51984 18 5.07989 18 6.2 18Z"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg></span>       
               {!isSidebarCollapsed && (
  <span className="font-medium whitespace-nowrap">Pending Playlists</span>
)}
              {activeTab === "pendingPlaylists" && (
                <div className="ml-auto w-1 h-6 bg-white rounded"></div>
              )}
            </button>
            {/* <button
              onClick={() => setActiveTab("progress")}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "progress"
                ? "bg-[#4f7c82] text-white"
                : "text-black hover:bg-black/5"
                }`}
            >
              <span className="text-lg">📈</span>
              <span className="font-medium">Progress</span>
              {activeTab === "progress" && (
                <div className="ml-auto w-1 h-6 bg-white rounded"></div>
              )}
            </button> */}
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center ${
    isSidebarCollapsed ? "justify-center" : "gap-3"
  } px-3 py-2.5 rounded-lg mb-1 transition-colors ${
    activeTab === "messages"
      ? "bg-[#4f7c82] text-white"
      : "text-black hover:bg-black/5"
  }`}
            >
              <span className="text-lg"><svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21.0039 12C21.0039 16.9706 16.9745 21 12.0039 21C9.9675 21 3.00463 21 3.00463 21C3.00463 21 4.56382 17.2561 3.93982 16.0008C3.34076 14.7956 3.00391 13.4372 3.00391 12C3.00391 7.02944 7.03334 3 12.0039 3C16.9745 3 21.0039 7.02944 21.0039 12Z" />
    </svg></span>
                {!isSidebarCollapsed && (
  <span className="font-medium whitespace-nowrap">Messages</span>
)}
              {unreadMessageCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              )}
              {activeTab === "messages" && (
                <div className="ml-auto w-1 h-6 bg-white rounded"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab("pending")}
              className={`w-full flex items-center ${
    isSidebarCollapsed ? "justify-center" : "gap-3"
  } px-3 py-2.5 rounded-lg mb-1 transition-colors ${
    activeTab === "pending"
      ? "bg-[#4f7c82] text-white"
      : "text-black hover:bg-black/5"
  }`}
            >
              <span className="text-lg"><svg
      className="w-5 h-5"
      viewBox="0 0 32 32"
      fill="none"
    >
      <polygon
        points="4,11 15,18 28,9 17,2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4,11v6l11,7l13-9c-1.2-1.2-1.5-3-0.7-4.5L28,9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4,17v6l11,7l13-9c-1.2-1.2-1.5-3-0.7-4.5L28,15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg> </span>
                {!isSidebarCollapsed && (
  <span className="font-medium whitespace-nowrap">Pending Approvals</span>
)}
              {activeTab === "pending" && (
                <div className="ml-auto w-1 h-6 bg-white rounded"></div>
              )}
            </button>
            <div className="mt-4 pt-4 border-t  border-gray-200">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors bg-[#4f7c82] text-white hover:bg-[#42686d]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                     {!isSidebarCollapsed && (
                      <span className="font-medium whitespace-nowrap">logout</span>)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-2 sm:p-8 transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''}`}>
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto">
        {activeTab === "playlists" && (
          <div>
            <h2 className="text-2xl font-semibold text-black mb-4 pt-12 md:pt-0">
              Available Playlists
            </h2> 
            <div className="">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search playlists by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4  py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {(loading || isLoadingPlaylists) && studentPlaylists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-black/70">Loading playlists...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-black/5 border border-black/20 text-black px-4 py-3 rounded-lg inline-block">
                  <p className="font-semibold">Error loading playlists</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button
                    onClick={() => {
                      const userId = user?.id || user?._id;
                      if (userId) {
                        setIsLoadingPlaylists(true);
                        dispatch(fetchStudentPlaylists(userId))
                          .finally(() => {
                            setIsLoadingPlaylists(false);
                          });
                      }
                    }}
                    className="mt-3 px-4 py-2 bg-black text-white rounded hover:bg-black/90 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )  : filteredPlaylists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black/70">
                No playlists found matching your search.
              </p>
            </div>
            ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              {filteredPlaylists.map((playlist) => {
                  const instructor = playlist.instructor;
                const hasAccess = playlist.price === 0 || (playlist.purchase && playlist.purchase.hasAccess);
                const isPurchased = playlist.purchase && playlist.purchase.purchased;
                const isExpired = playlist.purchase && playlist.purchase.isExpired;
                const isPending = playlist.purchase && playlist.purchase.status === "pending";

                return (
                  <div
                    key={playlist._id}
                    className={`group bg-white border-2 rounded-xl p-5 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden ${hasAccess
                      ? "border-gray-200 hover:border-[#4f7c82]/50 cursor-pointer"
                      : "border-gray-300"
                      }`}
                    onClick={() => hasAccess && !playingPlaylistId && handlePlaylistClick(playlist)}
                  >
                   
                    {isPending && (
                      <div className="absolute top-3 left-3 z-20 bg-[#4f7c82] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending Approval
                      </div>
                    )}

                    
                    {playingPlaylistId === playlist._id && (
                      <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center rounded-xl">
                        <p className="text-[#4f7c82] font-medium">Loading...</p>
                      </div>
                    )}
                   
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                   
                    <PlaylistThumb playlist={playlist} />

                  
                    <div className="relative z-10 flex-1">
                      <h3 className={`font-bold text-lg mb-2 truncate transition-colors ${hasAccess ? "text-gray-900 group-hover:text-[#4f7c82]" : "text-gray-700"
                        }`}>
                        {playlist.title}
                      </h3>

                     
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        {/* {instructor?._id ? (
                          <Link
                            href={`/instructor/${instructor._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#4f7c82] hover:underline"
                          > */}
                            {/* {instructor?.name || "Unknown"} */}
                          {/* </Link>
                        ) : ( */}
                          <span>{instructor?.name || "Unknown"}</span>
                        {/* )} */}
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
  
                    
                      {playlist.purchase && playlist.purchase.hasAccess && (
                        <div className="text-xs text-[#4f7c82]">
                          {playlist.purchase.status === "lifetime" ? (
                            <span>Lifetime Access</span>
                          ) : (
                            <span>
                              Expires: {playlist.purchase.expiresAt ? new Date(playlist.purchase.expiresAt).toLocaleDateString() : "N/A"}
                            </span>
                          )}
                        </div>
                      )}
                     
                      {!hasAccess && playlist.price > 0 && (
                        <div className="text-xs text-[#4f7c82]">
                          <span className="tracking-tight">
                            PKR {playlist.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {playlist.price === 0 && (
                        <div className="text-xs text-[#4f7c82]">
                          <span className="tracking-tight">
                            Free
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-1 space-y-2">
                        {/* removed status badges; info now shown inline with viewer count */}

                        {/* Buy Now and Message buttons on same line */}
                        {!hasAccess && playlist.price > 0 && !isPending && instructor && instructor._id && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={(e) => handleBuyNow(e, playlist)}
                              className="flex-1 bg-[#4f7c82] text-white hover:bg-[#3d6166] py-2.5"
                            >
                              {isExpired ? "Buy Again" : "Buy Now"}
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInstructor(instructor);
                                setIsMessageModalOpen(true);
                              }}
                              className="flex-1 bg-[#4f7c82] text-white hover:bg-[#3d6166] flex items-center justify-center gap-2 py-2.5"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                              </svg>
                              Message
                            </Button>
                          </div>
                        )}

                        {/* Message button only when user has access or playlist is free */}
                        {(hasAccess || isPending) && instructor && instructor._id && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInstructor(instructor);
                              setIsMessageModalOpen(true);
                            }}
                            className="w-full bg-[#4f7c82] text-white hover:bg-[#3d6166] flex items-center justify-center gap-2 mt-3 py-2.5"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                            </svg>
                            Message
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}

        {activeTab === "purchases" && (
          <div>
            <h2 className="text-2xl font-semibold text-black mb-4 pt-12 md:pt-0">
              My Purchases
            </h2>
            <div className="mb-6">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search playlists..."
                  value={purchasesSearchQuery}
                  onChange={(e) => setPurchasesSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {studentPlaylists && studentPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentPlaylists
                  .filter((playlist) => playlist.purchase && playlist.purchase.hasAccess)
                  .filter((playlist) => 
                    playlist.title.toLowerCase().includes(purchasesSearchQuery.toLowerCase()) ||
                    playlist.instructor?.name?.toLowerCase().includes(purchasesSearchQuery.toLowerCase())
                  )
                  .map((playlist) => {
                    const hasAccess = playlist.purchase && playlist.purchase.hasAccess;
                    const instructor = playlist.instructor;
                    return (
                      <div
                        key={playlist._id}
                        className="cursor-pointer group bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#4f7c82]/50 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden"
                        onClick={() => !playingPlaylistId && handlePlaylistClick(playlist)}
                      >
                        
                        {playingPlaylistId === playlist._id && (
                          <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center rounded-xl">
                            <p className="text-[#4f7c82] font-medium">Loading...</p>
                          </div>
                        )}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <PlaylistThumb playlist={playlist} />

                        <div className="relative z-10 flex-1">
                          <h3 className={`font-bold text-lg mb-2 truncate transition-colors ${hasAccess ? "text-gray-900 group-hover:text-[#4f7c82]" : "text-gray-700"}`}>
                            {playlist.title}
                          </h3>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {instructor?._id ? (
                                <Link
                                  href={`/instructor/${instructor._id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-[#4f7c82] hover:underline"
                                >
                                  {instructor?.name || "Unknown"}
                                </Link>
                              ) : (
                                <span>{instructor?.name || "Unknown"}</span>
                              )}
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                </svg>
                                <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
                              </div>
                              {playlist.purchase && playlist.purchase.hasAccess && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  {playlist.purchase.status === "lifetime" ? (
                                    <span className="text-xs text-[#4f7c82]">Lifetime Access</span>
                                  ) : (
                                    <span className="text-xs text-[#4f7c82]">
                                      Expires: {playlist.purchase.expiresAt ? new Date(playlist.purchase.expiresAt).toLocaleDateString() : "N/A"}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-1 space-y-2">
                          {hasAccess && instructor && instructor._id && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInstructor(instructor);
                                setIsMessageModalOpen(true);
                              }}
                              className="w-full bg-[#4f7c82] text-white hover:bg-[#3d6166] flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                              </svg>
                              Message
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {studentPlaylists
                  .filter((playlist) => playlist.purchase && playlist.purchase.hasAccess)
                  .filter((playlist) => 
                    playlist.title.toLowerCase().includes(purchasesSearchQuery.toLowerCase()) ||
                    playlist.instructor?.name?.toLowerCase().includes(purchasesSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-black/70">
                        {purchasesSearchQuery ? "No playlists found matching your search." : "You haven't purchased any playlists yet. Visit \"Available Playlists\" to purchase."}
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70">
                  You haven't purchased any playlists yet. Visit "Available Playlists" to purchase.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div>
            <h2 className="text-2xl font-semibold text-black mb-4 pt-12 md:pt-0">
              Completed Playlists
            </h2>
            <div className="mb-6">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search playlists..."
                  value={completedSearchQuery}
                  onChange={(e) => setCompletedSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {studentPlaylists && studentPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentPlaylists
                  .filter((playlist) =>
                    playlist.purchase &&
                    playlist.purchase.hasAccess &&
                    playlist.purchase.quizPassed === true
                  )
                  .filter((playlist) => 
                    playlist.title.toLowerCase().includes(completedSearchQuery.toLowerCase()) ||
                    playlist.instructor?.name?.toLowerCase().includes(completedSearchQuery.toLowerCase())
                  )
                  .map((playlist) => (
                    <div
                      key={playlist._id}
                      className="cursor-pointer group border-2 border-[#4f7c82] rounded-xl p-4  hover:shadow-2xl transition-all duration-300 flex flex-col relative overflow-hidden"
                      onClick={() => !playingPlaylistId && handlePlaylistClick(playlist)}
                    >
                      {/* Loading overlay */}
                      {playingPlaylistId === playlist._id && (
                        <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center rounded-xl">
                          <p className="text-[#4f7c82] font-medium">Loading...</p>
                        </div>
                      )}
                      <div className="absolute top-0 right-0 w-32 h-32   rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
                        {playlist.content && playlist.content.length > 0 && playlist.content[0].type === "video" && playlist.content[0].path ? (
                          <video
                            className="w-full h-full object-cover"
                            src={playlist.content[0].path}
                            preload="metadata"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                          {playlist.content?.length || playlist.videos?.length || 0} items
                        </div>
                      </div>

                      <div className="relative z-10 flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 truncate group-hover:text-gray-600 transition-colors">
                          {playlist.title}
                        </h3>
                      <div className="flex gap-6">
                        <p className="text-sm text-gray-600 mb-1">
                          {playlist.instructor?.name || "Unknown"}
                        </p>
                        <div className="mb-2 flex items-center gap-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                        

                        {/* {playlist.deleted && (
                          <div className="mb-2 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
                             No longer available
                          </div>
                        )} */}
                        <div className="">
                          {/* <span className="text-xs  px-2 py-1 rounded font-medium">
                            Purchase Completed
                          </span> */}
                          <p className="text-xs text-gray-600">
                            Progress: 100%
                          </p>
                        </div>

                        <button
                          onClick={(e) => handleViewCertificate(e, playlist)}
                          className="mt-4 w-full px-4 py-2.5 bg-[#4f7c82] text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                          
                          View Certificate
                        </button>
                      </div>
                    </div>
                  ))}
                {studentPlaylists.filter((playlist) =>
                  playlist.purchase &&
                  playlist.purchase.hasAccess &&
                  playlist.purchase.quizPassed === true
                ).filter((playlist) => 
                  playlist.title.toLowerCase().includes(completedSearchQuery.toLowerCase()) ||
                  playlist.instructor?.name?.toLowerCase().includes(completedSearchQuery.toLowerCase())
                ).length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-black/70">
                        {completedSearchQuery ? "No playlists found matching your search." : "No completed playlists yet. Pass the quiz to complete a playlist."}
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70">No playlists available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "pendingPlaylists" && (
          <div>
            <h2 className="text-2xl font-semibold text-black mb-4 pt-12 md:pt-0">
              Pending Playlists
            </h2>
            <div className="mb-6">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search playlists..."
                  value={pendingSearchQuery}
                  onChange={(e) => setPendingSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {studentPlaylists && studentPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentPlaylists
                  .filter((playlist) =>
                    playlist.purchase &&
                    playlist.purchase.hasAccess &&
                    playlist.purchase.quizPassed !== true
                  )
                  .filter((playlist) => 
                    playlist.title.toLowerCase().includes(pendingSearchQuery.toLowerCase()) ||
                    playlist.instructor?.name?.toLowerCase().includes(pendingSearchQuery.toLowerCase())
                  )
                  .map((playlist) => {
                    const attemptsUsed = playlist.purchase.quizAttempts || 0;
                    const attemptsRemaining = 3 - attemptsUsed;
                    return (
                      <div
                        key={playlist._id}
                        className="cursor-pointer group bg-white border-2 border-[#4f7c82] rounded-xl p-4   transition-all duration-300 flex flex-col relative overflow-hidden"
                        onClick={() => !playingPlaylistId && handlePlaylistClick(playlist)}
                      >
                        {/* Loading overlay */}
                        {playingPlaylistId === playlist._id && (
                          <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center rounded-xl">
                            <p className="text-[#4f7c82] font-medium">Loading...</p>
                          </div>
                        )}
                        
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4f7c82] rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        
                        <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
                          {playlist.content && playlist.content.length > 0 && playlist.content[0].type === "video" && playlist.content[0].path ? (
                            <video
                              className="w-full h-full object-cover"
                              src={playlist.content[0].path}
                              preload="metadata"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                            {playlist.content?.length || playlist.videos?.length || 0} items
                          </div>
                        </div>

                      
                        <div className="relative z-10 flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-2 truncate transition-colors">
                            {playlist.title}
                          </h3>
                          <div className="flex gap-4">
                          <p className="text-sm text-gray-600 mb-1">
                            {playlist.instructor?.name || "Unknown"}
                          </p>
                          
                          {/* Total Viewers */}
                          <div className="mb-2 flex items-center gap-1 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                            <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
                          </div>
                            </div>

                          <div className="flex gap-6 space-y-1">
                            <span className="text-xs text-[#4f7c82] font-bold py-1 rounded">
                              Quiz fail
                            </span>
                            {attemptsUsed > 0 && (
                              <span className={`text-xs block px-2 rounded font-medium ${attemptsRemaining === 0
                                ? " text-gray-700"
                                : " text-gray-700"
                                }`}>
                                {attemptsRemaining === 0
                                  ? " All attempts used"
                                  : `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {studentPlaylists.filter((playlist) =>
                  playlist.purchase &&
                  playlist.purchase.hasAccess &&
                  playlist.purchase.quizPassed !== true
                ).filter((playlist) => 
                  playlist.title.toLowerCase().includes(pendingSearchQuery.toLowerCase()) ||
                  playlist.instructor?.name?.toLowerCase().includes(pendingSearchQuery.toLowerCase())
                ).length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-black/70">
                        {pendingSearchQuery ? "No playlists found matching your search." : "No pending playlists. All purchased playlists are completed!"}
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70">No playlists available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "pending" && (
          <PendingApprovals />
        )}

        {activeTab === "progress" && (
          <div>
            <h2 className="text-2xl font-semibold pt-12 md:pt-0 text-black mb-6">
              My Progress
            </h2>
            {studentPlaylists && studentPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {studentPlaylists
                  .filter((playlist) => playlist.purchase && playlist.purchase.hasAccess)
                  .map((playlist) => {
                    const progress = playlist.progress?.overallProgress || 0;
                    const radius = 50;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (progress / 100) * circumference;

                    return (
                      <div
                        key={playlist._id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handlePlaylistClick(playlist)}
                      >
                       
                        <h3 className="text-lg font-bold text-gray-900 mb-4 truncate text-center">
                          {playlist.title}
                        </h3>

                        <div className="flex justify-center items-center mb-4 relative mx-auto" style={{ width: '128px', height: '128px' }}>
                          <svg className="transform -rotate-90 w-32 h-32 absolute inset-0">
                            <circle
                              cx="64"
                              cy="64"
                              r={radius}
                              stroke="#e5e7eb"
                              strokeWidth="12"
                              fill="none"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r={radius}
                              stroke="#4f7c82"
                              strokeWidth="12"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              className="transition-all duration-300"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-900">
                              {Math.round(progress)}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5">%</span>
                          </div>
                        </div>

                        <div className="text-center mb-4">
                          <p className="text-sm font-medium text-gray-700">
                            {Math.round(progress)}% Complete
                          </p>
                          {playlist.purchase.quizPassed ? (
                            <p className="text-xs text-[#4f7c82]font-medium mt-1">
                               Quiz Passed
                            </p>
                          ) : (
                            <p className="text-xs text-[#4f7c82] font-medium mt-1">
                              Quiz Pending
                            </p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaylistClick(playlist);
                          }}
                          className="w-full text-[#4f7c82] hover:bg-[#4f7c82] hover:text-white border border-[#4f7c82] rounded-lg py-2 px-4 transition-colors font-medium"
                        >
                          {progress === 100 ? "Review" : "Continue Learning →"}
                        </button>
                      </div>
                    );
                  })}
                {studentPlaylists.filter((playlist) => playlist.purchase && playlist.purchase.hasAccess).length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-black/70">
                      You haven't purchased any playlists yet. Purchase playlists to track your progress!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70">No progress to show yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && <StudentMessages />}
        {/* {activeTab === "messages" && (
  <StudentMessages instructor={selectedInstructor} />
)} */}
        </div>
      </div>

{isMessageModalOpen && selectedInstructor && (
  <MessageModal
    open={isMessageModalOpen}
    onClose={() => {
      setIsMessageModalOpen(false);
      setSelectedInstructor(null);
    }}
    otherUserId={selectedInstructor._id}
    otherUserName={selectedInstructor.name}
    otherUserRole="instructor"
  />
)}


      {purchasePlaylist && (
        <PaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPurchasePlaylist(null);
          }}
          playlist={purchasePlaylist}
          onSuccess={handlePurchaseSuccess}
        />
      )}

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

      {showProfileDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setShowProfileDropdown(false);
          }}
        />
      )}
        </div>
      </div>
    </div>
  );
}

export default memo(StudentDashboard);






























// "use client";

// import { useEffect, useState, useCallback, memo, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { useDispatch, useSelector } from "react-redux";
// import { logout, setUser } from "@/store/auth_temp.js";
// import { fetchStudentPlaylists } from "@/store/playlist";
// import { Button } from "@/components/Button";
// import VideoPlayer from "@/components/VideoPlayer";
// import PaymentModal from "@/components/PaymentModal";
// import Link from "next/link";
// import StudentMessages from "./messages";
// import Insmsg from "@/components/msg";
// import MessageModal from "@/components/MessageModal";
// import PendingApprovals from "./pending-approvals";

// function StudentDashboard() {
//   const router = useRouter();
//   const dispatch = useDispatch();

//   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const { user, isAuthenticated } = useSelector((state) => state.auth);
//   const { studentPlaylists, loading, error } = useSelector((state) => state.playlist);
//   const [selectedPlaylist, setSelectedPlaylist] = useState(null);
//   const [isPlayerOpen, setIsPlayerOpen] = useState(false);
//   const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
//   const [activeTab, setActiveTab] = useState("playlists");
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [purchasePlaylist, setPurchasePlaylist] = useState(null);
//   const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
//   const [profilePicturePreview, setProfilePicturePreview] = useState(null);
//   const fileInputRef = useRef(null);
//   const [mounted, setMounted] = useState(false);
//   const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
// const [selectedInstructor, setSelectedInstructor] = useState(null);
//   const [unreadMessageCount, setUnreadMessageCount] = useState(0);
// // const [instructor, setInstructor] = useState(null);
//   // const [cv, setCv] = useState(null);
//   // const [playlists, setPlaylists] = useState([]);
//   // const [loading, setLoading] = useState(true);
//   // const [error, setError] = useState(null);
//   // const [selectedPlaylist, setSelectedPlaylist] = useState(null);
//   // const [isPlayerOpen, setIsPlayerOpen] = useState(false);
//   // const [showCV, setShowCV] = useState(false);
//   // const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);


// useEffect(() => {
//   setMounted(true);
  
//   // Prevent back navigation to login/signup pages
//   if (typeof window !== 'undefined') {
//     window.history.pushState(null, '', window.location.href);
//     window.onpopstate = function () {
//       window.history.pushState(null, '', window.location.href);
//     };
//   }
  
//   return () => {
//     if (typeof window !== 'undefined') {
//       window.onpopstate = null;
//     }
//   };
// }, []);

//   // Fetch unread message count (initial load only, socket will handle updates)
//   useEffect(() => {
//     const fetchUnreadCount = async () => {
//       const userId = user?.id || user?._id;
//       if (!userId) return;

//       try {
//         const res = await fetch(`/api/messages?userId=${userId}`);
//         const data = await res.json();

//         if (data.success && data.conversations) {
//           const totalUnread = data.conversations.reduce(
//             (sum, conv) => sum + (conv.unreadCount || 0),
//             0
//           );
//           setUnreadMessageCount(totalUnread);
//         }
//       } catch (error) {
//         console.error("Error fetching unread count:", error);
//       }
//     };

//     if (user) {
//       fetchUnreadCount();
//       // Socket will handle real-time updates, no need for polling
//     }
//   }, [user]);

//   useEffect(() => {
//     if (!isAuthenticated || !user) {
//       router.push("/login");
//     } else if (user.role !== "student") {
//       // Redirect to appropriate dashboard
//       if (user.role === "admin") {
//         router.push("/dashboard/admin");
//       } else if (user.role === "instructor") {
//         router.push("/dashboard/instructor");
//       }
//     }
//   }, [isAuthenticated, user, router]);

//   useEffect(() => {
//   const handleClickOutside = () => {
//     setShowProfileDropdown(false);
//   };

//   if (showProfileDropdown) {
//     window.addEventListener("click", handleClickOutside);
//   }

//   return () => {
//     window.removeEventListener("click", handleClickOutside);
//   };
// }, [showProfileDropdown]);


//   // Fetch approved playlists for student
//   useEffect(() => {
//     const userId = user?.id || user?._id;
//     if (userId && user?.role === "student") {
//       setIsLoadingPlaylists(true);
//       dispatch(fetchStudentPlaylists(userId))
//         .finally(() => {
//           setIsLoadingPlaylists(false);
//         });
//     }
//   }, [user?.id, user?._id, user?.role, dispatch]);

//   useEffect(() => {
//     if (activeTab !== "playlists") {
//       setSearchQuery("");
//     }
//   }, [activeTab]);


//   const handleLogout = useCallback(() => {
//     try {
//       dispatch(logout());
//       router.replace("/login");
//     } catch (error) {
//       console.error("Logout error:", error);
//       // Force logout even if there's an error
//       dispatch(logout());
//       router.replace("/login");
//     }
//   }, [dispatch, router]);

//   const handleClosePlayer = useCallback(() => {
//     setIsPlayerOpen(false);
//     setSelectedPlaylist(null);
//     // Refresh playlists when player closes to update progress and completed status
//     const userId = user?.id || user?._id;
//     if (userId && user?.role === "student") {
//       dispatch(fetchStudentPlaylists(userId));
//     }
//   }, [user, dispatch]);

//   const handleBuyNow = useCallback((e, playlist) => {
//     e.stopPropagation();
//     setPurchasePlaylist(playlist);
//     setShowPaymentModal(true);
//   }, []);

//   const handlePurchaseSuccess = useCallback(() => {
//     // Refetch playlists after successful purchase
//     const userId = user?.id || user?._id;
//     if (userId) {
//       setIsLoadingPlaylists(true);
//       dispatch(fetchStudentPlaylists(userId))
//         .finally(() => {
//           setIsLoadingPlaylists(false);
//         });
//     }
//     setShowPaymentModal(false);
//     setPurchasePlaylist(null);
//   }, [user, dispatch]);

//   const filteredPlaylists = studentPlaylists.filter((playlist) =>
//     playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );


//   const handlePlaylistClick = useCallback((playlist) => {
//     // Check if student has access
//     if (playlist.purchase && playlist.purchase.hasAccess) {
//       setSelectedPlaylist(playlist);
//       setIsPlayerOpen(true);
//     } else if (playlist.price > 0) {
//       // Show payment modal if not purchased
//       setPurchasePlaylist(playlist);
//       setShowPaymentModal(true);
//     } else {
//       // Free playlist - allow access
//       setSelectedPlaylist(playlist);
//       setIsPlayerOpen(true);
//     }
//   }, []);

//   const handleProfilePictureClick = useCallback(() => {
//     fileInputRef.current?.click();
//   }, []);

//   const handleProfilePictureChange = useCallback(async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Validate file type (only images)
//     const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
//     if (!allowedTypes.includes(file.type)) {
//       alert("Only image files (JPEG, PNG, GIF, WebP) are allowed");
//       return;
//     }

//     // Validate file size (max 5MB)
//     const maxSize = 5 * 1024 * 1024; // 5MB
//     if (file.size > maxSize) {
//       alert("Image size must be less than 5MB");
//       return;
//     }

//     // Create preview immediately
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setProfilePicturePreview(reader.result);
//     };
//     reader.readAsDataURL(file);

//     const userId = user?.id || user?._id;
//     if (!userId) return;

//     setUploadingProfilePicture(true);
//     try {
//       const formData = new FormData();
//       formData.append("userId", userId);
//       formData.append("image", file);

//       const response = await fetch("/api/user/profile-picture", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();

//       if (data.success) {
//         // Update user in Redux store instead of reloading
//         dispatch(setUser({ ...user, profilePicture: data.profilePicture }));
//         // Clear preview since it's now saved
//         setProfilePicturePreview(null);
//       } else {
//         alert(data.message || "Failed to upload profile picture");
//         setProfilePicturePreview(null);
//       }
//     } catch (error) {
//       console.error("Error uploading profile picture:", error);
//       alert("Failed to upload profile picture");
//       setProfilePicturePreview(null);
//     } finally {
//       setUploadingProfilePicture(false);
//       // Reset file input
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     }
//   }, [user, dispatch]);

//   if (!isAuthenticated ||!mounted ||  !user || user.role !== "student") {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>Loading...</p>
//       </div>
//     );
//   }

  

//   return (
//     <div className="h-screen bg-white flex overflow-hidden relative">


// {/* MOBILE OVERLAY */}
// {isSidebarOpen && (
//   <div
//     onClick={() => setIsSidebarOpen(false)}
//     className="fixed inset-0 bg-black/40 z-40 md:hidden"
//   />
// )}


//       {/* Left Sidebar - Sticky */}
//       <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white fixed top-0 left-0 right-0 z-50">
//         <h1 className="text-lg font-bold">Student Panel</h1>
//         <button
//   onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//   className="text-2xl"
// >
//   ☰
// </button>

//       </div>


//      <div
//   className={`
//     fixed lg:sticky top-0 left-0 z-50
//    h-screen ${isSidebarCollapsed ? "w-20" : "w-64"} bg-white shadow-lg
//     transform transition-transform duration-300 ease-in-out 
//     ${isSidebarOpen ? "translate-x-0" : "-translate-x-full" }
//     lg:translate-x-0 transition-all duration-300 ease-in-out
//     flex flex-col overflow-y-auto
//   `}
// >

//   <div className="lg:hidden flex justify-end p-3">
//   <button
//     onClick={() => setIsSidebarOpen(false)}
//     className="text-2xl"
//   >
//     ✕
//   </button>
// </div>

// {/*  */}

//         <div className="p-6 border-b flex-shrink-0 items-center justify-between">
//           <div className="flex items-center justify-between w-full">

//             <h1 className={`${isSidebarCollapsed ? "hidden" : "block"} text-2xl font-bold text-black`}>
//                Student Panel
//            </h1>
//            <button
//                 onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
//                 className="hidden lg:flex text-xl hover:bg-gray-100 mt-1 rounded p-2" >
//                {isSidebarCollapsed ? (
//               <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//               </svg>
//             ) : (
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//               </svg>
//             )}
//              </button>

//           </div>
//           <div className="mt-4 relative">
//             <div
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className={`flex items-center ${
//   isSidebarCollapsed ? "justify-center" : "gap-3"
// } cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors`}

//             >
//               {/* Profile Picture - Clickable to upload */}
//               {!isSidebarCollapsed && (
//   <div
//     onClick={(e) => {
//       e.stopPropagation();
//       handleProfilePictureClick();
//     }}
//     className="w-10 h-10 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 cursor-pointer hover:border-[#4f7c82]/40 transition-colors relative overflow-hidden"
//   >

//                 {(profilePicturePreview || user?.profilePicture) ? (
//                   <img
//                     src={profilePicturePreview || user.profilePicture}
//                     alt={user.name || user.email}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <svg
//                     className="w-6 h-6"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 )}
//                 {uploadingProfilePicture && (
//                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   </div>
//                 )}
//               </div>

//               )}
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
//                 onChange={handleProfilePictureChange}
//                 className="hidden"
//               />
//               <div
//   className={`flex-1 min-w-0 ${
//     isSidebarCollapsed
//       ? "text-center flex justify-center"
//       : ""
//   }`}
// >

//   {!isSidebarCollapsed && (
//     <p className="text-sm font-medium text-gray-800 truncate">
//       {user?.name || user?.username || user?.email || "Student"}
//     </p>
//   )}

//   <p className="text-xs text-gray-500">
//     Welcome
//   </p>
// </div>

//               {!isSidebarCollapsed && (
//   <svg
//     className={`w-4 h-4 text-gray-500 transition-transform ${
//       showProfileDropdown ? "rotate-180" : ""
//     }`}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//   </svg>
// )}

//             </div>

//             {/* Profile Dropdown */}
//             {showProfileDropdown && (
//               <div
//                 className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <div className="p-4 border-b">
//                   <div
//                     onClick={(e) => {
//                       e.stopPropagation(); // ⛔ stop dropdown toggle
//                       handleProfilePictureClick();
//                     }}
//                     className="w-16 h-16 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 mx-auto mb-2 cursor-pointer hover:border-[#4f7c82]/40 transition-colors relative overflow-hidden"
//                     title="Click to upload profile picture"
//                   >
//                     {(profilePicturePreview || user?.profilePicture) ? (
//                       <img
//                         src={profilePicturePreview || user.profilePicture}
//                         alt={user.name || user.email}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <svg
//                         className="w-8 h-8"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     )}
//                     {uploadingProfilePicture && (
//                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                       </div>
//                     )}
//                   </div>
//                   <p className="text-center font-semibold text-gray-800">
//                     {user?.name || user?.username || user?.email || "Student"}
//                   </p>
//                   <p className="text-center text-sm text-gray-500">Student</p>
//                 </div>

//               </div>
//             )}
//           </div>
//         </div>

//         {/* Menu Items */}
//         <div className="flex-1 overflow-y-auto py-4">
//           <div className="px-3">
//              <div className="flex items-center justify-between px-3 mb-2">
//   {!isSidebarCollapsed && (
//     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
//       Main
//     </p>
//   )}
// </div>


// <button
//   onClick={() => {
//     setActiveTab("playlists");
//     if (window.innerWidth < 1024) {
//       setIsSidebarOpen(false);
//     }
//   }}
//   className={`w-full flex items-center ${
//     isSidebarCollapsed ? "justify-center" : "gap-3"
//   } px-3 py-3 rounded-lg mb-1 transition-colors ${
//     activeTab === "playlists"
//       ? "bg-[#4f7c82] text-white"
//       : "text-black hover:bg-black/5"
//   }`}
// >
//   <span className="text-lg">📚</span>

//   {!isSidebarCollapsed && (
//     <span className="font-medium">Available Playlists</span>
//   )}

//   {activeTab === "playlists" && (
//     <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//   )}
// </button>


//             <button
//               onClick={() => setActiveTab("purchases")}
//               className={`w-full flex items-center ${
//     isSidebarCollapsed ? "justify-center" : "gap-3"
//   } px-3 py-3 rounded-lg mb-1 transition-colors ${
//     activeTab === "purchases"
//       ? "bg-[#4f7c82] text-white"
//       : "text-black hover:bg-black/5"
//   }`}
//             >
//               <span className="text-lg">🛒</span>
//               {!isSidebarCollapsed && (
//   <span className="font-medium">My Purchases</span>
// )}

//               {activeTab === "purchases" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>

            
//             <button
//               onClick={() => setActiveTab("completed")}
//               className={`relative w-full flex items-center ${
//   isSidebarCollapsed ? "justify-center" : "gap-3"
// } px-3 py-3 rounded-lg mb-1 transition-colors ${
//   activeTab === "completed"
//     ? "bg-[#4f7c82] text-white"
//     : "text-black hover:bg-black/5"
// }`}

//             >
//               <span className="text-lg">✅</span>
//               {!isSidebarCollapsed && (
//   <span className="font-medium">Completed Playlist</span>
// )}
//               {activeTab === "completed" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             <button
//               onClick={() => setActiveTab("pendingPlaylists")}
//               className={`w-full flex items-center ${
//     isSidebarCollapsed ? "justify-center" : "gap-3"
//   } px-3 py-3 rounded-lg mb-1 transition-colors ${
//     activeTab === "pendingPlaylists"
//       ? "bg-[#4f7c82] text-white"
//       : "text-black hover:bg-black/5"
//   }`}
//             >
//               <span className="text-lg">⏳</span>        {!isSidebarCollapsed && (
//   <span className="font-medium">Pending Playlists</span>
// )}
//               {activeTab === "pendingPlaylists" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             {/* <button
//               onClick={() => setActiveTab("progress")}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "progress"
//                 ? "bg-[#4f7c82] text-white"
//                 : "text-black hover:bg-black/5"
//                 }`}
//             >
//               <span className="text-lg">📈</span>
//               <span className="font-medium">Progress</span>
//               {activeTab === "progress" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button> */}
//             <button
//               onClick={() => setActiveTab("messages")}
//               className={`w-full flex items-center ${
//     isSidebarCollapsed ? "justify-center" : "gap-3"
//   } px-3 py-3 rounded-lg mb-1 transition-colors ${
//     activeTab === "messages"
//       ? "bg-[#4f7c82] text-white"
//       : "text-black hover:bg-black/5"
//   }`}
//             >
//               <span className="text-lg">💬</span>
//                 {!isSidebarCollapsed && (
//   <span className="font-medium">Messages</span>
// )}
//               {unreadMessageCount > 0 && (
//                 <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
//                   {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
//                 </span>
//               )}
//               {activeTab === "messages" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
            
//             <button
//               onClick={() => setActiveTab("pending")}
//               className={`w-full flex items-center ${
//     isSidebarCollapsed ? "justify-center" : "gap-3"
//   } px-3 py-3 rounded-lg mb-1 transition-colors ${
//     activeTab === "pending"
//       ? "bg-[#4f7c82] text-white"
//       : "text-black hover:bg-black/5"
//   }`}
//             >
//               <span className="text-lg">📋</span>
//                 {!isSidebarCollapsed && (
//   <span className="font-medium">Pending Approvals</span>
// )}
//               {activeTab === "pending" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             <div className="mt-4 pt-4 border-t border-gray-200">
//               <button
//                 onClick={(e) => {
//                   e.preventDefault();
//                   handleLogout();
//                 }}
//                 className="w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors bg-[#4f7c82] text-white hover:bg-[#42686d]"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                 </svg>
//                      {!isSidebarCollapsed && (
//                       <span className="font-medium">logout</span>)}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Content Area - Scrollable */}
//       <div className="flex-1 overflow-y-auto p-8">
//         {/* Tab Content */}
//         {activeTab === "playlists" && (
//           <div>
//             <h2 className="text-2xl font-semibold pt-12 md:pt-0 text-black mb-6">
//               Available Playlists
//             </h2>

//             {/* 🔍 Search Bar */}
//             <div className="mb-6 max-w-md">
//               <input
//                 type="text"
//                 placeholder="Search playlist by title..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg 
//                    focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//               />
//             </div>

//             {(loading || isLoadingPlaylists) && studentPlaylists.length === 0 ? (
//               <div className="text-center py-8">
//                 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82] mb-4"></div>
//                 <p className="text-black/70">Loading playlists...</p>
//               </div>
//             ) : error ? (
//               <div className="text-center py-8">
//                 <div className="bg-black/5 border border-black/20 text-black px-4 py-3 rounded-lg inline-block">
//                   <p className="font-semibold">Error loading playlists</p>
//                   <p className="text-sm mt-1">{error}</p>
//                   <button
//                     onClick={() => {
//                       const userId = user?.id || user?._id;
//                       if (userId) {
//                         setIsLoadingPlaylists(true);
//                         dispatch(fetchStudentPlaylists(userId))
//                           .finally(() => {
//                             setIsLoadingPlaylists(false);
//                           });
//                       }
//                     }}
//                     className="mt-3 px-4 py-2 bg-black text-white rounded hover:bg-black/90 text-sm"
//                   >
//                     Retry
//                   </button>
//                 </div>
//               </div>
//             )  : filteredPlaylists.length === 0 ? (
//             <div className="text-center py-8">
//               <p className="text-black/70">
//                 No playlists found matching your search.
//               </p>
//             </div>
//             ) : (

//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//               {filteredPlaylists.map((playlist) => {
//                   const instructor = playlist.instructor;
//                 const hasAccess = playlist.price === 0 || (playlist.purchase && playlist.purchase.hasAccess);
//                 const isPurchased = playlist.purchase && playlist.purchase.purchased;
//                 const isExpired = playlist.purchase && playlist.purchase.isExpired;
//                 const isPending = playlist.purchase && playlist.purchase.status === "pending";

//                 return (
//                   <div
//                     key={playlist._id}
//                     className={`group bg-white border-2 rounded-xl p-4 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden ${hasAccess
//                       ? "border-gray-200 hover:border-[#4f7c82]/50 cursor-pointer"
//                       : "border-gray-300"
//                       }`}
//                     onClick={() => hasAccess && handlePlaylistClick(playlist)}
//                   >
                   
//                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                   
//                     <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                       <div className="absolute inset-0 flex items-center justify-center">
//                         <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                           <path d="M8 5v14l11-7z" />
//                         </svg>
//                       </div>
//                       <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                         {playlist.content?.length || playlist.videos?.length || 0} items
//                       </div>
//                     </div>

                  
//                     <div className="relative z-10 flex-1">
//                       <h3 className={`font-bold text-lg mb-2 line-clamp-2 transition-colors ${hasAccess ? "text-gray-900 group-hover:text-[#4f7c82]" : "text-gray-700"
//                         }`}>
//                         {playlist.title}
//                       </h3>


//                         <div className="flex items-center justify-between mb-1">
//   <div className="flex items-center gap-2 text-sm text-gray-600">
//     {instructor?._id ? (
//       <Link
//         href={`/instructor/${instructor._id}`}
//         onClick={(e) => e.stopPropagation()}
//         className="hover:text-[#4f7c82] hover:underline"
//       >
//         {instructor?.name || "Unknown"}
//       </Link>
//     ) : (
//       <span>{instructor?.name || "Unknown"}</span>
//     )}
//     <span className="text-gray-400">•</span>
//     <div className="flex items-center gap-1">
//       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//         <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
//       </svg>
//       <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
//     </div>
//   </div>
// </div>
//                       {/* Buy Now Button or Pending Status - fixed height container */}
//                       <div className="h-10">
//                         {!hasAccess && playlist.price > 0 && !isPending && (
//                           <div className="flex items-center gap-2">
//                             <span className="text-lg font-bold text-[#4f7c82] whitespace-nowrap">
//                               PKR {playlist.price.toLocaleString()}
//                             </span>
//                             <Button
//                               onClick={(e) => handleBuyNow(e, playlist)}
//                               className="flex-1 bg-[#4f7c82] text-white hover:bg-[#3d6166]"
//                             >
//                               {isExpired ? "Buy Again" : "Buy Now"}
//                             </Button>
//                           </div>
//                         )}

//                         {isPending && (
//                           <div className="rounded-lg text-center">
//                             <div className="flex items-center justify-center gap-2 text-[#4f7c82] font-medium text-[12px]">
//                               <svg className="w-5 h-5" fill="none" stroke="#4f7c82" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               Waiting for Admin Approval
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       {/* Status Badge - fixed height for alignment */}
//                       <div className="flex justify-center h-5">
//                         {playlist.price > 0 && (
//                           <>
//                             {(isPurchased && !hasAccess && isExpired) && (
//                               <span className="text-xs bg-red-100 text-[#4f7c82] px-3 py-1 rounded">
//                                 Expired
//                               </span>
//                             )}
//                             {(isPurchased && hasAccess && playlist.purchase.status === "lifetime") && (
//                               <span className="text-xs bg-green-100 text-[#4f7c82] px-3 py-1 rounded">
//                                 Lifetime Access
//                               </span>
//                             )}
//                             {(isPurchased && hasAccess && playlist.purchase.status === "active") && (
//                               <span className="text-xs bg-blue-100 text-[#4f7c82] px-3 py-1 rounded">
//                                 Active
//                               </span>
//                             )}
//                           </>
//                         )}
//                       </div>

//                       {/* Message Instructor Button */}
//                       {instructor && instructor._id && (
//                         <Button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setSelectedInstructor(instructor);
//                             setIsMessageModalOpen(true);
//                           }}
//                           className="w-full bg-[#4f7c82] text-white hover:bg-[#3d6166] flex items-center justify-center gap-2"
//                         >
//                           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
//                           </svg>
//                           Message
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//             )}
//           </div>
//         )}

//         {activeTab === "purchases" && (
//           <div>
//             <h2 className="text-2xl font-semibold pt-12 md:pt-0 text-black mb-6">
//               My Purchases
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) => playlist.purchase && playlist.purchase.hasAccess)
//                   .map((playlist) => {
//                     const hasAccess = playlist.purchase && playlist.purchase.hasAccess;
//                     return (
//                       <div
//                         key={playlist._id}
//                         className="cursor-pointer group bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#4f7c82]/50 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden"
//                         onClick={() => handlePlaylistClick(playlist)}
//                       >
//                         {/* Hover effect background */}
//                         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                         {/* Thumbnail Area */}
//                         <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                           <div className="absolute inset-0 flex items-center justify-center">
//                             <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                               <path d="M8 5v14l11-7z" />
//                             </svg>
//                           </div>
//                           <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                             {playlist.content?.length || playlist.videos?.length || 0} items
//                           </div>
//                         </div>

//                         {/* Title and Info */}
//                         <div className="relative z-10 flex-1">
//                           <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-[#4f7c82] transition-colors">
//                             {playlist.title}
//                           </h3>
//                           <p className="text-sm text-gray-600 mb-1">
//                             {playlist.instructor?.name || "Unknown"}
//                           </p>
                          
//                           {/* Total Viewers */}
//                           <div className="mb-2 flex items-center gap-1 text-sm text-gray-600">
//                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                               <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
//                             </svg>
//                             <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
//                           </div>

//                           {/* {playlist.deleted && (
//                             <div className="mb-2 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
//                               ⚠️ No longer available
//                             </div>
//                           )} */}
//                           <div className="">
//                             {playlist.purchase.status === "lifetime" ? (
//                               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
//                                 Lifetime Access
//                               </span>
//                             ) : (
//                               <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
//                                 Expires: {playlist.purchase.expiresAt ? new Date(playlist.purchase.expiresAt).toLocaleDateString() : 'N/A'}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">
//                   You haven't purchased any playlists yet. Visit "Available Playlists" to purchase.
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "completed" && (
//           <div>
//             <h2 className="text-2xl font-semibold pt-12 md:pt-0 text-black mb-6">
//               Completed Playlists
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) =>
//                     playlist.purchase &&
//                     playlist.purchase.hasAccess &&
//                     playlist.purchase.quizPassed === true
//                   )
//                   .map((playlist) => (
//                     <div
//                       key={playlist._id}
//                       className="cursor-pointer group bg-white border-2 border-green-200 rounded-xl p-4 hover:border-green-400 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden"
//                       onClick={() => handlePlaylistClick(playlist)}
//                     >
//                       {/* Hover effect background */}
//                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                       {/* Thumbnail Area */}
//                       <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                         <div className="absolute inset-0 flex items-center justify-center">
//                           <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M8 5v14l11-7z" />
//                           </svg>
//                         </div>
//                         <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                           {playlist.content?.length || playlist.videos?.length || 0} items
//                         </div>
//                       </div>

//                       {/* Title and Info */}
//                       <div className="relative z-10 flex-1">
//                         <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
//                           {playlist.title}
//                         </h3>
//                         <p className="text-sm text-gray-600 mb-1">
//                           {playlist.instructor?.name || "Unknown"}
//                         </p>
                        
//                         {/* Total Viewers */}
//                         <div className="mb-2 flex items-center gap-1 text-sm text-gray-600">
//                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                             <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
//                           </svg>
//                           <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
//                         </div>

//                         {/* {playlist.deleted && (
//                           <div className="mb-2 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
//                             ⚠️ No longer available
//                           </div>
//                         )} */}
//                         <div className="mt-2 space-y-1">
//                           <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
//                             Purchase Completed
//                           </span>
//                           {playlist.progress && (
//                             <p className="text-xs text-gray-600 mt-1">
//                               Progress: {Math.round(playlist.progress.overallProgress || 0)}%
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 {studentPlaylists.filter((playlist) =>
//                   playlist.purchase &&
//                   playlist.purchase.hasAccess &&
//                   playlist.purchase.quizPassed === true
//                 ).length === 0 && (
//                     <div className="col-span-full text-center py-8">
//                       <p className="text-black/70">
//                         No completed playlists yet. Pass the quiz to complete a playlist.
//                       </p>
//                     </div>
//                   )}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">No playlists available.</p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "pendingPlaylists" && (
//           <div>
//             <h2 className="text-2xl font-semibold pt-12 md:pt-0 text-black mb-6">
//               Pending Playlists
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) =>
//                     playlist.purchase &&
//                     playlist.purchase.hasAccess &&
//                     playlist.purchase.quizPassed !== true
//                   )
//                   .map((playlist) => {
//                     const attemptsUsed = playlist.purchase.quizAttempts || 0;
//                     const attemptsRemaining = 3 - attemptsUsed;
//                     return (
//                       <div
//                         key={playlist._id}
//                         className="cursor-pointer group bg-white border-2 border-[#4f7c82] rounded-xl p-4   transition-all duration-300 flex flex-col relative overflow-hidden"
//                         onClick={() => handlePlaylistClick(playlist)}
//                       >
//                         {/* Hover effect background */}
//                         <div className="absolute top-0 right-0 w-32 h-32 bg-[#4f7c82] rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                         {/* Thumbnail Area */}
//                         <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                           <div className="absolute inset-0 flex items-center justify-center">
//                             <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                               <path d="M8 5v14l11-7z" />
//                             </svg>
//                           </div>
//                           <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                             {playlist.content?.length || playlist.videos?.length || 0} items
//                           </div>
//                         </div>

//                         {/* Title and Info */}
//                         <div className="relative z-10 flex-1">
//                           <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2  transition-colors">
//                             {playlist.title}
//                           </h3>
//                           <p className="text-sm text-gray-600 mb-1">
//                             {playlist.instructor?.name || "Unknown"}
//                           </p>
                          
//                           {/* Total Viewers */}
//                           <div className="mb-2 flex items-center gap-1 text-sm text-gray-600">
//                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                               <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
//                             </svg>
//                             <span>{playlist.totalViewers || 0} viewer{(playlist.totalViewers || 0) !== 1 ? 's' : ''}</span>
//                           </div>

//                           <div className="mt-2 space-y-1">
//                             <span className="text-xs bg-gray-100 text-[#4f7c82] px-2 py-1 rounded font-medium">
//                               Quiz Pending
//                             </span>
//                             {attemptsUsed > 0 && (
//                               <span className={`text-xs block mt-1 px-2 py-1 rounded font-medium ${attemptsRemaining === 0
//                                 ? "bg-red-100 text-gray-700"
//                                 : "bg-yellow-100 text-gray-700"
//                                 }`}>
//                                 {attemptsRemaining === 0
//                                   ? "⚠ All attempts used"
//                                   : `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining`
//                                 }
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 {studentPlaylists.filter((playlist) =>
//                   playlist.purchase &&
//                   playlist.purchase.hasAccess &&
//                   playlist.purchase.quizPassed !== true
//                 ).length === 0 && (
//                     <div className="col-span-full text-center py-8">
//                       <p className="text-black/70">
//                         No pending playlists. All purchased playlists are completed!
//                       </p>
//                     </div>
//                   )}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">No playlists available.</p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "pending" && (
//           <PendingApprovals />
//         )}

//         {activeTab === "progress" && (
//           <div>
//             <h2 className="text-2xl font-semibold pt-12 md:pt-0 text-black mb-6">
//               My Progress
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) => playlist.purchase && playlist.purchase.hasAccess)
//                   .map((playlist) => {
//                     const progress = playlist.progress?.overallProgress || 0;
//                     const radius = 50;
//                     const circumference = 2 * Math.PI * radius;
//                     const offset = circumference - (progress / 100) * circumference;

//                     return (
//                       <div
//                         key={playlist._id}
//                         className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
//                         onClick={() => handlePlaylistClick(playlist)}
//                       >
//                         {/* Title */}
//                         <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 text-center min-h-[3rem]">
//                           {playlist.title}
//                         </h3>

//                         {/* Circular Progress Indicator */}
//                         <div className="flex justify-center items-center mb-4 relative mx-auto" style={{ width: '128px', height: '128px' }}>
//                           <svg className="transform -rotate-90 w-32 h-32 absolute inset-0">
//                             {/* Background circle */}
//                             <circle
//                               cx="64"
//                               cy="64"
//                               r={radius}
//                               stroke="#e5e7eb"
//                               strokeWidth="12"
//                               fill="none"
//                             />
//                             {/* Progress circle */}
//                             <circle
//                               cx="64"
//                               cy="64"
//                               r={radius}
//                               stroke="#4f7c82"
//                               strokeWidth="12"
//                               fill="none"
//                               strokeLinecap="round"
//                               strokeDasharray={circumference}
//                               strokeDashoffset={offset}
//                               className="transition-all duration-300"
//                             />
//                           </svg>
//                           {/* Center text */}
//                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//                             <span className="text-2xl font-bold text-gray-900">
//                               {Math.round(progress)}
//                             </span>
//                             <span className="text-xs text-gray-500 mt-0.5">%</span>
//                           </div>
//                         </div>

//                         {/* Progress Text */}
//                         <div className="text-center mb-4">
//                           <p className="text-sm font-medium text-gray-700">
//                             {Math.round(progress)}% Complete
//                           </p>
//                           {playlist.purchase.quizPassed ? (
//                             <p className="text-xs text-[#4f7c82]font-medium mt-1">
//                                Quiz Passed
//                             </p>
//                           ) : (
//                             <p className="text-xs text-[#4f7c82] font-medium mt-1">
//                               Quiz Pending
//                             </p>
//                           )}
//                         </div>

//                         {/* Continue Button */}
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handlePlaylistClick(playlist);
//                           }}
//                           className="w-full text-[#4f7c82] hover:bg-[#4f7c82] hover:text-white border border-[#4f7c82] rounded-lg py-2 px-4 transition-colors font-medium"
//                         >
//                           {progress === 100 ? "Review" : "Continue Learning →"}
//                         </button>
//                       </div>
//                     );
//                   })}
//                 {studentPlaylists.filter((playlist) => playlist.purchase && playlist.purchase.hasAccess).length === 0 && (
//                   <div className="col-span-full text-center py-8">
//                     <p className="text-black/70">
//                       You haven't purchased any playlists yet. Purchase playlists to track your progress!
//                     </p>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">No progress to show yet.</p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "messages" && <StudentMessages onUnreadCountChange={setUnreadMessageCount} />}
//         {/* {activeTab === "messages" && (
//   <StudentMessages instructor={selectedInstructor} />
// )} */}

//       </div>

//       {/* Video Player Modal */}
//       <VideoPlayer
//         playlist={selectedPlaylist}
//         open={isPlayerOpen}
//         onClose={handleClosePlayer}
//       />

//       {/* Message Modal */}
// {isMessageModalOpen && selectedInstructor && (
//   <MessageModal
//     open={isMessageModalOpen}
//     onClose={() => {
//       setIsMessageModalOpen(false);
//       setSelectedInstructor(null);
//     }}
//     otherUserId={selectedInstructor._id}
//     otherUserName={selectedInstructor.name}
//     otherUserRole="instructor"
//   />
// )}


//       {/* Payment Modal */}
//       {purchasePlaylist && (
//         <PaymentModal
//           open={showPaymentModal}
//           onClose={() => {
//             setShowPaymentModal(false);
//             setPurchasePlaylist(null);
//           }}
//           playlist={purchasePlaylist}
//           onSuccess={handlePurchaseSuccess}
//         />
//       )}

//       {/* Click outside to close dropdown */}
//       {showProfileDropdown && (
//         <div
//           className="fixed inset-0 z-40"
//           onClick={(e) => {
//             e.stopPropagation();
//             setShowProfileDropdown(false);
//           }}
//         />
//       )}
//     </div>
//   );
// }

// export default memo(StudentDashboard);












































// "use client";

// import { useEffect, useState, useCallback, memo, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { useDispatch, useSelector } from "react-redux";
// import { logout, setUser } from "@/store/auth_temp.js";
// import { fetchStudentPlaylists } from "@/store/playlist";
// import { Button } from "@/components/Button";
// import VideoPlayer from "@/components/VideoPlayer";
// import PaymentModal from "@/components/PaymentModal";
// import Link from "next/link";
// import StudentMessages from "./messages";

// function StudentDashboard() {
//   const router = useRouter();
//   const dispatch = useDispatch();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const { user, isAuthenticated } = useSelector((state) => state.auth);
//   const { studentPlaylists, loading, error } = useSelector((state) => state.playlist);
//   const [selectedPlaylist, setSelectedPlaylist] = useState(null);
//   const [isPlayerOpen, setIsPlayerOpen] = useState(false);
//   const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
//   const [activeTab, setActiveTab] = useState("playlists");
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [purchasePlaylist, setPurchasePlaylist] = useState(null);
//   const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
//   const [profilePicturePreview, setProfilePicturePreview] = useState(null);
//   const fileInputRef = useRef(null);

//   useEffect(() => {
//     if (!isAuthenticated || !user) {
//       router.push("/login");
//     } else if (user.role !== "student") {
//       // Redirect to appropriate dashboard
//       if (user.role === "admin") {
//         router.push("/dashboard/admin");
//       } else if (user.role === "instructor") {
//         router.push("/dashboard/instructor");
//       }
//     }
//   }, [isAuthenticated, user, router]);

//   // Fetch approved playlists for student
//   useEffect(() => {
//     const userId = user?.id || user?._id;
//     if (userId && user?.role === "student") {
//       setIsLoadingPlaylists(true);
//       dispatch(fetchStudentPlaylists(userId))
//         .finally(() => {
//           setIsLoadingPlaylists(false);
//         });
//     }
//   }, [user?.id, user?._id, user?.role, dispatch]);

//   const handleLogout = useCallback(() => {
//     try {
//       dispatch(logout());
//       router.replace("/login");
//     } catch (error) {
//       console.error("Logout error:", error);
//       // Force logout even if there's an error
//       dispatch(logout());
//       router.replace("/login");
//     }
//   }, [dispatch, router]);

//   const handleClosePlayer = useCallback(() => {
//     setIsPlayerOpen(false);
//     setSelectedPlaylist(null);
//     // Refresh playlists when player closes to update progress and completed status
//     const userId = user?.id || user?._id;
//     if (userId && user?.role === "student") {
//       dispatch(fetchStudentPlaylists(userId));
//     }
//   }, [user, dispatch]);

//   const handleBuyNow = useCallback((e, playlist) => {
//     e.stopPropagation();
//     setPurchasePlaylist(playlist);
//     setShowPaymentModal(true);
//   }, []);

//   const handlePurchaseSuccess = useCallback(() => {
//     // Refetch playlists after successful purchase
//     const userId = user?.id || user?._id;
//     if (userId) {
//       setIsLoadingPlaylists(true);
//       dispatch(fetchStudentPlaylists(userId))
//         .finally(() => {
//           setIsLoadingPlaylists(false);
//         });
//     }
//     setShowPaymentModal(false);
//     setPurchasePlaylist(null);
//   }, [user, dispatch]);

//   const handlePlaylistClick = useCallback((playlist) => {
//     // Check if student has access
//     if (playlist.purchase && playlist.purchase.hasAccess) {
//       setSelectedPlaylist(playlist);
//       setIsPlayerOpen(true);
//     } else if (playlist.price > 0) {
//       // Show payment modal if not purchased
//       setPurchasePlaylist(playlist);
//       setShowPaymentModal(true);
//     } else {
//       // Free playlist - allow access
//       setSelectedPlaylist(playlist);
//       setIsPlayerOpen(true);
//     }
//   }, []);

//   const handleProfilePictureClick = useCallback(() => {
//     fileInputRef.current?.click();
//   }, []);

//   const handleProfilePictureChange = useCallback(async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Validate file type (only images)
//     const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
//     if (!allowedTypes.includes(file.type)) {
//       alert("Only image files (JPEG, PNG, GIF, WebP) are allowed");
//       return;
//     }

//     // Validate file size (max 5MB)
//     const maxSize = 5 * 1024 * 1024; // 5MB
//     if (file.size > maxSize) {
//       alert("Image size must be less than 5MB");
//       return;
//     }

//     // Create preview immediately
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setProfilePicturePreview(reader.result);
//     };
//     reader.readAsDataURL(file);

//     const userId = user?.id || user?._id;
//     if (!userId) return;

//     setUploadingProfilePicture(true);
//     try {
//       const formData = new FormData();
//       formData.append("userId", userId);
//       formData.append("image", file);

//       const response = await fetch("/api/user/profile-picture", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();

//       if (data.success) {
//         // Update user in Redux store instead of reloading
//         dispatch(setUser({ ...user, profilePicture: data.profilePicture }));
//         // Clear preview since it's now saved
//         setProfilePicturePreview(null);
//       } else {
//         alert(data.message || "Failed to upload profile picture");
//         setProfilePicturePreview(null);
//       }
//     } catch (error) {
//       console.error("Error uploading profile picture:", error);
//       alert("Failed to upload profile picture");
//       setProfilePicturePreview(null);
//     } finally {
//       setUploadingProfilePicture(false);
//       // Reset file input
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     }
//   }, [user, dispatch]);

//   if (!isAuthenticated || !user || user.role !== "student") {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen bg-white flex overflow-hidden">
//       {/* Left Sidebar - Sticky */}
//       <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white fixed top-0 left-0 right-0 z-50">
//         <h1 className="text-lg font-bold">Student Panel</h1>
//         <button onClick={() => setIsSidebarOpen(true)}>☰</button>
//       </div>


//       <div
//         className={`
//     fixed md:sticky top-0 left-0 z-50
//     h-screen w-64 bg-white shadow-lg
//     transform transition-transform duration-300
//     ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
//     md:translate-x-0
//     flex flex-col overflow-y-auto
//   `}
//       >
//         <div className="p-6 border-b flex-shrink-0">
//           <h1 className="text-2xl font-bold text-black">Student Panel</h1>
//           <div className="mt-4 relative">
//             <div
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
//             >
//               {/* Profile Picture - Clickable to upload */}
//               <div
//                 onClick={(e) => {
//                   e.stopPropagation();     // 👈 prevents dropdown
//                   handleProfilePictureClick();
//                 }}
//                 className="w-10 h-10 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 cursor-pointer hover:border-[#4f7c82]/40 transition-colors relative overflow-hidden"
//                 title="Click to upload profile picture"
//               >
//                 {(profilePicturePreview || user?.profilePicture) ? (
//                   <img
//                     src={profilePicturePreview || user.profilePicture}
//                     alt={user.name || user.email}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <svg
//                     className="w-6 h-6"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 )}
//                 {uploadingProfilePicture && (
//                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   </div>
//                 )}
//               </div>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
//                 onChange={handleProfilePictureChange}
//                 className="hidden"
//               />
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-gray-800 truncate">
//                   {user?.name || user?.username || user?.email || "Student"}
//                 </p>
//                 <p className="text-xs text-gray-500">Welcome</p>
//               </div>
//               <svg
//                 className={`w-4 h-4 text-gray-500 transition-transform ${showProfileDropdown ? "rotate-180" : ""
//                   }`}
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>

//             {/* Profile Dropdown */}
//             {showProfileDropdown && (
//               <div
//                 className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <div className="p-4 border-b">
//                   <div
//                     onClick={(e) => {
//                       e.stopPropagation(); // ⛔ stop dropdown toggle
//                       handleProfilePictureClick();
//                     }}
//                     className="w-16 h-16 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 mx-auto mb-2 cursor-pointer hover:border-[#4f7c82]/40 transition-colors relative overflow-hidden"
//                     title="Click to upload profile picture"
//                   >
//                     {(profilePicturePreview || user?.profilePicture) ? (
//                       <img
//                         src={profilePicturePreview || user.profilePicture}
//                         alt={user.name || user.email}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <svg
//                         className="w-8 h-8"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     )}
//                     {uploadingProfilePicture && (
//                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                       </div>
//                     )}
//                   </div>
//                   <p className="text-center font-semibold text-gray-800">
//                     {user?.name || user?.username || user?.email || "Student"}
//                   </p>
//                   <p className="text-center text-sm text-gray-500">Student</p>
//                 </div>
                
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Menu Items */}
//         <div className="flex-1 overflow-y-auto py-4">
//           <div className="px-3">
//             <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
//               Main
//             </p>
//             <button
//               onClick={() => setActiveTab("playlists")}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "playlists"
//                 ? "bg-[#4f7c82] text-white"
//                 : "text-black hover:bg-black/5"
//                 }`}
//             >
//               <span className="text-lg">📚</span>
//               <span className="font-medium">Available Playlists</span>
//               {activeTab === "playlists" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             <button
//               onClick={() => setActiveTab("purchases")}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "purchases"
//                 ? "bg-[#4f7c82] text-white"
//                 : "text-black hover:bg-black/5"
//                 }`}
//             >
//               <span className="text-lg">🛒</span>
//               <span className="font-medium">My Purchases</span>
//               {activeTab === "purchases" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             <button
//               onClick={() => setActiveTab("completed")}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "completed"
//                 ? "bg-[#4f7c82] text-white"
//                 : "text-black hover:bg-black/5"
//                 }`}
//             >
//               <span className="text-lg">✅</span>
//               <span className="font-medium">Completed Playlists</span>
//               {activeTab === "completed" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             <button
//               onClick={() => setActiveTab("pending")}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "pending"
//                 ? "bg-[#4f7c82] text-white"
//                 : "text-black hover:bg-black/5"
//                 }`}
//             >
//               <span className="text-lg">⏳</span>
//               <span className="font-medium">Pending Playlists</span>
//               {activeTab === "pending" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             {/* <button
//               onClick={() => setActiveTab("progress")}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "progress"
//                 ? "bg-[#4f7c82] text-white"
//                 : "text-black hover:bg-black/5"
//                 }`}
//             >
//               <span className="text-lg">📈</span>
//               <span className="font-medium">Progress</span>
//               {activeTab === "progress" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button> */}
//             <button
//               onClick={() => setActiveTab("messages")}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${activeTab === "messages"
//                 ? "bg-[#4f7c82] text-white"
//                 : "text-black hover:bg-black/5"
//                 }`}
//             >
//               <span className="text-lg">💬</span>
//               <span className="font-medium">Messages</span>
//               {activeTab === "messages" && (
//                 <div className="ml-auto w-1 h-6 bg-white rounded"></div>
//               )}
//             </button>
//             <div className="mt-4 pt-4 border-t border-gray-200">
//               <button
//                 onClick={(e) => {
//                   e.preventDefault();
//                   handleLogout();
//                 }}
//                 className="w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors text-[#4f7c82] hover:bg-red-50"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                 </svg>
//                 <span className="font-medium">Logout</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Content Area - Scrollable */}
//       <div className="flex-1 overflow-y-auto p-8">
//         {/* Tab Content */}
//         {activeTab === "playlists" && (
//           <div>
//             <h2 className="text-2xl font-semibold text-black mb-6">
//               Available Playlists
//             </h2>

//             {(loading || isLoadingPlaylists) && studentPlaylists.length === 0 ? (
//               <div className="text-center py-8">
//                 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82] mb-4"></div>
//                 <p className="text-black/70">Loading playlists...</p>
//               </div>
//             ) : error ? (
//               <div className="text-center py-8">
//                 <div className="bg-black/5 border border-black/20 text-black px-4 py-3 rounded-lg inline-block">
//                   <p className="font-semibold">Error loading playlists</p>
//                   <p className="text-sm mt-1">{error}</p>
//                   <button
//                     onClick={() => {
//                       const userId = user?.id || user?._id;
//                       if (userId) {
//                         setIsLoadingPlaylists(true);
//                         dispatch(fetchStudentPlaylists(userId))
//                           .finally(() => {
//                             setIsLoadingPlaylists(false);
//                           });
//                       }
//                     }}
//                     className="mt-3 px-4 py-2 bg-black text-white rounded hover:bg-black/90 text-sm"
//                   >
//                     Retry
//                   </button>
//                 </div>
//               </div>
//             ) : studentPlaylists.length === 0 ? (
//               <div className="text-center py-8">
//                 <p className="text-black/70">
//                   No approved playlists available yet. Check back later!
//                 </p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists.map((playlist) => {
//                   const hasAccess = playlist.price === 0 || (playlist.purchase && playlist.purchase.hasAccess);
//                   const isPurchased = playlist.purchase && playlist.purchase.purchased;
//                   const isExpired = playlist.purchase && playlist.purchase.isExpired;

//                   return (
//                     <div
//                       key={playlist._id}
//                       className={`group bg-white border-2 rounded-xl p-4 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden ${hasAccess
//                         ? "border-gray-200 hover:border-[#4f7c82]/50 cursor-pointer"
//                         : "border-gray-300"
//                         }`}
//                       onClick={() => hasAccess && handlePlaylistClick(playlist)}
//                     >
//                       {/* Hover effect background */}
//                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                       {/* Thumbnail Area - YouTube style */}
//                       <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                         <div className="absolute inset-0 flex items-center justify-center">
//                           <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M8 5v14l11-7z" />
//                           </svg>
//                         </div>
//                         <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                           {playlist.content?.length || playlist.videos?.length || 0} items
//                         </div>
//                       </div>

//                       {/* Title and Info */}
//                       <div className="relative z-10 flex-1">
//                         <h3 className={`font-bold text-lg mb-2 line-clamp-2 transition-colors ${hasAccess ? "text-gray-900 group-hover:text-[#4f7c82]" : "text-gray-700"
//                           }`}>
//                           {playlist.title}
//                         </h3>
//                         <p className="text-sm text-gray-600 mb-1">
//                           {playlist.instructor?._id ? (
//                             <Link
//                               href={`/instructor/${playlist.instructor._id}`}
//                               onClick={(e) => e.stopPropagation()}
//                               className="hover:text-[#4f7c82] hover:underline"
//                             >
//                               {playlist.instructor?.name || "Unknown"}
//                             </Link>
//                           ) : (
//                             <span>{playlist.instructor?.name || "Unknown"}</span>
//                           )}
//                         </p>

//                         {/* Price and Purchase Status */}
//                         <div className="mt-2 mb-2">
//                           {playlist.price > 0 ? (
//                             <div className="flex items-center justify-between">
//                               <p className="text-lg font-bold text-[#4f7c82]">
//                                 PKR {playlist.price.toLocaleString()}
//                               </p>
//                               {isPurchased && !hasAccess && isExpired && (
//                                 <span className="text-xs bg-red-100 text-[#4f7c82] px-2 py-1 rounded">
//                                   Expired
//                                 </span>
//                               )}
//                               {isPurchased && hasAccess && playlist.purchase.status === "lifetime" && (
//                                 <span className="text-xs bg-green-100 text-[#4f7c82] px-2 py-1 rounded">
//                                   Lifetime Access
//                                 </span>
//                               )}
//                               {isPurchased && hasAccess && playlist.purchase.status === "active" && (
//                                 <span className="text-xs bg-blue-100 text-[#4f7c82] px-2 py-1 rounded">
//                                   Active
//                                 </span>
//                               )}
//                             </div>
//                           ) : (
//                             <p className="text-sm font-semibold text-[#4f7c82]">Free</p>
//                           )}
//                         </div>

//                         {/* Buy Now Button or Access Status */}
//                         {!hasAccess && playlist.price > 0 && (
//                           <Button
//                             onClick={(e) => handleBuyNow(e, playlist)}
//                             className="w-full bg-[#4f7c82] text-white hover:bg-[#3d6166] mt-2"
//                           >
//                             {isExpired ? "Buy Again" : "Buy Now"}
//                           </Button>
//                         )}

//                         {hasAccess && (
//                           <p className="text-xs text-gray-500 mt-1">
//                             {new Date(playlist.createdAt).toLocaleDateString()}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "purchases" && (
//           <div>
//             <h2 className="text-2xl font-semibold text-black mb-6">
//               My Purchases
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) => playlist.purchase && playlist.purchase.hasAccess)
//                   .map((playlist) => {
//                     const hasAccess = playlist.purchase && playlist.purchase.hasAccess;
//                     return (
//                       <div
//                         key={playlist._id}
//                         className="cursor-pointer group bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#4f7c82]/50 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden"
//                         onClick={() => handlePlaylistClick(playlist)}
//                       >
//                         {/* Hover effect background */}
//                         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                         {/* Thumbnail Area */}
//                         <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                           <div className="absolute inset-0 flex items-center justify-center">
//                             <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                               <path d="M8 5v14l11-7z" />
//                             </svg>
//                           </div>
//                           <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                             {playlist.content?.length || playlist.videos?.length || 0} items
//                           </div>
//                         </div>

//                         {/* Title and Info */}
//                         <div className="relative z-10 flex-1">
//                           <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-[#4f7c82] transition-colors">
//                             {playlist.title}
//                           </h3>
//                           <p className="text-sm text-gray-600 mb-1">
//                             {playlist.instructor?.name || "Unknown"}
//                           </p>
//                           <div className="mt-2">
//                             {playlist.purchase.status === "lifetime" ? (
//                               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
//                                 Lifetime Access
//                               </span>
//                             ) : (
//                               <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
//                                 Expires: {playlist.purchase.expiresAt ? new Date(playlist.purchase.expiresAt).toLocaleDateString() : 'N/A'}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">
//                   You haven't purchased any playlists yet. Visit "Available Playlists" to purchase.
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "completed" && (
//           <div>
//             <h2 className="text-2xl font-semibold text-black mb-6">
//               Completed Playlists
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) =>
//                     playlist.purchase &&
//                     playlist.purchase.hasAccess &&
//                     playlist.purchase.quizPassed === true
//                   )
//                   .map((playlist) => (
//                     <div
//                       key={playlist._id}
//                       className="cursor-pointer group bg-white border-2 border-green-200 rounded-xl p-4 hover:border-green-400 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden"
//                       onClick={() => handlePlaylistClick(playlist)}
//                     >
//                       {/* Hover effect background */}
//                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                       {/* Thumbnail Area */}
//                       <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                         <div className="absolute inset-0 flex items-center justify-center">
//                           <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M8 5v14l11-7z" />
//                           </svg>
//                         </div>
//                         <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                           {playlist.content?.length || playlist.videos?.length || 0} items
//                         </div>
//                       </div>

//                       {/* Title and Info */}
//                       <div className="relative z-10 flex-1">
//                         <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
//                           {playlist.title}
//                         </h3>
//                         <p className="text-sm text-gray-600 mb-1">
//                           {playlist.instructor?.name || "Unknown"}
//                         </p>
//                         <div className="mt-2 space-y-1">
//                           <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
//                             Purchase Completed
//                           </span>
//                           {playlist.progress && (
//                             <p className="text-xs text-gray-600 mt-1">
//                               Progress: {Math.round(playlist.progress.overallProgress || 0)}%
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 {studentPlaylists.filter((playlist) =>
//                   playlist.purchase &&
//                   playlist.purchase.hasAccess &&
//                   playlist.purchase.quizPassed === true
//                 ).length === 0 && (
//                     <div className="col-span-full text-center py-8">
//                       <p className="text-black/70">
//                         No completed playlists yet. Pass the quiz to complete a playlist.
//                       </p>
//                     </div>
//                   )}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">No playlists available.</p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "pending" && (
//           <div>
//             <h2 className="text-2xl font-semibold text-black mb-6">
//               Pending Playlists
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) =>
//                     playlist.purchase &&
//                     playlist.purchase.hasAccess &&
//                     playlist.purchase.quizPassed !== true
//                   )
//                   .map((playlist) => {
//                     const attemptsUsed = playlist.purchase.quizAttempts || 0;
//                     const attemptsRemaining = 3 - attemptsUsed;
//                     return (
//                       <div
//                         key={playlist._id}
//                         className="cursor-pointer group bg-white border-2 border-orange-200 rounded-xl p-4 hover:border-orange-400 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden"
//                         onClick={() => handlePlaylistClick(playlist)}
//                       >
//                         {/* Hover effect background */}
//                         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                         {/* Thumbnail Area */}
//                         <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
//                           <div className="absolute inset-0 flex items-center justify-center">
//                             <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
//                               <path d="M8 5v14l11-7z" />
//                             </svg>
//                           </div>
//                           <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
//                             {playlist.content?.length || playlist.videos?.length || 0} items
//                           </div>
//                         </div>

//                         {/* Title and Info */}
//                         <div className="relative z-10 flex-1">
//                           <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
//                             {playlist.title}
//                           </h3>
//                           <p className="text-sm text-gray-600 mb-1">
//                             {playlist.instructor?.name || "Unknown"}
//                           </p>
//                           <div className="mt-2 space-y-1">
//                             <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
//                               Purchase Pending
//                             </span>
//                             {attemptsUsed > 0 && (
//                               <span className={`text-xs block mt-1 px-2 py-1 rounded font-medium ${attemptsRemaining === 0
//                                 ? "bg-red-100 text-gray-700"
//                                 : "bg-yellow-100 text-gray-700"
//                                 }`}>
//                                 {attemptsRemaining === 0
//                                   ? "⚠ All attempts used"
//                                   : `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining`
//                                 }
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 {studentPlaylists.filter((playlist) =>
//                   playlist.purchase &&
//                   playlist.purchase.hasAccess &&
//                   playlist.purchase.quizPassed !== true
//                 ).length === 0 && (
//                     <div className="col-span-full text-center py-8">
//                       <p className="text-black/70">
//                         No pending playlists. All purchased playlists are completed!
//                       </p>
//                     </div>
//                   )}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">No playlists available.</p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "progress" && (
//           <div>
//             <h2 className="text-2xl font-semibold text-black mb-6">
//               My Progress
//             </h2>
//             {studentPlaylists && studentPlaylists.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {studentPlaylists
//                   .filter((playlist) => playlist.purchase && playlist.purchase.hasAccess)
//                   .map((playlist) => {
//                     const progress = playlist.progress?.overallProgress || 0;
//                     const radius = 50;
//                     const circumference = 2 * Math.PI * radius;
//                     const offset = circumference - (progress / 100) * circumference;

//                     return (
//                       <div
//                         key={playlist._id}
//                         className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
//                         onClick={() => handlePlaylistClick(playlist)}
//                       >
//                         {/* Title */}
//                         <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 text-center min-h-[3rem]">
//                           {playlist.title}
//                         </h3>

//                         {/* Circular Progress Indicator */}
//                         <div className="flex justify-center items-center mb-4 relative mx-auto" style={{ width: '128px', height: '128px' }}>
//                           <svg className="transform -rotate-90 w-32 h-32 absolute inset-0">
//                             {/* Background circle */}
//                             <circle
//                               cx="64"
//                               cy="64"
//                               r={radius}
//                               stroke="#e5e7eb"
//                               strokeWidth="12"
//                               fill="none"
//                             />
//                             {/* Progress circle */}
//                             <circle
//                               cx="64"
//                               cy="64"
//                               r={radius}
//                               stroke="#4f7c82"
//                               strokeWidth="12"
//                               fill="none"
//                               strokeLinecap="round"
//                               strokeDasharray={circumference}
//                               strokeDashoffset={offset}
//                               className="transition-all duration-300"
//                             />
//                           </svg>
//                           {/* Center text */}
//                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//                             <span className="text-2xl font-bold text-gray-900">
//                               {Math.round(progress)}
//                             </span>
//                             <span className="text-xs text-gray-500 mt-0.5">%</span>
//                           </div>
//                         </div>

//                         {/* Progress Text */}
//                         <div className="text-center mb-4">
//                           <p className="text-sm font-medium text-gray-700">
//                             {Math.round(progress)}% Complete
//                           </p>
//                           {playlist.purchase.quizPassed ? (
//                             <p className="text-xs text-[#4f7c82]font-medium mt-1">
//                               ✓ Quiz Passed
//                             </p>
//                           ) : (
//                             <p className="text-xs text-[#4f7c82] font-medium mt-1">
//                               Quiz Pending
//                             </p>
//                           )}
//                         </div>

//                         {/* Continue Button */}
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handlePlaylistClick(playlist);
//                           }}
//                           className="w-full text-[#4f7c82] hover:bg-[#4f7c82] hover:text-white border border-[#4f7c82] rounded-lg py-2 px-4 transition-colors font-medium"
//                         >
//                           {progress === 100 ? "Review" : "Continue Learning →"}
//                         </button>
//                       </div>
//                     );
//                   })}
//                 {studentPlaylists.filter((playlist) => playlist.purchase && playlist.purchase.hasAccess).length === 0 && (
//                   <div className="col-span-full text-center py-8">
//                     <p className="text-black/70">
//                       You haven't purchased any playlists yet. Purchase playlists to track your progress!
//                     </p>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-black/70">No progress to show yet.</p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "messages" && <StudentMessages />}
//       </div>

//       {/* Video Player Modal */}
//       <VideoPlayer
//         playlist={selectedPlaylist}
//         open={isPlayerOpen}
//         onClose={handleClosePlayer}
//       />

//       {/* Payment Modal */}
//       {purchasePlaylist && (
//         <PaymentModal
//           open={showPaymentModal}
//           onClose={() => {
//             setShowPaymentModal(false);
//             setPurchasePlaylist(null);
//           }}
//           playlist={purchasePlaylist}
//           onSuccess={handlePurchaseSuccess}
//         />
//       )}

//       {/* Click outside to close dropdown */}
//       {showProfileDropdown && (
//         <div
//           className="fixed inset-0 z-40"
//           onClick={(e) => {
//             e.stopPropagation();
//             setShowProfileDropdown(false);
//           }}
//         />
//       )}
//     </div>
//   );
// }

// export default memo(StudentDashboard);

