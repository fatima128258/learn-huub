"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/Button";
import { socket } from "@/lib/socket";


export default function Messaging({ onUnreadCountChange }) {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [chatSearch, setChatSearch] = useState("");
  const [blockedSearch, setBlockedSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const prevMessageCountRef = useRef(0);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [showBlockedContacts, setShowBlockedContacts] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'blocked'

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!userId) return;

    console.log("Setting up socket connection for user:", userId);


    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join", userId);

    return () => {
      socket.off("newMessage");
      socket.off("messageDeleted");
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    console.log("Joining socket room:", userId);
    socket.emit("join", userId);


    const handleNewMessage = async (data) => {
      console.log(" new message:", data);

      if (selectedConversation) {
        const messageSenderId = data.message.sender?._id || data.message.sender;
        const messageReceiverId = data.message.receiver?._id || data.message.receiver;

        const isPartOfConversation =
          (messageSenderId === selectedConversation.user._id && messageReceiverId === userId) ||
          (messageSenderId === userId && messageReceiverId === selectedConversation.user._id);

        console.log("Is part of conversation:", isPartOfConversation, {
          messageSenderId,
          messageReceiverId,
          selectedUserId: selectedConversation.user._id,
          currentUserId: userId
        });

        if (isPartOfConversation) {
          setMessages((prev) => {
            // Avoid duplicates
            const exists = prev.some(msg => msg._id === data.message._id);
            if (exists) {
              console.log("Message already exists, skipping");
              return prev;
            }
            console.log("Adding message to chat");
            return [...prev, data.message];
          });

          if (messageReceiverId === userId && messageSenderId === selectedConversation.user._id) {
            try {
              await fetch('/api/messages/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messageId: data.message._id,
                  userId: userId
                })
              });
              console.log("Message marked as read");
            } catch (error) {
              console.error("Error marking message as read:", error);
            }
          }
        }
      }

      // Always update conversations list
      fetchConversations();
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [selectedConversation, userId]);

  useEffect(() => {
    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== messageId)
      );
      fetchConversations();
    });

    return () => socket.off("messageDeleted");
  }, []);


  const fetchConversations = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/messages?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations || []);

        if (onUnreadCountChange) {
          const totalUnread = (data.conversations || []).reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          );
          onUnreadCountChange(totalUnread);
        }
      }
      setLoadingConversations(false);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setLoadingConversations(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const filteredBlockedContacts = blockedContacts.filter((contact) =>
    contact.name.toLowerCase().includes(blockedSearch.toLowerCase())
  );

  const fetchBlockedContacts = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/messages/blocked?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setBlockedContacts(data.blockedContacts || []);
      }
    } catch (error) {
      console.error("Error fetching blocked contacts:", error);
    }
  };


  const fetchMessages = async (otherUserId, skipBlockCheck = false) => {
    if (!userId || !otherUserId) return;

    // Show loading immediately
    setLoadingMessages(true);

    try {
      const [messagesRes, blockRes] = await Promise.all([
        fetch(`/api/messages?userId=${userId}&conversationWith=${otherUserId}`),
        skipBlockCheck ? Promise.resolve(null) : fetch(`/api/messages/block?userId1=${userId}&userId2=${otherUserId}`)
      ]);

      const messagesData = await messagesRes.json();

      if (messagesData.success) {
        setMessages(messagesData.messages || []);
        setIsBlocked(messagesData.isBlocked || false);
      }


      if (!skipBlockCheck && blockRes) {
        const blockData = await blockRes.json();
        if (blockData.success) {
          setBlockStatus(blockData);
          setIsBlocked(blockData.isBlocked);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };


  const checkBlockStatus = async (otherUserId) => {
    if (!userId || !otherUserId) return;

    try {
      const res = await fetch(
        `/api/messages/block?userId1=${userId}&userId2=${otherUserId}`
      );
      const data = await res.json();

      if (data.success) {
        setBlockStatus(data);
        setIsBlocked(data.isBlocked);
      }
    } catch (error) {
      console.error("Error checking block status:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      // Start loading conversations immediately
      setLoading(false); // Show UI immediately
      fetchConversations();
      fetchBlockedContacts(); // Load in background
    }
  }, [userId]);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);


  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user._id, false);
    }
  }, [selectedConversation, userId]);


  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          receiverId: selectedConversation.user._id,
          content: newMessage.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNewMessage("");

        console.log("Emitting sendMessage:", {
          senderId: userId,
          receiverId: selectedConversation.user._id,
          message: data.message,
        });

        socket.emit("sendMessage", {
          senderId: userId,
          receiverId: selectedConversation.user._id,
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedConversation) return;

    try {
      const res = await fetch("/api/messages/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockerId: userId,
          blockedId: selectedConversation.user._id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsBlocked(true);
        setBlockStatus({
          isBlocked: true,
          block: {
            blocker: userId,
            blocked: selectedConversation.user._id,
          },
        });
        fetchMessages(selectedConversation.user._id);
        checkBlockStatus(selectedConversation.user._id);
        fetchBlockedContacts();
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleUnblock = async (blockedUserId = null) => {
    const targetUserId = blockedUserId || (selectedConversation?.user?._id);
    if (!targetUserId) return;

    try {
      const res = await fetch(
        `/api/messages/block?blockerId=${userId}&blockedId=${targetUserId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (data.success) {
        setIsBlocked(false);
        setBlockStatus(null);

        if (selectedConversation && selectedConversation.user._id === targetUserId) {
          fetchMessages(selectedConversation.user._id);
          checkBlockStatus(selectedConversation.user._id);
        }
        fetchConversations();
        fetchBlockedContacts();
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `/api/messages/conversation/${userId}?otherUserId=${selectedConversation.user._id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (data.success) {
        setSelectedConversation(null);
        setMessages([]);

        setConversations((prev) =>
          prev.filter((conv) => conv.user._id !== selectedConversation.user._id)
        );

        fetchConversations();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || !userId) return;

    setDeletingMessageId(messageId);
    try {
      const res = await fetch(
        `/api/messages/${messageId}?userId=${userId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (data.success) {

        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        socket.emit("deleteMessage", {
          receiverId: selectedConversation.user._id,
          senderId: userId,
          messageId,
        });

        setHoveredMessage(null);

        if (selectedConversation) {
          fetchMessages(selectedConversation.user._id, false);
        }
      } else {
        if (selectedConversation) {
          fetchMessages(selectedConversation.user._id, false);
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setDeletingMessageId(null);
    }
  };

  if (!userId) {
    return (
      <div className="bg-white rounded-lg text-black shadow-md p-6 mt-4">
        <p>Please log in to view messages.</p>
      </div>
    );
  }

  return (
     <div className="bg-white text-black shadow-md lg:px-4 h-screen max-h-screen flex flex-col overflow-hidden pt-16 md:pt-0 lg:pt-16 xl:pt-0">
      {/* {showToast && toastMessage && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )} */}
      {/* Back button removed */}
      {/* <div className="flex items-center justify-between mb-1 px-4 md:px-0 pt-2 md:pt-0">

        {isMobile && selectedConversation && (
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-[#4f7c82] shrink-0 flex items-center gap-1"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs sm:text-sm font-normal sm:font-medium">Back</span>
          </button>
        )}

      </div> */}


      <div className="flex gap-0 md:gap-4 flex-1 relative w-full overflow-hidden min-h-0">

        <div
          className={`
    ${isMobile && selectedConversation ? "hidden" : "block"}
    w-full md:w-1/3 md:border-r md:pr-4 overflow-y-auto hide-scrollbar flex-shrink-0 px-4 md:px-2 lg:px-2 xl:px-0 pt-0 md:pt-0`}
        >

          <div className="mb-4">

            <div className="flex md:flex-col lg:flex-row xl:flex-row gap-2 sm:gap-2 md:gap-2 lg:gap-6 xl:gap-6 mb-4 md:border-b-0 lg:border-b xl:border-b border-gray-200">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`px-2 sm:px-4 py-2 tracking-tight text-xs sm:text-sm transition-colors md:w-full lg:w-auto xl:w-auto md:rounded-lg lg:rounded-none xl:rounded-none ${activeTab === 'conversations'
                  ? 'text-[#4f7c82] md:bg-[#4f7c82] md:text-white lg:bg-transparent lg:text-[#4f7c82] xl:bg-transparent xl:text-[#4f7c82] border-b-2 md:border-b-0 lg:border-b-2 xl:border-b-2 border-[#4f7c82]'
                  : 'text-gray-500 hover:text-gray-700 md:bg-gray-100 lg:bg-transparent xl:bg-transparent'
                  }`}
              >
                Active Contacts
              </button>

              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-2 sm:px-4 py-2 tracking-tight text-xs sm:text-sm transition-colors md:w-full lg:w-auto xl:w-auto md:rounded-lg lg:rounded-none xl:rounded-none ${activeTab === 'blocked'
                  ? 'text-[#4f7c82] md:bg-[#4f7c82] md:text-white lg:bg-transparent lg:text-[#4f7c82] xl:bg-transparent xl:text-[#4f7c82] border-b-2 md:border-b-0 lg:border-b-2 xl:border-b-2 border-[#4f7c82]'
                  : 'text-gray-500 hover:text-gray-700 md:bg-gray-100 lg:bg-transparent xl:bg-transparent'
                  }`}
              >
                Blocked Contacts
              </button>
            </div>


            {/* <div className="flex gap-3 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'conversations'
                    ? 'text-[#4f7c82] border-b-2 border-[#4f7c82]'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Active Contacts
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'blocked'
                    ? 'text-[#4f7c82] border-b-2 border-[#4f7c82]'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Blocked Contacts
              </button>
            </div> */}

            {activeTab === 'conversations' && (
              <div className="mb-4 pl-1">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="
      w-full px-1 py-2 text-xs sm:text-sm
      border-0 border-b-2 border-gray-300
      rounded-none
      focus:outline-none
      focus:border-[#4f7c82]
    "
                />
              </div>

              // <div className="mb-4 pl-1">
              //   <input
              //     type="text"
              //     placeholder="Search by name..."
              //     value={chatSearch}
              //     onChange={(e) => setChatSearch(e.target.value)}
              //     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
              //   />
              // </div>
            )}

            {activeTab === 'blocked' && (
              <div className="mb-4 pl-1">
                <input
                  type="text"
                  placeholder="Search blocked contacts..."
                  value={blockedSearch}
                  onChange={(e) => setBlockedSearch(e.target.value)}
                  className="
      w-full px-1 py-2 text-xs sm:text-sm
      border-0 border-b-2 border-gray-300
      rounded-none
      focus:outline-none
      focus:border-[#4f7c82]
    "
                />
              </div>
            )}


            {activeTab === 'conversations' && (
              <>
                {loadingConversations ? (
                  <p className="text-sm text-gray-500 md:px-4 md:pt-4 lg:px-0 lg:pt-0">Loading...</p>
                ) : filteredConversations.length === 0 ? (
                  <p className="text-sm text-black/60">No conversations yet</p>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.user._id}
                        onClick={async () => {
                          setSelectedConversation(conv);
                          
                          // Mark all unread messages as read immediately
                          if (conv.unreadCount > 0) {
                            try {
                              await fetch('/api/messages/mark-conversation-read', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId: userId,
                                  otherUserId: conv.user._id
                                })
                              });
                              
                              // Update local state immediately
                              setConversations(prevConvs => 
                                prevConvs.map(c => 
                                  c.user._id === conv.user._id 
                                    ? { ...c, unreadCount: 0 } 
                                    : c
                                )
                              );
                              
                              
                              if (onUnreadCountChange) {
                                const newTotalUnread = conversations.reduce(
                                  (sum, c) => sum + (c.user._id === conv.user._id ? 0 : (c.unreadCount || 0)),
                                  0
                                );
                                onUnreadCountChange(newTotalUnread);
                              }
                            } catch (error) {
                              console.error("Error marking messages as read:", error);
                            }
                          }
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${selectedConversation?.user._id === conv.user._id
                          ? "bg-[#4f7c82]/10 border-[#4f7c82] border-l-4"
                          : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {conv.user.profilePicture ? (
                              <img
                                src={conv.user.profilePicture}
                                alt={conv.user.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-normal sm:font-semibold text-black text-xs sm:text-sm truncate select-none">{conv.user.name}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 capitalize mt-0.5 select-none">{conv.user.role}</p>
                              {conv.lastMessage && (
                                <p className="text-xs sm:text-sm text-black truncate mt-1 sm:mt-1.5 select-none cursor-default">
                                  {(() => {
                                    const content = conv.lastMessage.content || '';
                                   
                                    if (content.includes('/uploads/messages/')) {
                                     
                                      if (/\.(jpg|jpeg|png|gif|webp|jfif)/i.test(content)) {
                                        return '📷 Photo';
                                      } else if (/\.(mp4|webm|ogg|mov)/i.test(content)) {
                                        return '🎥 Video';
                                      } else if (/\.pdf/i.test(content)) {
                                        return '� PDF';
                                      } else {
                                        return '📎 File';
                                      }
                                    }
                                    return content;
                                  })()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end ml-2 flex-shrink-0 gap-1">
                            {conv.lastMessage && (
                              <span className="text-[10px] sm:text-xs text-gray-500 select-none">
                                {(() => {
                                  const messageDate = new Date(conv.lastMessage.createdAt);
                                  const currentYear = new Date().getFullYear();
                                  const messageYear = messageDate.getFullYear();
                                  const showYear = messageYear !== currentYear;
                                  
                                  return (
                                    <>
                                      {messageDate.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        ...(showYear && { year: 'numeric' })
                                      })}
                                      {' '}
                                      {messageDate.toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </>
                                  );
                                })()}
                              </span>
                            )}
                            {conv.unreadCount > 0 && (
                              <span className="bg-[#4f7c82] text-white text-[10px] sm:text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-semibold select-none">
                                {conv.unreadCount}
                              </span>
                            )}
                            {conv.isBlocked && (
                              <span className="text-[10px] sm:text-xs text-[#4f7c82] font-medium select-none">Blocked</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

           
            {activeTab === 'blocked' && (
              <>
                {filteredBlockedContacts.length === 0 ? (
                  <div className="px-4 py-12 ">
                    <p className="text-sm text-gray-500">
                      {blockedSearch ? 'No blocked contacts found' : 'No blocked contacts'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredBlockedContacts.map((contact) => (
                      <div
                        key={contact._id}
                        className="p-3 rounded-lg border-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {contact.profilePicture ? (
                              <img
                                src={contact.profilePicture}
                                alt={contact.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-black truncate">{contact.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{contact.role}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUnblock(contact._id);
                            }}
                            className="ml-2 text-xs bg-[#4f7c82] hover:bg-[#3c6267] text-white px-2 py-1 rounded transition-colors"
                          >
                            Unblock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>


        <div
          className={`
    flex-1 flex flex-col min-w-0 px-4 md:px-0 overflow-hidden min-h-0
    ${isMobile && !selectedConversation ? "hidden" : "flex"}
  `}
        >

          {selectedConversation ? (
            <>

              <div className="flex-shrink-0 bg-white border-b border-gray-200 pb-3 mb-4 flex justify-between items-center">

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Back button for mobile */}
                  {isMobile && (
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-[#4f7c82] shrink-0 mr-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {selectedConversation.user.profilePicture ? (
                    <img
                      src={selectedConversation.user.profilePicture}
                      alt={selectedConversation.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-black">{selectedConversation.user.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 capitalize">{selectedConversation.user.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 pl-1">


                  {!isBlocked && !blockStatus?.isBlocked && (
                    <Button
                      onClick={handleBlock}
                      className="bg-[#4f7c82] text-white rounded-lg flex items-center justify-center px-2 py-2 md:px-3 md:py-2"
                    >


                      <span className="md:hidden">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                        </svg>
                      </span>


                      <div>
                        <span className="hidden md:block text-xs sm:text-sm font-normal">
                          Block
                        </span>
                      </div>

                    </Button>
                  )}


                  <Button
                    onClick={handleDeleteConversation}
                    className="bg-[#4f7c82] text-white rounded-lg flex items-center justify-center px-2 py-2 md:px-3"
                  >


                    <span className="md:hidden">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9
7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
                      </svg>
                    </span>


                    <span className="hidden md:block text-xs sm:text-sm font-normal">
                      Delete
                    </span>

                  </Button>

                </div>

              </div>


              <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar pl-0 sm:pl-2 pr-0 sm:pr-3 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4f7c82]"></div>
                      <p className="text-sm text-gray-500">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-center text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isSender = msg.sender._id === userId;
                    const isHovered = hoveredMessage === msg._id;
                    const isDeleting = deletingMessageId === msg._id;

                    
                    const currentMsgDate = new Date(msg.createdAt);
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;
                    
                    const showDateSeparator = !prevMsgDate || 
                      currentMsgDate.toDateString() !== prevMsgDate.toDateString();

                    
                    const getDateLabel = (date) => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      
                      if (date.toDateString() === today.toDateString()) {
                        return 'Today';
                      } else if (date.toDateString() === yesterday.toDateString()) {
                        return 'Yesterday';
                      } else {
                        return date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                        });
                      }
                    };

                    return (
                      <div key={msg._id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-gray-200 text-gray-600 text-[9px] sm:text-xs px-3 sm:px-4 py-1 rounded-md">
                              {getDateLabel(currentMsgDate)}
                            </div>
                          </div>
                        )}
                        <div
                          className={`flex ${isSender ? "justify-end" : "justify-start pr-4 sm:pr-0"} items-end gap-2 group relative`}
                          onMouseEnter={() => setHoveredMessage(msg._id)}
                          onMouseLeave={() => setHoveredMessage(null)}
                        >

                        {!isSender && (
                          <div className="flex-shrink-0">
                            {msg.sender.profilePicture ? (
                              <img
                                src={msg.sender.profilePicture}
                                alt={msg.sender.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="relative flex flex-col select-none">
                          <div
                            className={`max-w-[75vw] sm:max-w-xs md:max-w-sm rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${isSender
                              ? "bg-[#4f7c82] text-white rounded-br-sm"
                              : "bg-gray-100 text-black rounded-bl-sm"
                              }`}
                          >
                            {/* Check if message contains file URL */}
                            {(() => {
                              const content = msg.content || '';
                              const lines = content.split('\n');
                              const fileUrl = lines.find(line => line.startsWith('/uploads/messages/'));
                              const caption = lines.filter(line => !line.startsWith('/uploads/messages/')).join('\n').trim();
                              
                              // Check if it's an image
                              const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp|jfif)$/i.test(fileUrl);
                              const isVideo = fileUrl && /\.(mp4|webm|ogg|mov)$/i.test(fileUrl);
                              const isPDF = fileUrl && /\.pdf$/i.test(fileUrl);
                              
                              if (isImage) {
                                return (
                                  <div className="space-y-2">
                                    <img 
                                      src={fileUrl} 
                                      alt="Shared image" 
                                      className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer"
                                      onClick={() => window.open(fileUrl, '_blank')}
                                    />
                                    {caption && (
                                      <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{caption}</p>
                                    )}
                                  </div>
                                );
                              } else if (isVideo) {
                                return (
                                  <div className="space-y-2">
                                    <video 
                                      src={fileUrl} 
                                      controls 
                                      controlsList="nodownload nopictureinpicture"
                                      disablePictureInPicture
                                      className="rounded-lg max-w-full h-auto max-h-64"
                                    />
                                    {caption && (
                                      <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{caption}</p>
                                    )}
                                  </div>
                                );
                              } else if (isPDF || fileUrl) {
                                return (
                                  <div className="space-y-2">
                                    <a 
                                      href={fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        window.open(fileUrl, '_blank', 'noopener,noreferrer');
                                      }}
                                      className="block cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      <p className="text-xs sm:text-sm font-medium underline">{msg.fileName || 'File'}</p>
                                    </a>
                                    {caption && (
                                      <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{caption}</p>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</p>
                                );
                              }
                            })()}
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p
                                className={`text-xs ${isSender ? "text-white/70" : "text-gray-500"
                                  }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true
                                })}
                              </p>
                              {isSender && msg.read && (
                                <span className="text-xs text-white/70">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>


                        {isSender && (
                          <div className="flex-shrink-0">
                            {user?.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.name || user.email}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Camera Modal */}
              {/* {showCamera && (
                <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                      <h3 className="font-semibold text-black">Take Photo</h3>
                      <button
                        onClick={closeCamera}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="relative bg-black flex items-center justify-center" style={{ height: '60vh' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="max-w-full max-h-full"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="p-4 bg-gray-50 flex justify-center">
                      <button
                        onClick={capturePhoto}
                        className="bg-[#4f7c82] hover:bg-[#3d6166] text-white rounded-full p-4 transition-colors"
                        title="Capture photo"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )} */}

              {/* File Preview Modal */}
              {/* {showFilePreview && selectedFile && (
                <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex items-center justify-end">
                      <button
                        onClick={() => {
                          setShowFilePreview(false);
                          setSelectedFile(null);
                          setFilePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto hide-scrollbar p-4 bg-gray-50 flex items-center justify-center">
                      {filePreview ? (
                        selectedFile?.type.startsWith('video/') ? (
                          <video 
                            src={filePreview} 
                            controls 
                            controlsList="nodownload nopictureinpicture"
                            disablePictureInPicture
                            className="max-w-full max-h-[60vh] rounded"
                          />
                        ) : (
                          <img src={filePreview} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded" />
                        )
                      ) : (
                        <div className="text-center">
                          <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-600 font-medium">{selectedFile.name}</p>
                          <p className="text-gray-400 text-sm mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Add a caption..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                        />
                        <button
                          onClick={() => {
                           
                            handleSendMessage();
                            setShowFilePreview(false);
                            setSelectedFile(null);
                            setFilePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="bg-[#4f7c82] text-white px-6 py-2 rounded-lg hover:bg-[#3d6166] transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )} */}


              {isBlocked || blockStatus?.isBlocked ? (
                <div className="flex-shrink-0 bg-white border-t border-gray-200 pt-3 pb-3">
                  <p className="text-sm text-black text-center">
                    {blockStatus?.block?.blocker === userId
                      ? "You cannot send messages. You have blocked this user."
                      : "You cannot send messages. This user has blocked you."}
                  </p>
                </div>
              ) : (
                <div className="flex-shrink-0 bg-white border-t border-gray-200 p-2 pb-3 sm:pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full border-b border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#4f7c82]"
                        disabled={sending}
                      />
                      {/* File input */}
                      {/* <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            
                            // Create preview for images and videos
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFilePreview(reader.result);
                                setShowFilePreview(true);
                              };
                              reader.readAsDataURL(file);
                            } else if (file.type.startsWith('video/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFilePreview(reader.result);
                                setShowFilePreview(true);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setFilePreview(null);
                              setShowFilePreview(true);
                            }
                          }
                        }}
                        className="hidden"
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      />
                      {/* Camera input */}
                      {/* <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            
                            // Create preview for camera photo
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFilePreview(reader.result);
                              setShowFilePreview(true);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                      /> */}
                      
                      {/* File attachment button removed */}
                      {/* <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4f7c82] hover:text-[#3d6166] transition-colors"
                        title="Attach file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button> */}
                      {/* Camera icon */}
                      {/* <button
                        type="button"
                        onClick={openCamera}
                        className="absolute left-11 top-1/2 -translate-y-1/2 text-[#4f7c82] hover:text-[#3d6166] transition-colors"
                        title="Take photo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button> */}
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-[#4f7c82] text-white px-3 sm:px-4 py-2.5 rounded-lg shrink-0 flex items-center justify-center min-w-[60px] sm:min-w-[80px] hover:bg-[#3d6166] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline text-xs sm:text-sm font-normal">{sending ? "Sending..." : "Send"}</span>
                      <span className="sm:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-black/60">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}























// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import { Button } from "@/components/Button";
// import { socket } from "@/lib/socket";


// export default function Messaging({ onUnreadCountChange }) {
//   const { user } = useSelector((state) => state.auth);
//   const [conversations, setConversations] = useState([]);
//   const [loadingConversations, setLoadingConversations] = useState(true);
//   const [chatSearch, setChatSearch] = useState("");
//   const [blockedSearch, setBlockedSearch] = useState("");
//   const [selectedConversation, setSelectedConversation] = useState(null);
//   const prevMessageCountRef = useRef(0);
//   const [messages, setMessages] = useState([]);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [newMessage, setNewMessage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [isBlocked, setIsBlocked] = useState(false);
//   const [blockStatus, setBlockStatus] = useState(null);
//   const messagesEndRef = useRef(null);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [hoveredMessage, setHoveredMessage] = useState(null);
//   const [deletingMessageId, setDeletingMessageId] = useState(null);
//   const [blockedContacts, setBlockedContacts] = useState([]);
//   const [showBlockedContacts, setShowBlockedContacts] = useState(false);
//   const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'blocked'

//   const userId = user?.id || user?._id;

//   useEffect(() => {
//     if (!userId) return;

//     console.log("Setting up socket connection for user:", userId);


//     if (!socket.connected) {
//       socket.connect();
//     }

//     socket.emit("join", userId);

//     return () => {
//       socket.off("newMessage");
//       socket.off("messageDeleted");
//     };
//   }, [userId]);

//   useEffect(() => {
//     if (!userId) return;

//     console.log("Joining socket room:", userId);
//     socket.emit("join", userId);


//     const handleNewMessage = async (data) => {
//       console.log(" new message:", data);

//       if (selectedConversation) {
//         const messageSenderId = data.message.sender?._id || data.message.sender;
//         const messageReceiverId = data.message.receiver?._id || data.message.receiver;

//         const isPartOfConversation =
//           (messageSenderId === selectedConversation.user._id && messageReceiverId === userId) ||
//           (messageSenderId === userId && messageReceiverId === selectedConversation.user._id);

//         console.log("Is part of conversation:", isPartOfConversation, {
//           messageSenderId,
//           messageReceiverId,
//           selectedUserId: selectedConversation.user._id,
//           currentUserId: userId
//         });

//         if (isPartOfConversation) {
//           setMessages((prev) => {
//             // Avoid duplicates
//             const exists = prev.some(msg => msg._id === data.message._id);
//             if (exists) {
//               console.log("Message already exists, skipping");
//               return prev;
//             }
//             console.log("Adding message to chat");
//             return [...prev, data.message];
//           });

//           if (messageReceiverId === userId && messageSenderId === selectedConversation.user._id) {
//             try {
//               await fetch('/api/messages/mark-read', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                   messageId: data.message._id,
//                   userId: userId
//                 })
//               });
//               console.log("Message marked as read");
//             } catch (error) {
//               console.error("Error marking message as read:", error);
//             }
//           }
//         }
//       }

//       // Always update conversations list
//       fetchConversations();
//     };

//     socket.on("newMessage", handleNewMessage);

//     return () => {
//       socket.off("newMessage", handleNewMessage);
//     };
//   }, [selectedConversation, userId]);

//   useEffect(() => {
//     socket.on("messageDeleted", ({ messageId }) => {
//       setMessages((prev) =>
//         prev.filter((msg) => msg._id !== messageId)
//       );
//       fetchConversations();
//     });

//     return () => socket.off("messageDeleted");
//   }, []);


//   const fetchConversations = async () => {
//     if (!userId) return;

//     try {
//       const res = await fetch(`/api/messages?userId=${userId}`);
//       const data = await res.json();

//       if (data.success) {
//         setConversations(data.conversations || []);

//         if (onUnreadCountChange) {
//           const totalUnread = (data.conversations || []).reduce(
//             (sum, conv) => sum + (conv.unreadCount || 0),
//             0
//           );
//           onUnreadCountChange(totalUnread);
//         }
//       }
//       setLoadingConversations(false);
//     } catch (error) {
//       console.error("Error fetching conversations:", error);
//       setLoadingConversations(false);
//     }
//   };

//   const filteredConversations = conversations.filter((conv) =>
//     conv.user.name.toLowerCase().includes(chatSearch.toLowerCase())
//   );

//   const filteredBlockedContacts = blockedContacts.filter((contact) =>
//     contact.name.toLowerCase().includes(blockedSearch.toLowerCase())
//   );

//   const fetchBlockedContacts = async () => {
//     if (!userId) return;

//     try {
//       const res = await fetch(`/api/messages/blocked?userId=${userId}`);
//       const data = await res.json();

//       if (data.success) {
//         setBlockedContacts(data.blockedContacts || []);
//       }
//     } catch (error) {
//       console.error("Error fetching blocked contacts:", error);
//     }
//   };


//   const fetchMessages = async (otherUserId, skipBlockCheck = false) => {
//     if (!userId || !otherUserId) return;

//     // Show loading immediately
//     setLoadingMessages(true);

//     try {
//       const [messagesRes, blockRes] = await Promise.all([
//         fetch(`/api/messages?userId=${userId}&conversationWith=${otherUserId}`),
//         skipBlockCheck ? Promise.resolve(null) : fetch(`/api/messages/block?userId1=${userId}&userId2=${otherUserId}`)
//       ]);

//       const messagesData = await messagesRes.json();

//       if (messagesData.success) {
//         setMessages(messagesData.messages || []);
//         setIsBlocked(messagesData.isBlocked || false);
//       }


//       if (!skipBlockCheck && blockRes) {
//         const blockData = await blockRes.json();
//         if (blockData.success) {
//           setBlockStatus(blockData);
//           setIsBlocked(blockData.isBlocked);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//     } finally {
//       setLoadingMessages(false);
//     }
//   };


//   const checkBlockStatus = async (otherUserId) => {
//     if (!userId || !otherUserId) return;

//     try {
//       const res = await fetch(
//         `/api/messages/block?userId1=${userId}&userId2=${otherUserId}`
//       );
//       const data = await res.json();

//       if (data.success) {
//         setBlockStatus(data);
//         setIsBlocked(data.isBlocked);
//       }
//     } catch (error) {
//       console.error("Error checking block status:", error);
//     }
//   };

//   useEffect(() => {
//     if (userId) {

//       Promise.all([fetchConversations(), fetchBlockedContacts()]).catch((error) => {
//         console.error("Error loading initial data:", error);
//         setLoadingConversations(false);
//       }).finally(() => {
//         setLoading(false);
//       });
//     }
//   }, [userId]);

//   useEffect(() => {
//     const checkScreen = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     checkScreen();
//     window.addEventListener("resize", checkScreen);

//     return () => window.removeEventListener("resize", checkScreen);
//   }, []);


//   useEffect(() => {
//     if (selectedConversation) {
//       fetchMessages(selectedConversation.user._id, false);
//     }
//   }, [selectedConversation, userId]);


//   useEffect(() => {
//     if (messages.length > prevMessageCountRef.current) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//     prevMessageCountRef.current = messages.length;
//   }, [messages]);


//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !selectedConversation || sending) return;

//     setSending(true);
//     try {
//       const res = await fetch("/api/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           senderId: userId,
//           receiverId: selectedConversation.user._id,
//           content: newMessage.trim(),
//         }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         setNewMessage("");

//         console.log("Emitting sendMessage:", {
//           senderId: userId,
//           receiverId: selectedConversation.user._id,
//           message: data.message,
//         });

//         socket.emit("sendMessage", {
//           senderId: userId,
//           receiverId: selectedConversation.user._id,
//           message: data.message,
//         });
//       }
//     } catch (error) {
//       console.error("Error sending message:", error);
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleBlock = async () => {
//     if (!selectedConversation) return;

//     try {
//       const res = await fetch("/api/messages/block", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           blockerId: userId,
//           blockedId: selectedConversation.user._id,
//         }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         setIsBlocked(true);
//         setBlockStatus({
//           isBlocked: true,
//           block: {
//             blocker: userId,
//             blocked: selectedConversation.user._id,
//           },
//         });
//         fetchMessages(selectedConversation.user._id);
//         checkBlockStatus(selectedConversation.user._id);
//         fetchBlockedContacts();
//       }
//     } catch (error) {
//       console.error("Error blocking user:", error);
//     }
//   };

//   const handleUnblock = async (blockedUserId = null) => {
//     const targetUserId = blockedUserId || (selectedConversation?.user?._id);
//     if (!targetUserId) return;

//     try {
//       const res = await fetch(
//         `/api/messages/block?blockerId=${userId}&blockedId=${targetUserId}`,
//         { method: "DELETE" }
//       );

//       const data = await res.json();

//       if (data.success) {
//         setIsBlocked(false);
//         setBlockStatus(null);

//         if (selectedConversation && selectedConversation.user._id === targetUserId) {
//           fetchMessages(selectedConversation.user._id);
//           checkBlockStatus(selectedConversation.user._id);
//         }
//         fetchConversations();
//         fetchBlockedContacts();
//       }
//     } catch (error) {
//       console.error("Error unblocking user:", error);
//     }
//   };

//   const handleDeleteConversation = async () => {
//     if (!selectedConversation) return;

//     try {
//       const res = await fetch(
//         `/api/messages/conversation/${userId}?otherUserId=${selectedConversation.user._id}`,
//         { method: "DELETE" }
//       );

//       const data = await res.json();

//       if (data.success) {
//         setSelectedConversation(null);
//         setMessages([]);

//         setConversations((prev) =>
//           prev.filter((conv) => conv.user._id !== selectedConversation.user._id)
//         );

//         fetchConversations();
//       }
//     } catch (error) {
//       console.error("Error deleting conversation:", error);
//     }
//   };

//   const handleDeleteMessage = async (messageId) => {
//     if (!messageId || !userId) return;

//     setDeletingMessageId(messageId);
//     try {
//       const res = await fetch(
//         `/api/messages/${messageId}?userId=${userId}`,
//         { method: "DELETE" }
//       );

//       const data = await res.json();

//       if (data.success) {

//         setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
//         socket.emit("deleteMessage", {
//           receiverId: selectedConversation.user._id,
//           senderId: userId,
//           messageId,
//         });

//         setHoveredMessage(null);

//         if (selectedConversation) {
//           fetchMessages(selectedConversation.user._id, false);
//         }
//       } else {
//         if (selectedConversation) {
//           fetchMessages(selectedConversation.user._id, false);
//         }
//       }
//     } catch (error) {
//       console.error("Error deleting message:", error);
//     } finally {
//       setDeletingMessageId(null);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white rounded-lg text-black shadow-md p-6 mt-4">
//         <p>Loading messages...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg text-black shadow-md pl-6 md:pt-0 pt-12 pr-4 pb-4">
//       <div className="flex items-center gap-2 mb-4">

//         <h2 className="lg:text-xl text-md font-semibold text-black mb-2 pt-12 md:pt-0">
//           Messages
//         </h2>

//         {isMobile && selectedConversation && (
//           <button
//             onClick={() => setSelectedConversation(null)}
//             className="p-1 text-[#4f7c82] shrink-0 pl-12"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                 d="M15 19l-7-7 7-7" />
//             </svg>
//           </button>
//         )}

//       </div>


//       <div className="flex gap-4 h-[600px] relative w-full overflow-hidden">

//         <div
//           className={`
//     ${isMobile && selectedConversation ? "hidden" : "block"}
//     w-full md:w-1/3 border-r pr-4 overflow-y-auto flex-shrink-0`}
//         >

//           <div className="mb-4">

//             <div className="flex gap-2 sm:gap-2 md:gap-3 lg:gap-6 mb-4 border-b border-gray-200">
//               <button
//                 onClick={() => setActiveTab('conversations')}
//                 className={`px-3 sm:px-4 py-2 tracking-tight text-sm transition-colors ${activeTab === 'conversations'
//                   ? 'text-[#4f7c82] border-b-2 border-[#4f7c82]'
//                   : 'text-gray-500 hover:text-gray-700'
//                   }`}
//               >
//                 Active Contacts
//               </button>

//               <button
//                 onClick={() => setActiveTab('blocked')}
//                 className={`px-3 sm:px-4 py-2 tracking-tight text-sm transition-colors ${activeTab === 'blocked'
//                   ? 'text-[#4f7c82] border-b-2 border-[#4f7c82]'
//                   : 'text-gray-500 hover:text-gray-700'
//                   }`}
//               >
//                 Blocked Contacts
//               </button>
//             </div>


//             {/* <div className="flex gap-3 mb-4 border-b border-gray-200">
//               <button
//                 onClick={() => setActiveTab('conversations')}
//                 className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'conversations'
//                     ? 'text-[#4f7c82] border-b-2 border-[#4f7c82]'
//                     : 'text-gray-500 hover:text-gray-700'
//                   }`}
//               >
//                 Active Contacts
//               </button>
//               <button
//                 onClick={() => setActiveTab('blocked')}
//                 className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'blocked'
//                     ? 'text-[#4f7c82] border-b-2 border-[#4f7c82]'
//                     : 'text-gray-500 hover:text-gray-700'
//                   }`}
//               >
//                 Blocked Contacts
//               </button>
//             </div> */}

//             {activeTab === 'conversations' && (
//               <div className="mb-4 pl-1">
//                 <input
//                   type="text"
//                   placeholder="Search by name..."
//                   value={chatSearch}
//                   onChange={(e) => setChatSearch(e.target.value)}
//                   className="
//       w-full px-1 py-2
//       border-0 border-b-2 border-gray-300
//       rounded-none
//       focus:outline-none
//       focus:border-[#4f7c82]
//     "
//                 />
//               </div>

//               // <div className="mb-4 pl-1">
//               //   <input
//               //     type="text"
//               //     placeholder="Search by name..."
//               //     value={chatSearch}
//               //     onChange={(e) => setChatSearch(e.target.value)}
//               //     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//               //   />
//               // </div>
//             )}

//             {activeTab === 'blocked' && (
//               <div className="mb-4 pl-1">
//                 <input
//                   type="text"
//                   placeholder="Search blocked contacts..."
//                   value={blockedSearch}
//                   onChange={(e) => setBlockedSearch(e.target.value)}
//                   className="
//       w-full px-1 py-2
//       border-0 border-b-2 border-gray-300
//       rounded-none
//       focus:outline-none
//       focus:border-[#4f7c82]
//     "
//                 />
//               </div>
//             )}


//             {activeTab === 'conversations' && (
//               <>
//                 {loadingConversations ? (
//                   <p className="text-sm text-gray-500">Loading...</p>
//                 ) : filteredConversations.length === 0 ? (
//                   <p className="text-sm text-black/60">No conversations yet</p>
//                 ) : (
//                   <div className="space-y-2">
//                     {filteredConversations.map((conv) => (
//                       <div
//                         key={conv.user._id}
//                         onClick={() => setSelectedConversation(conv)}
//                         className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${selectedConversation?.user._id === conv.user._id
//                           ? "bg-[#4f7c82]/10 border-[#4f7c82] border-l-4"
//                           : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300"
//                           }`}
//                       >
//                         <div className="flex justify-between items-start">
//                           <div className="flex items-center gap-3 flex-1 min-w-0">
//                             {conv.user.profilePicture ? (
//                               <img
//                                 src={conv.user.profilePicture}
//                                 alt={conv.user.name}
//                                 className="w-10 h-10 rounded-full object-cover flex-shrink-0"
//                               />
//                             ) : (
//                               <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
//                                 <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
//                                   <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                                 </svg>
//                               </div>
//                             )}
//                             <div className="flex-1 min-w-0">
//                               <p className="font-bold text-black text-base truncate">{conv.user.name}</p>
//                               <p className="text-xs text-gray-500 capitalize mt-0.5">{conv.user.role}</p>
//                               {conv.lastMessage && (
//                                 <p className="text-sm text-black truncate mt-1.5">
//                                   {conv.lastMessage.content}
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                           <div className="flex flex-col items-end ml-2 flex-shrink-0">
//                             {conv.unreadCount > 0 && (
//                               <span className="bg-[#4f7c82] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center mb-1 font-semibold">
//                                 {conv.unreadCount}
//                               </span>
//                             )}
//                             {conv.isBlocked && (
//                               <span className="text-xs text-[#4f7c82] font-medium">Blocked</span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </>
//             )}


//             {activeTab === 'blocked' && (
//               <>
//                 {filteredBlockedContacts.length === 0 ? (
//                   <div className="px-4 py-12 ">
//                     <p className="text-sm text-gray-500">
//                       {blockedSearch ? 'No blocked contacts found' : 'No blocked contacts'}
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     {filteredBlockedContacts.map((contact) => (
//                       <div
//                         key={contact._id}
//                         className="p-3 rounded-lg border-2"
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-2 flex-1 min-w-0">
//                             {contact.profilePicture ? (
//                               <img
//                                 src={contact.profilePicture}
//                                 alt={contact.name}
//                                 className="w-8 h-8 rounded-full object-cover"
//                               />
//                             ) : (
//                               <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
//                                 <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
//                                   <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                                 </svg>
//                               </div>
//                             )}
//                             <div className="flex-1 min-w-0">
//                               <p className="font-semibold text-sm text-black truncate">{contact.name}</p>
//                               <p className="text-xs text-gray-500 capitalize">{contact.role}</p>
//                             </div>
//                           </div>
//                           <button
//                             onClick={(e) => {
//                               e.preventDefault();
//                               e.stopPropagation();
//                               handleUnblock(contact._id);
//                             }}
//                             className="ml-2 text-xs bg-[#4f7c82] hover:bg-[#3c6267] text-white px-2 py-1 rounded transition-colors"
//                           >
//                             Unblock
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>


//         <div
//           className={`
//     flex-1 flex flex-col min-w-0
//     ${isMobile && !selectedConversation ? "hidden" : "flex"}
//   `}
//         >

//           {selectedConversation ? (
//             <>

//               <div className="border-b border-gray-200 pb-3 mb-4 flex justify-between items-center">

//                 <div className="flex items-center gap-2 md:gap-3">

//                   {selectedConversation.user.profilePicture ? (
//                     <img
//                       src={selectedConversation.user.profilePicture}
//                       alt={selectedConversation.user.name}
//                       className="w-10 h-10 rounded-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
//                       <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                   )}
//                   <div>
//                     <h3 className="font-bold text-lg text-black">{selectedConversation.user.name}</h3>
//                     <p className="text-sm text-gray-500 capitalize">{selectedConversation.user.role}</p>
//                   </div>
//                 </div>
//                 <div className="flex gap-1 pl-1">


//                   {!isBlocked && !blockStatus?.isBlocked && (
//                     <Button
//                       onClick={handleBlock}
//                       className="bg-[#4f7c82] text-white rounded-lg flex items-center justify-center md:px-3 md:py-2"
//                     >


//                       <span className="md:hidden">
//                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                             d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
//                         </svg>
//                       </span>


//                       <div>
//                         <span className="hidden md:block text-sm">
//                           Block
//                         </span>
//                       </div>

//                     </Button>
//                   )}


//                   <Button
//                     onClick={handleDeleteConversation}
//                     className="bg-[#4f7c82] text-white rounded-lg flex items-center justify-center px-2 py-2 md:px-3"
//                   >


//                     <span className="md:hidden">
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                           d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
// a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9
// 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
//                       </svg>
//                     </span>


//                     <span className="hidden md:block text-sm">
//                       Delete
//                     </span>

//                   </Button>

//                 </div>

//               </div>


//               <div className="flex-1 overflow-y-auto mb-4 px-2 space-y-3">
//                 {loadingMessages ? (
//                   <div className="flex items-center justify-center h-full">
//                     <p className="text-center text-gray-500">Loading...</p>
//                   </div>
//                 ) : messages.length === 0 ? (
//                   <div className="flex items-center justify-center h-full">
//                     <p className="text-center text-gray-500">No messages yet</p>
//                   </div>
//                 ) : (
//                   messages.map((msg) => {
//                     const isSender = msg.sender._id === userId;
//                     const isHovered = hoveredMessage === msg._id;
//                     const isDeleting = deletingMessageId === msg._id;

//                     return (
//                       <div
//                         key={msg._id}
//                         className={`flex ${isSender ? "justify-end" : "justify-start"} items-end gap-2 group relative`}
//                         onMouseEnter={() => setHoveredMessage(msg._id)}
//                         onMouseLeave={() => setHoveredMessage(null)}
//                       >

//                         {!isSender && (
//                           <div className="flex-shrink-0">
//                             {msg.sender.profilePicture ? (
//                               <img
//                                 src={msg.sender.profilePicture}
//                                 alt={msg.sender.name}
//                                 className="w-8 h-8 rounded-full object-cover"
//                               />
//                             ) : (
//                               <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
//                                 <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
//                                   <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                                 </svg>
//                               </div>
//                             )}
//                           </div>
//                         )}

//                         <div className="relative flex flex-col">
//                           <div
//                             className={`w-40 rounded-2xl px-4 py-2.5 border-4 shadow-sm transition-all duration-200 ${isSender
//                               ? "bg-[#4f7c82] text-white rounded-br-sm"
//                               : "bg-gray-100 text-black rounded-bl-sm"
//                               }`}
//                           >
//                             <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
//                             <div className="flex items-center justify-end gap-1 mt-1">
//                               <p
//                                 className={`text-xs ${isSender ? "text-white/70" : "text-gray-500"
//                                   }`}
//                               >
//                                 {new Date(msg.createdAt).toLocaleTimeString([], {
//                                   hour: "2-digit",
//                                   minute: "2-digit",
//                                 })}
//                               </p>
//                               {isSender && msg.read && (
//                                 <span className="text-xs text-white/70">✓</span>
//                               )}
//                             </div>
//                           </div>
//                         </div>


//                         {isSender && (
//                           <div className="flex-shrink-0">
//                             {user?.profilePicture ? (
//                               <img
//                                 src={user.profilePicture}
//                                 alt={user.name || user.email}
//                                 className="w-8 h-8 rounded-full object-cover"
//                               />
//                             ) : (
//                               <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
//                                 <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
//                                   <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                                 </svg>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })
//                 )}
//                 <div ref={messagesEndRef} />
//               </div>


//               {isBlocked || blockStatus?.isBlocked ? (
//                 <div className="border-t border-gray-200 pt-3">
//                   <p className="text-sm text-black text-center">
//                     {blockStatus?.block?.blocker === userId
//                       ? "You cannot send messages. You have blocked this user."
//                       : "You cannot send messages. This user has blocked you."}
//                   </p>
//                 </div>
//               ) : (
//                 <div className="border-t border-gray-200 pt-3 flex items-center gap-2">
//                   <input
//                     type="text"
//                     value={newMessage}
//                     onChange={(e) => setNewMessage(e.target.value)}
//                     onKeyPress={(e) => {
//                       if (e.key === "Enter" && !e.shiftKey) {
//                         e.preventDefault();
//                         handleSendMessage();
//                       }
//                     }}
//                     placeholder="Type a message..."
//                     className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 mb-2 focus:ring-[#4f7c82]"
//                     disabled={sending}
//                   />
//                   <Button
//                     onClick={handleSendMessage}
//                     disabled={!newMessage.trim() || sending}
//                     className="bg-[#4f7c82] text-white px-3 py-2 mb-2 rounded-lg shrink-0"
//                   >
//                     {sending ? "Sending..." : "Send"}
//                   </Button>
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-black/60">
//               <p>Select a conversation to start messaging</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
