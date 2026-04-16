"use client";

import { useEffect, useState, useCallback, memo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "@/store/auth_temp.js";
import { fetchPlaylists } from "@/store/playlist";
import { Button } from "@/components/Button";
import PlaylistDrawer from "@/components/playlist";
import Calendar from "@/components/Calendar";
import LineGraph from "@/components/LineGraph";


import MyCourses from "./mycourse";
import DirectMessages from "./dm";
import Balance from "./balance";
import AdminReplies from "./replies";
import InstructorCV from "./cv/page";
import Submissions from "./submissions";
import InstructorSettings from "./settings";
import Sidebar from "@/components/leftmenu";


function InstructorDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { playlists } = useSelector((state) => state.playlist);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mounted, setMounted] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const fileInputRef = useRef(null);
  const [cvData, setCvData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [watchStats, setWatchStats] = useState([]);
  const [loadingWatchStats, setLoadingWatchStats] = useState(true);
  const [graphTitle, setGraphTitle] = useState("");
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [navigatingToAddPlaylist, setNavigatingToAddPlaylist] = useState(false);

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
    const userId = user?.id || user?._id;
    if (userId && user?.role === "instructor") {
      dispatch(fetchPlaylists(userId));
    }
  }, [user?.id, user?._id, user?.role, dispatch]);


  useEffect(() => {
    const fetchCV = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        const response = await fetch(`/api/instructor/cv?instructorId=${userId}`);
        const data = await response.json();

        if (data.success && data.cv) {
          setCvData(data.cv);
        }
      } catch (err) {
        console.error("Error fetching CV:", err);
      }
    };

    if (user) {
      fetchCV();
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);


  useEffect(() => {
    if (playlists && playlists.length > 0) {
      const total = playlists.length;
      const pending = playlists.filter((p) => p.status === "pending").length;
      const approved = playlists.filter((p) => p.status === "approved").length;
      const rejected = playlists.filter((p) => p.status === "rejected").length;

      setStats({
        total,
        pending,
        approved,
        rejected,
      });
    } else {
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      });
    }
  }, [playlists]);


  useEffect(() => {
    const fetchWatchStats = async () => {
      const userId = user?.id || user?._id;
      if (userId && user?.role === "instructor") {
        try {
          setLoadingWatchStats(true);
          const response = await fetch(`/api/instructor/watch-stats?instructorId=${userId}&monthOffset=${currentMonthOffset}`);
          const data = await response.json();
          if (data.success) {
            setWatchStats(data.data);

            if (data.monthName) {
              setGraphTitle(data.monthName);
            }
          }
        } catch (error) {
          console.error("Error fetching watch stats:", error);
        } finally {
          setLoadingWatchStats(false);
        }
      }
    };

    fetchWatchStats();
  }, [user?.id, user?._id, user?.role, currentMonthOffset]);


  const handlePreviousMonth = () => {
    setCurrentMonthOffset(prev => prev - 1);
  };

  const handleNextMonth = () => {
    if (currentMonthOffset < 0) {
      setCurrentMonthOffset(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated || !user) {
        router.push("/login");
      } else if (user?.role !== "instructor") {
        if (user?.role === "admin") router.push("/dashboard/admin");
        else if (user?.role === "student") router.push("/dashboard/student");
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    router.replace("/login");
  }, [dispatch, router]);

  const handleProfilePictureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleProfilePictureChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only image files (JPEG, PNG, GIF, WebP) are allowed");
      return;
    }


    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

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
      } else {
        alert(data.message || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture");
    } finally {
      setUploadingProfilePicture(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [user]);

  if (!mounted || !isAuthenticated || !user || user?.role !== "instructor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const menuItems = [
    {
      id: "dashboard", label: "Dashboard", icon: <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M15 18H9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    },
    {
      id: "courses", label: "My Courses", icon: <svg
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
      </svg>
    },
    {
      id: "submissions", label: "Submissions", icon: <svg
        className="w-5 h-5"
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M30.156 26.492l-6.211-23.184c-0.327-1.183-1.393-2.037-2.659-2.037-0.252 0-0.495 0.034-0.727 0.097l0.019-0.004-2.897 0.776c-0.325 0.094-0.609 0.236-0.86 0.42l0.008-0.005c-0.49-0.787-1.349-1.303-2.33-1.306h-2.998c-0.789 0.001-1.5 0.337-1.998 0.873l-0.002 0.002c-0.5-0.537-1.211-0.873-2-0.874h-3c-1.518 0.002-2.748 1.232-2.75 2.75v24c0.002 1.518 1.232 2.748 2.75 2.75h3c0.789-0.002 1.5-0.337 1.998-0.873l0.002-0.002c0.5 0.538 1.211 0.873 2 0.875h2.998c1.518-0.002 2.748-1.232 2.75-2.75v-16.848l4.699 17.54c0.327 1.182 1.392 2.035 2.656 2.037h0c0.001 0 0.003 0 0.005 0 0.251 0 0.494-0.034 0.725-0.098l-0.019 0.005 2.898-0.775c1.182-0.326 2.036-1.392 2.036-2.657 0-0.252-0.034-0.497-0.098-0.729l0.005 0.019zM18.415 9.708l5.31-1.423 3.753 14.007-5.311 1.422zM18.068 3.59l2.896-0.776c0.097-0.027 0.209-0.043 0.325-0.043 0.575 0 1.059 0.389 1.204 0.918l0.002 0.009 0.841 3.139-5.311 1.423-0.778-2.905v-1.055c0.153-0.347 0.449-0.607 0.812-0.708l0.009-0.002zM11.5 2.75h2.998c0.69 0.001 1.249 0.56 1.25 1.25v3.249l-5.498 0.001v-3.25c0.001-0.69 0.56-1.249 1.25-1.25h0zM8.75 23.25h-5.5v-14.5l5.5-0.001zM10.25 8.75l5.498-0.001v14.501h-5.498zM4.5 2.75h3c0.69 0.001 1.249 0.56 1.25 1.25v3.249l-5.5 0.001v-3.25c0.001-0.69 0.56-1.249 1.25-1.25h0zM7.5 29.25h-3c-0.69-0.001-1.249-0.56-1.25-1.25v-3.25h5.5v3.25c-0.001 0.69-0.56 1.249-1.25 1.25h-0zM14.498 29.25h-2.998c-0.69-0.001-1.249-0.56-1.25-1.25v-3.25h5.498v3.25c-0.001 0.69-0.56 1.249-1.25 1.25h-0zM28.58 27.826c-0.164 0.285-0.43 0.495-0.747 0.582l-0.009 0.002-2.898 0.775c-0.096 0.026-0.206 0.041-0.319 0.041-0.575 0-1.060-0.387-1.208-0.915l-0.002-0.009-0.841-3.14 5.311-1.422 0.841 3.14c0.027 0.096 0.042 0.207 0.042 0.321 0 0.23-0.063 0.446-0.173 0.63l0.003-0.006z" />
      </svg>
    },
    {
      id: "messages", label: " Messages", icon: <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21.0039 12C21.0039 16.9706 16.9745 21 12.0039 21C9.9675 21 3.00463 21 3.00463 21C3.00463 21 4.56382 17.2561 3.93982 16.0008C3.34076 14.7956 3.00391 13.4372 3.00391 12C3.00391 7.02944 7.03334 3 12.0039 3C16.9745 3 21.0039 7.02944 21.0039 12Z" />
      </svg>
    },
    {
      id: "admin-replies", label: "Admin Reply", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10" />
        <path d="M15 3h6v6" />
        <path d="M10 14L21 3" />
      </svg>
    },
    {
      id: "balance", label: "Balance", icon: <svg
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
      </svg>
    },
    { id: "cv", label: "My CV", icon: "📄" },
    {
      id: "settings", label: "Settings", icon: <svg viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
        <path d="M600.704 64a32 32 0 0 1 30.464 22.208l35.2 109.376c14.784 7.232 28.928 15.36 42.432 24.512l112.384-24.192a32 32 0 0 1 34.432 15.36L944.32 364.8a32 32 0 0 1-4.032 37.504l-77.12 85.12a357.12 357.12 0 0 1 0 49.024l77.12 85.248a32 32 0 0 1 4.032 37.504l-88.704 153.6a32 32 0 0 1-34.432 15.296L708.8 803.904c-13.44 9.088-27.648 17.28-42.368 24.512l-35.264 109.376A32 32 0 0 1 600.704 960H423.296a32 32 0 0 1-30.464-22.208L357.696 828.48a351.616 351.616 0 0 1-42.56-24.64l-112.32 24.256a32 32 0 0 1-34.432-15.36L79.68 659.2a32 32 0 0 1 4.032-37.504l77.12-85.248a357.12 357.12 0 0 1 0-48.896l-77.12-85.248A32 32 0 0 1 79.68 364.8l88.704-153.6a32 32 0 0 1 34.432-15.296l112.32 24.256c13.568-9.152 27.776-17.408 42.56-24.64l35.2-109.312A32 32 0 0 1 423.232 64H600.64zm-23.424 64H446.72l-36.352 113.088-24.512 11.968a294.113 294.113 0 0 0-34.816 20.096l-22.656 15.36-116.224-25.088-65.28 113.152 79.68 88.192-1.92 27.136a293.12 293.12 0 0 0 0 40.192l1.92 27.136-79.808 88.192 65.344 113.152 116.224-25.024 22.656 15.296a294.113 294.113 0 0 0 34.816 20.096l24.512 11.968L446.72 896h130.688l36.48-113.152 24.448-11.904a288.282 288.282 0 0 0 34.752-20.096l22.592-15.296 116.288 25.024 65.28-113.152-79.744-88.192 1.92-27.136a293.12 293.12 0 0 0 0-40.256l-1.92-27.136 79.808-88.128-65.344-113.152-116.288 24.96-22.592-15.232a287.616 287.616 0 0 0-34.752-20.096l-24.448-11.904L577.344 128zM512 320a192 192 0 1 1 0 384 192 192 0 0 1 0-384zm0 64a128 128 0 1 0 0 256 128 128 0 0 0 0-256z" />
      </svg>
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex">
        <div className="w-full max-w-[1920px] 2xl:max-w-none mx-auto flex">

      <div className={`sm:hidden flex items-center justify-between px-4 py-3 border-b shadow-lg bg-white fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''}`}>
        <h1 className="text-lg font-bold">Instructor Panel</h1>
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
min-h-screen bg-white shadow-lg flex flex-col
transition-all duration-300 ease-in-out

/* Desktop width */
${isSidebarCollapsed ? "lg:w-16" : "lg:w-56 "}

/* Mobile width */
${isSidebarOpen ? "w-56 2xl:w-70" : "w-0"}

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



        <div className=" pl-4 pt-4 pb-4 border-b flex flex-col">
          <div className="justify-between items-center mb-4">
            <div className="flex items-center justify-between w-full">
              <h1 className={`${isSidebarCollapsed ? "hidden" : "block"} text-2xl font-semibold tracking-tighter text-black`}>
                Instructor Panel
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
          </div>
          <div
            className={`relative w-full ${isSidebarCollapsed ? "flex justify-center" : ""}`}>
            <div
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`flex items-center cursor-pointer hover:bg-gray-50 rounded-lg transition-colors
      ${isSidebarCollapsed ? "justify-center w-full" : "gap-3 w-full px-3"}
    `} >

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleProfilePictureClick();
                }}
                className="w-10 h-10 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 cursor-pointer  transition-colors relative overflow-hidden flex-shrink-0"
                title="Click to upload profile picture"
              >
                {user?.profilePicture || cvData?.profileImage ? (
                  <img
                    src={user?.profilePicture || cvData?.profileImage}
                    alt={user?.name || user?.email || "Instructor"}
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user?.name || user?.username || user?.email || "Instructor"}
                  </p>
                  <p className="text-xs text-gray-500">Welcome</p>
                </div>
              )}
              {/* 
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${showProfileDropdown ? "rotate-180" : ""
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg> */}
            </div>


            {/* {showProfileDropdown && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfilePictureClick();
                    }}
                    className="w-16 h-16 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 mx-auto mb-2 cursor-pointer hover:border-[#4f7c82]/40 transition-colors relative overflow-hidden"
                    title="Click to upload profile picture"
                  >
                    {user?.profilePicture || cvData?.profileImage ? (
                      <img
                        src={user?.profilePicture || cvData?.profileImage}
                        alt={user?.name || user?.email || "Instructor"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8"
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
                  <p className="text-center font-semibold text-gray-800">
                    {user?.name || user?.username || user?.email || "Instructor"}
                  </p>
                  <p className="text-center text-sm text-gray-500">Instructor</p>
                </div>
              </div>
            )} */}
          </div>
        </div>


        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3">
            {!isSidebarCollapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                Main
              </p>
            )}
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"
                  } px-3 py-2.5 rounded-lg mb-1 transition-colors ${activeTab === item.id
                    ? "bg-[#4f7c82] text-white"
                    : "text-black hover:bg-black/5"
                  }`}

              >
                <span className="">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="font-medium tracking-tight whitespace-nowrap">{item.label}</span>
                )}
                {item.id === "messages" && unreadMessageCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
                    {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  </span>
                )}
                {activeTab === item.id && (
                  <div className="ml-auto w-1 h-6 bg-white rounded"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t mt-auto flex-shrink-0 flex justify-center">
          <button
            onClick={handleLogout}
            className={`
      flex items-center justify-center
      ${isSidebarCollapsed ? "w-10 h-10" : "w-full px-3 py-2.5 gap-3"}
      rounded-lg transition-colors
      bg-[#4f7c82] text-white hover:bg-[#42686d]
    `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>

            {!isSidebarCollapsed && (
              <span className="font-medium tracking-tight">Logout</span>
            )}
          </button>
        </div>

      </div>


      <div className={`flex-1 p-4 pt-20 lg:p-8 lg:pt-8 transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''}`}>
        <div className="max-w-7xl 2xl:max-w-none mx-auto">

        {activeTab === "dashboard" && (
          <div className="grid tracking-tight grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Total Playlists
              </h2>
              <p className="text-3xl font-bold text-[#4f7c82]">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">All playlists</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Pending Playlists
              </h2>
              <p className="text-3xl font-bold text-[#4f7c82]">{stats.pending}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Approved Playlists
              </h2>
              <p className="text-3xl font-bold text-[#4f7c82]">{stats.approved}</p>
              <p className="text-sm text-gray-500 mt-1">Approved by admin</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
               Playlists
              </h2>
              <p className="text-3xl font-bold text-[#4f7c82]">{stats.rejected}</p>
              <p className="text-sm text-gray-500 mt-1">Rejected by admin</p>
            </div>
          </div>
        )}


        {activeTab === "dashboard" && (
          <div className="space-y-6 w-full">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="relative">
                <button
                  onClick={handlePreviousMonth}
                  disabled={loadingWatchStats}
                  className="absolute left-0 top-0 z-10 p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleNextMonth}
                  disabled={loadingWatchStats || currentMonthOffset === 0}
                  className="absolute right-0 top-0 z-10 p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {graphTitle}
                  </h2>
                </div>

                {loadingWatchStats ? (
                  <div className="flex items-center justify-center h-60">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
                  </div>
                ) : (
                  <div className="w-full">
                    <LineGraph
                      data={watchStats}
                      color="#4f7c82"
                    />
                  </div>
                )}
              </div>
            </div>

            <Calendar />
          </div>
        )}
        {activeTab === "courses" && (
          <>
            <MyCourses 
              onAddPlaylist={() => {
                setNavigatingToAddPlaylist(true);
                router.push("/dashboard/instructor/add-playlist");
              }}
              navigatingToAddPlaylist={navigatingToAddPlaylist}
            />
          </>
        )}
        {activeTab === "submissions" && <Submissions />}
        {activeTab === "messages" && <DirectMessages onUnreadCountChange={setUnreadMessageCount} />}
        {activeTab === "balance" && <Balance />}
        {activeTab === "admin-replies" && <AdminReplies />}
        {activeTab === "cv" && <InstructorCV />}
        {activeTab === "settings" && <InstructorSettings />}
        </div>
      </div>

      {showProfileDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setShowProfileDropdown(false);
          }}
        />
      )}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

        </div>
      </div>
    </div>
  );
}

export default memo(InstructorDashboard);
