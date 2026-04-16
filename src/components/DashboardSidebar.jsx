"use client";

import { useState } from "react";

export default function DashboardSidebar({
  panelName = "Panel",
  userName = "User",
  userEmail = "",
  profilePicture = null,
  menuItems = [],
  activeTab,
  setActiveTab,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  showProfileDropdown,
  setShowProfileDropdown,
  uploadingProfilePicture = false,
  onProfilePictureClick,
  fileInputRef,
  onProfilePictureChange,
  unreadMessageCount = 0,
}) {
  return (
    <>
      {/* Blur Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b shadow-lg bg-white fixed top-0 left-0 right-0 z-[35] transition-all duration-300">
        <h1 className="text-base sm:text-lg font-semibold">{panelName}</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-xl sm:text-2xl p-1 hover:bg-gray-100 rounded"
        >
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
fixed lg:static top-0 left-0 z-50
h-screen bg-white shadow-lg flex flex-col
transition-all duration-300 ease-in-out
overflow-hidden

/* Desktop width */
${isSidebarCollapsed ? "lg:w-16" : "lg:w-56"}

/* Mobile width */
${isSidebarOpen ? "w-56" : "w-0"}

/* Slide behavior */
${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2">
          <h1 className="text-lg font-semibold">{panelName}</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-2xl hover:bg-gray-100 rounded p-1"
          >
            ✕
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block pt-2 lg:pt-4 pl-4 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <h1 className={`${isSidebarCollapsed ? "hidden" : "block"} text-2xl font-semibold tracking-tighter text-black`}>
              {panelName}
            </h1>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="flex text-xl hover:bg-gray-100 mt-1 rounded p-2"
            >
              {isSidebarCollapsed ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Profile Section */}
        <div className="pt-2 lg:pt-4 pl-4 pb-4 border-b flex-shrink-0">
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
                    onProfilePictureClick();
                  }}
                  className="w-10 h-10 rounded-full bg-black/5 border-2 border-[#4f7c82]/20 flex items-center justify-center text-black/40 cursor-pointer hover:border-[#4f7c82]/40 transition-colors relative overflow-hidden"
                >
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
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
                onChange={onProfilePictureChange}
                className="hidden"
              />
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">Welcome</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3">
            <div className="flex items-center justify-between px-3 mb-2">
              {!isSidebarCollapsed && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main
                </p>
              )}
            </div>

            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? "justify-center" : "gap-4"
                } px-4 py-2 sm:py-2.5 rounded-xl mb-1 transition-colors ${
                  activeTab === item.id
                    ? "bg-[#4f7c82] text-white shadow-md"
                    : "text-black hover:bg-black/5"
                }`}
              >
                <span className="text-xl flex items-center justify-center w-6">
                  {item.icon}
                </span>
                {!isSidebarCollapsed && (
                  <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {item.id === "messages" && unreadMessageCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Logout Button */}
        <div className="border-t border-gray-200 p-3 bg-white">
          <button
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-[#4f7c82] text-white hover:bg-[#42686d]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {!isSidebarCollapsed && (
              <span className="font-medium whitespace-nowrap">logout</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
