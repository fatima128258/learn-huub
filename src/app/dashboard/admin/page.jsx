"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/auth_temp.js";
import { Button } from "@/components/Button";
import AdminPlaylists from "./playlists";
import AdminSettings from "./settings";
import AdminBalance from "./balance";
import Calendar from "@/components/Calendar";
import LineGraph from "@/components/LineGraph";
import EmailModal from "@/components/emailmodal";
import AlertModal from "@/components/AlertModal";
import { useAlert } from "@/components/usealert";
import Sidebar from "@/components/leftmenu";

function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { alertState, hideAlert, showSuccess, showError } = useAlert();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    instructors: 0,
    students: 0,
    admins: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [playlistStats, setPlaylistStats] = useState([]);
  const [loadingPlaylistStats, setLoadingPlaylistStats] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthName, setMonthName] = useState("");
  const [totalPlaylists, setTotalPlaylists] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [balanceThreads, setBalanceThreads] = useState([]);
  const [loadingBalanceThreads, setLoadingBalanceThreads] = useState(false);
  const [bcDrawer, setBcDrawer] = useState({ open: false, purchaseId: null, messages: [], loading: false });
  const [bcReply, setBcReply] = useState("");

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
    fetch("/api/contact")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessages(data.data);
        }
      });
  }, []);


  useEffect(() => {
    const fetchStats = async () => {
      const userId = user?.id || user?._id;
      if (mounted && user && userId) {
        try {
          setLoadingStats(true);
          const response = await fetch(`/api/admin/stats?adminId=${userId}`);
          const data = await response.json();
          if (data.success) {
            setStats(data.stats);
          }
        } catch (error) {
          console.error("Error fetching stats:", error);
        } finally {
          setLoadingStats(false);
        }
      }
    };

    fetchStats();
  }, [mounted, user]);

  useEffect(() => {
    const fetchPlaylistStats = async () => {
      const userId = user?.id || user?._id;
      if (mounted && user && userId) {
        try {
          setLoadingPlaylistStats(true);
          const response = await fetch(
            `/api/admin/playlist-stats?adminId=${userId}&year=${currentYear}&month=${currentMonth}`
          );
          const data = await response.json();
          if (data.success) {
            setPlaylistStats(data.data);
            setMonthName(data.monthName);
            setTotalPlaylists(data.totalPlaylists || 0);
          }
        } catch (error) {
          console.error("Error fetching playlist stats:", error);
        } finally {
          setLoadingPlaylistStats(false);
        }
      }
    };

    fetchPlaylistStats();
  }, [mounted, user, currentMonth, currentYear]);

  useEffect(() => {
    const fetchUsers = async () => {
      const userId = user?.id || user?._id;
      if (mounted && user && userId && activeTab === "users") {
        try {
          setLoadingUsers(true);
          const response = await fetch(`/api/admin/users?adminId=${userId}`);
          const data = await response.json();
          if (data.success) {
            setUsersList(data.users || []);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        } finally {
          setLoadingUsers(false);
        }
      }
    };
    fetchUsers();
  }, [mounted, user, activeTab]);

  useEffect(() => {
    const fetchBalanceComments = async () => {
      const userId = user?.id || user?._id;
      if (mounted && user && userId && activeTab === "balance-comments") {
        try {
          setLoadingBalanceThreads(true);
          const res = await fetch(`/api/admin/balance-comments?adminId=${userId}`);
          const data = await res.json();
          if (data.success) {
            setBalanceThreads(data.threads || []);
          }
        } catch (e) {
          console.error("Error fetching balance comments:", e);
        } finally {
          setLoadingBalanceThreads(false);
        }
      }
    };
    fetchBalanceComments();
  }, [mounted, user, activeTab]);

  const openBalanceThread = async (purchaseId) => {
    const userId = user?.id || user?._id;
    if (!userId || !purchaseId) return;
    try {
      setBcDrawer({ open: true, purchaseId, loading: true, messages: [] });
      const res = await fetch(`/api/admin/balance-comments?adminId=${userId}&purchaseId=${purchaseId}`);
      const data = await res.json();
      if (data.success && data.thread) {
        setBcDrawer({ open: true, purchaseId, loading: false, messages: data.thread.messages || [] });
      } else {
        setBcDrawer({ open: true, purchaseId, loading: false, messages: [] });
      }
    } catch (e) {
      console.error("Open balance thread error:", e);
      setBcDrawer({ open: true, purchaseId, loading: false, messages: [] });
    }
  };

  const sendBalanceReply = async () => {
    const userId = user?.id || user?._id;
    if (!userId || !bcDrawer.purchaseId || !bcReply.trim()) return;
    try {
      const res = await fetch("/api/admin/balance-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: userId, purchaseId: bcDrawer.purchaseId, text: bcReply.trim() }),
      });
      const data = await res.json();
      if (data.success && data.thread) {
        setBcDrawer((s) => ({ ...s, messages: data.thread.messages || [] }));
        setBcReply("");
      } else if (!data.success && data.message) {
        alert(data.message);
      }
    } catch (e) {
      console.error("Send balance reply error:", e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);


  const openEmailModal = (message) => {
    setSelectedMessage(message);
    setEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    setSelectedMessage(null);
  };

  const handleSendEmail = async (to, subject, text) => {
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, text, adminEmail: user?.email }),
      });

      const data = await res.json();

      if (data.success) {
        // Mark the contact message as replied using the selectedMessage
        if (selectedMessage && selectedMessage._id) {
          const updateRes = await fetch(`/api/contact/${selectedMessage._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ replied: true }),
          });

          if (updateRes.ok) {
            // Update local state
            setMessages(prev => prev.map(msg =>
              msg._id === selectedMessage._id ? { ...msg, replied: true } : msg
            ));
          }
        }

        closeEmailModal();
      } else {
        alert(data.message || "Failed to send email.");
      }
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send email. Check server logs.");
    }
  };


  const filteredMessages = messages.filter((msg) => {
    if (!searchTerm) return true;

    const emailMatch = msg.email.toLowerCase().includes(searchTerm.toLowerCase());
    const dateString = new Date(msg.createdAt).toLocaleString().toLowerCase();
    const dateMatch = dateString.includes(searchTerm.toLowerCase());

    return emailMatch || dateMatch;
  });

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated || !user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        if (user.role === "student") {
          router.push("/dashboard/student");
        } else if (user.role === "instructor") {
          router.push("/dashboard/instructor");
        }
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    router.push("/login");
  }, [dispatch, router]);

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();

    if (isCurrentMonth) return;

    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const handleDeleteMessage = async (id) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };


  if (!mounted || !isAuthenticated || !user || user.role !== "admin") {
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
      id: "users", label: "Users", icon: <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 20v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    },
    {
      id: "all-playlists", label: "All Playlists", icon: <svg
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
      </svg>
    },
    {
      id: "pending-playlists", label: "Pending Playlists", icon: <svg
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
      </svg>
    },
    {
      id: "approved-playlists", label: "Approved Playlists", icon: <svg
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
      </svg>
    },
    {
      id: "balance-comments", label: "Balance Comment", icon: <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-5 h-5"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10" />
        <path d="M15 3h6v6" />
        <path d="M10 14L21 3" />
      </svg>
    },
    {
      id: "messages", label: "Messages", icon: <svg
        viewBox="0 0 512 512"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
      >
        <path
          d="M510.678 112.275c-2.308-11.626-7.463-22.265-14.662-31.054-1.518-1.915-3.104-3.63-4.823-5.345-12.755-12.818-30.657-20.814-50.214-20.814H71.021c-19.557 0-37.395 7.996-50.21 20.814-1.715 1.715-3.301 3.43-4.823 5.345C8.785 90.009 3.63 100.649 1.386 112.275.464 116.762 0 121.399 0 126.087V385.92c0 9.968 2.114 19.55 5.884 28.203 3.497 8.26 8.653 15.734 14.926 22.001 1.59 1.586 3.169 3.044 4.892 4.494 12.286 10.175 28.145 16.32 45.319 16.32h369.958c17.18 0 33.108-6.145 45.323-16.384 1.718-1.386 3.305-2.844 4.891-4.43 6.27-6.267 11.425-13.741 14.994-22.001v-.064c3.769-8.653 5.812-18.171 5.812-28.138V126.087c0-4.688-.457-9.325-1.322-13.812zM46.509 101.571c6.345-6.338 14.866-10.175 24.512-10.175h369.958c9.646 0 18.242 3.837 24.512 10.175 1.122 1.129 2.179 2.387 3.112 3.637L274.696 274.203c-5.348 4.687-11.954 7.002-18.696 7.002-6.674 0-13.276-2.315-18.695-7.002L43.472 105.136c.858-1.25 1.915-2.436 3.037-3.565zM36.334 385.92V142.735L176.658 265.15 36.405 387.435c0-.464 0-.986-.071-1.515zM440.979 420.597H71.021c-6.281 0-12.158-1.651-17.174-4.552l147.978-128.959 13.815 12.018c11.561 10.046 26.028 15.134 40.36 15.134 14.406 0 28.872-5.088 40.432-15.134l13.808-12.018 147.92 128.959c-5.016 2.901-10.893 4.552-17.174 4.552zM475.666 385.92c0 .529 0 1.051-.068 1.515L335.346 265.221 475.666 142.8v243.12z"
          fill="currentColor"
        />
      </svg>
    },
    {
      id: "rejected-playlists", label: "Rejected Playlists", icon: <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
      >

        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />


        <line
          x1="11"
          y1="11"
          x2="21"
          y2="21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="21"
          y1="11"
          x2="11"
          y2="21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
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
    {
      id: "settings", label: "Settings", icon: <svg viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
        <path d="M600.704 64a32 32 0 0 1 30.464 22.208l35.2 109.376c14.784 7.232 28.928 15.36 42.432 24.512l112.384-24.192a32 32 0 0 1 34.432 15.36L944.32 364.8a32 32 0 0 1-4.032 37.504l-77.12 85.12a357.12 357.12 0 0 1 0 49.024l77.12 85.248a32 32 0 0 1 4.032 37.504l-88.704 153.6a32 32 0 0 1-34.432 15.296L708.8 803.904c-13.44 9.088-27.648 17.28-42.368 24.512l-35.264 109.376A32 32 0 0 1 600.704 960H423.296a32 32 0 0 1-30.464-22.208L357.696 828.48a351.616 351.616 0 0 1-42.56-24.64l-112.32 24.256a32 32 0 0 1-34.432-15.36L79.68 659.2a32 32 0 0 1 4.032-37.504l77.12-85.248a357.12 357.12 0 0 1 0-48.896l-77.12-85.248A32 32 0 0 1 79.68 364.8l88.704-153.6a32 32 0 0 1 34.432-15.296l112.32 24.256c13.568-9.152 27.776-17.408 42.56-24.64l35.2-109.312A32 32 0 0 1 423.232 64H600.64zm-23.424 64H446.72l-36.352 113.088-24.512 11.968a294.113 294.113 0 0 0-34.816 20.096l-22.656 15.36-116.224-25.088-65.28 113.152 79.68 88.192-1.92 27.136a293.12 293.12 0 0 0 0 40.192l1.92 27.136-79.808 88.192 65.344 113.152 116.224-25.024 22.656 15.296a294.113 294.113 0 0 0 34.816 20.096l24.512 11.968L446.72 896h130.688l36.48-113.152 24.448-11.904a288.282 288.282 0 0 0 34.752-20.096l22.592-15.296 116.288 25.024 65.28-113.152-79.744-88.192 1.92-27.136a293.12 293.12 0 0 0 0-40.256l-1.92-27.136 79.808-88.128-65.344-113.152-116.288 24.96-22.592-15.232a287.616 287.616 0 0 0-34.752-20.096l-24.448-11.904L577.344 128zM512 320a192 192 0 1 1 0 384 192 192 0 0 1 0-384zm0 64a128 128 0 1 0 0 256 128 128 0 0 0 0-256z" />
      </svg>
    },
  ];

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden relative">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full max-w-[1920px] 2xl:max-w-[2560px] mx-auto flex">

          {/* Mobile Header */}
          <div className={`xl:hidden fixed top-0 left-0 right-0 h-14 bg-white flex items-center justify-between px-4 border-b shadow-sm z-30 transition-all duration-300 ${sidebarOpen ? 'blur-sm' : ''}`}>
            <h2 className="text-xs sm:text-sm font-semibold text-black">Admin Panel</h2>
            <button onClick={() => setSidebarOpen(true)} className="text-xl sm:text-2xl text-black" aria-label="Open menu">☰</button>
          </div>

          {/* Backdrop for mobile */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 xl:hidden" />
          )}

          {/* Sidebar Component */}
          <Sidebar
            title="Admin Panel"
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeTab={activeTab}
            setActiveTab={(tabId) => {
              setActiveTab(tabId);
              if (window.innerWidth < 1280) {
                setSidebarOpen(false);
              }
            }}
            menuItems={menuItems}
            user={{
              name: user.name,
              avatar: user.profilePicture
            }}
            handleLogout={handleLogout}
            unreadMessageCount={0}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl 2xl:max-w-none mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8 pt-20 xl:pt-8">

              {activeTab === "dashboard" && (
                <div className="grid pt-20 xl:pt-0 grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      Total Users
                    </h2>
                    {loadingStats ? (
                      <p className="text-3xl font-bold text-[#4f7c82]">...</p>
                    ) : (
                      <p className="text-3xl font-bold text-[#4f7c82]">{stats.totalUsers}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Instructors + Students</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      Instructors
                    </h2>
                    {loadingStats ? (
                      <p className="text-3xl font-bold text-[#4f7c82]">...</p>
                    ) : (
                      <p className="text-3xl font-bold text-[#4f7c82]">{stats.instructors}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Total instructors</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      Students
                    </h2>
                    {loadingStats ? (
                      <p className="text-3xl font-bold text-[#4f7c82]">...</p>
                    ) : (
                      <p className="text-3xl font-bold text-[#4f7c82]">{stats.students}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Total students</p>
                  </div>
                </div>
              )}

              {(activeTab === "all-playlists" ||
                activeTab === "pending-playlists" ||
                activeTab === "approved-playlists" ||
                activeTab === "rejected-playlists") && (
                  <AdminPlaylists
                    defaultFilter={
                      activeTab === "all-playlists" ? "all" :
                        activeTab === "pending-playlists" ? "pending" :
                          activeTab === "approved-playlists" ? "approved" :
                            "rejected"
                    }
                  />
                )}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                    <div className="relative">
                      <button
                        onClick={handlePreviousMonth}
                        disabled={loadingPlaylistStats}
                        className="absolute left-0 top-0 z-10 p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        onClick={handleNextMonth}
                        disabled={
                          loadingPlaylistStats ||
                          (currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear())
                        }
                        className="absolute right-0 top-0 z-10 p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <div className="text-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                          {monthName} {currentYear}
                        </h2>
                      </div>

                      {loadingPlaylistStats ? (
                        <div className="flex items-center justify-center h-60">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="w-full">
                            <LineGraph
                              data={playlistStats}
                              color="#4f7c82"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Calendar />
                </div>
              )}
              {activeTab === "balance" && <AdminBalance />}
              {activeTab === "settings" && <AdminSettings />}
              {activeTab === "messages" && (
                <>

                  <div className="mb-4 pt-20 xl:pt-0 flex justify-center">
                    <input
                      type="text"
                      placeholder="Search by email or date..."
                      className="w-full max-w-screen-lg px-6 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-transparent transition-all duration-200"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {filteredMessages.length === 0 ? (
                    <p className="text-gray-500">No messages found.</p>
                  ) : (
                    <>

                      <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Message
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Actions
                              </th>
                              <th className="px-6 py-3" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredMessages.map((msg) => (
                              <tr key={msg._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {msg.email}
                                    {/* {msg.replied && (
                                  <span className="px-2 py-0.5 bg-[#4f7c82] text-white text-xs rounded-lg font-medium">
                                    Sent
                                  </span>
                                )} */}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs break-words">
                                  {msg.message}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex gap-2 justify-center">
                                    {msg.replied ? (
                                      <span
                                        className="bg-gray-500 hover:bg-gray-700 text-white text-sm tracking-tight py-1 px-4 rounded-md transition-colors duration-200">
                                        Sent
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => openEmailModal(msg)}
                                        className="bg-[#4f7c82] hover:bg-[#3d7680] text-white text-sm tracking-tight py-1 px-4 rounded-md transition-colors duration-200"

                                      >
                                        Send email
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteMessage(msg._id)}
                                      className="bg-[#4f7c82] hover:bg-[#3d7680] text-white text-sm tracking-tight py-1 px-4 rounded-md transition-colors duration-200"
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

                      <div className="lg:hidden space-y-4">
                        {filteredMessages.map((msg) => (
                          <div key={msg._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                                  <p className="text-sm font-medium text-gray-900 break-all">{msg.email}</p>
                                </div>
                                {msg.replied && (
                                  <span className="px-2 py-1 text-white bg-[#4f7c82] text-xs rounded-full font-medium whitespace-nowrap">
                                    Sent
                                  </span>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Message</p>
                                <p className="text-sm text-gray-600 break-words">{msg.message}</p>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </p>
                              </div>


                              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                                {msg.replied ? (
                                  <span className="flex-1 inline-flex items-center justify-center px-2 py-2 bg-[#4f7c82] text-white text-sm rounded-md font-medium">
                                    Sent
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => openEmailModal(msg)}
                                    className="flex-1 bg-[#4f7c82] hover:bg-[#3f6468] text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                                  >
                                    Send email
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className="flex-1 bg-[#4f7c82] hover:bg-[#416d73] text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
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
                </>
              )}
              {activeTab === "balance-comments" && (
                <div className="space-y-6 pt-20 xl:pt-0">
                  <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Balance Comments</h2>
                    {loadingBalanceThreads ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
                      </div>
                    ) : balanceThreads.length === 0 ? (
                      <p className="text-gray-500">No instructor comments yet.</p>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Instructor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Playlist</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {balanceThreads.map((t) => {
                                const lastMsg = (t.messages && t.messages.length > 0) ? t.messages[t.messages.length - 1].text : "";
                                return (
                                  <tr key={t._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {t?.purchase?.playlist?.instructor?.name || "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                      {t?.purchase?.playlist?.title || "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(t.updatedAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                      <div className="flex items-center gap-2 justify-center">
                                        <button
                                          onClick={() => openBalanceThread(t.purchase?._id)}
                                          className="px-3 py-1.5 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] text-xs"
                                        >
                                          View & Reply
                                        </button>
                                        <button
                                          onClick={async () => {
                                            const userId = user?.id || user?._id;
                                            if (!userId) return;
                                            const res = await fetch(`/api/admin/balance-comments?adminId=${userId}&purchaseId=${t.purchase?._id}`, { method: "DELETE" });
                                            const data = await res.json();
                                            if (data.success) {
                                              setBalanceThreads(prev => prev.filter(x => x._id !== t._id));
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-[#4f7c82] text-white rounded hover:bg-[#3d6166] text-xs"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                          {balanceThreads.map((t) => (
                            <div key={t._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                              <div className="space-y-3">
                                {/* Instructor and Playlist - Inline Format */}
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <span className="text-xs font-semibold text-gray-500 uppercase w-20">INSTRUCTOR:</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">
                                      {t?.purchase?.playlist?.instructor?.name || "—"}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs font-semibold text-gray-500 uppercase w-20">PLAYLIST:</span>
                                    <span className="text-sm text-gray-700 flex-1">
                                      {t?.purchase?.playlist?.title || "—"}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs font-semibold text-gray-500 uppercase w-20">DATE:</span>
                                    <span className="text-xs text-gray-600 flex-1">
                                      {new Date(t.updatedAt).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                                  <button
                                    onClick={() => openBalanceThread(t.purchase?._id)}
                                    className="flex-1 bg-[#4f7c82] text-white hover:bg-[#3f6468] text-sm py-2 px-4 rounded-md transition-colors duration-200"
                                  >
                                    View & Reply
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const userId = user?.id || user?._id;
                                      if (!userId) return;
                                      const res = await fetch(`/api/admin/balance-comments?adminId=${userId}&purchaseId=${t.purchase?._id}`, { method: "DELETE" });
                                      const data = await res.json();
                                      if (data.success) {
                                        setBalanceThreads(prev => prev.filter(x => x._id !== t._id));
                                      }
                                    }}
                                    className="flex-1 bg-[#4f7c82] text-white hover:bg-[#3d6166] text-sm py-2 px-4 rounded-md transition-colors duration-200"
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
                  </div>

                  {bcDrawer.open && (
                    <div className="fixed inset-0 z-50">
                      <div className="absolute inset-0 bg-black/40" onClick={() => setBcDrawer({ open: false, purchaseId: null, messages: [], loading: false })} />
                      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Balance Comment Thread</h3>
                          <button
                            onClick={() => setBcDrawer({ open: false, purchaseId: null, messages: [], loading: false })}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                            aria-label="Close"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {bcDrawer.loading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
                            </div>
                          ) : bcDrawer.messages.length === 0 ? (
                            <p className="text-gray-500 text-sm">No message there.</p>
                          ) : (
                            bcDrawer.messages.map((m, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded border ${m.senderRole === "admin" ? "bg-[#f5fafa] border-[#d9e7e9] ml-8" : "bg-gray-50 border-gray-200 mr-8"}`}
                              >
                                <div className="text-xs text-gray-500 mb-1 capitalize font-semibold">{m.senderRole}</div>
                                <div className="text-sm text-gray-800">{m.text}</div>
                                <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-4 border-t">
                          {bcDrawer.messages.some(m => m.senderRole === "admin") ? (
                            <div className="text-center py-3">
                              <p className="text-sm text-gray-600 font-medium">You have already commented.</p>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                value={bcReply}
                                onChange={(e) => setBcReply(e.target.value)}
                                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                                placeholder="Write your reply..."
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendBalanceReply();
                                  }
                                }}
                              />
                              <button
                                onClick={sendBalanceReply}
                                className="px-4 py-2 bg-[#4f7c82] text-white rounded hover:bg-[#3f6468] text-sm"
                              >
                                Send
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "users" && (
                <div className="pt-20 xl:pt-0">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Users</h2>
                  </div>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
                    </div>
                  ) : usersList.length === 0 ? (
                    <p className="p-6 text-gray-500">No users found.</p>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block bg-white rounded-lg shadow border overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {usersList.map((u) => (
                              <tr key={u._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name || "—"}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className="items-center text-xs font-medium">
                                    {u.role}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {usersList.map((u) => (
                          <div key={u._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                            <div className="space-y-2">
                              {/* NAME: value format */}
                              <div className="flex items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase w-12">NAME:</span>
                                <span className="text-sm text-gray-900 flex-1 ml-2">{u.name || "—"}</span>
                              </div>

                              {/* EMAIL: value format */}
                              <div className="flex items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase w-12">EMAIL:</span>
                                <span className="text-sm text-gray-600 flex-1 ml-2 break-all">{u.email}</span>
                              </div>

                              {/* ROLE: value format */}
                              <div className="flex items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase w-12">ROLE:</span>
                                <span className={`text-sm font-medium ml-2 ${u.role === 'admin' ? 'text-red-600' :
                                    u.role === 'instructor' ? 'text-blue-600' :
                                      'text-green-600'
                                  }`}>
                                  {u.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <EmailModal
              isOpen={emailModalOpen}
              onClose={closeEmailModal}
              onSend={handleSendEmail}
              userEmail={selectedMessage?.email}
              adminEmail={user.email}
            />

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
        </div>
      </div>
    </div >
  );
}

export default memo(AdminDashboard);
