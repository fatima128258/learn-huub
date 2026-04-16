export default function Sidebar({
  title,
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  menuItems,
  user,
  handleLogout,
  unreadMessageCount = 0
}) {
  return (
    <div className={`
fixed xl:relative z-50
${sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
${sidebarOpen ? "w-48 2xl:w-56" : "w-16"}
bg-white shadow-lg flex flex-col h-screen overflow-hidden
transition-all duration-300
`}>

      {/* Header with Title and Toggle */}
      <div className={`px-3 border-b flex py-4 sm:py-6 items-center flex-shrink-0 ${sidebarOpen ? "justify-between" : "justify-center"}`}>
        {sidebarOpen && (
          <h1 className="text-base sm:text-lg lg:text-xl font-medium tracking-tighter text-black">
            {title}
          </h1>
        )}

        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {sidebarOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Items - Scrollable */}
      <div className="py-2 flex-1 overflow-y-auto hide-scrollbar mb-2">
        <div className="px-3 pt-2">

          {sidebarOpen && (
            <p className="text-xs font-semibold text-black/60 uppercase tracking-wider mb-1 px-1">
              Main
            </p>
          )}

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2 2xl:px-4 px-2 py-2 rounded-md mb-1 transition-all
              
              ${!sidebarOpen ? "justify-center" : ""}

              ${activeTab === item.id
                  ? "bg-[#4f7c82] text-white shadow-md"
                  : "text-black hover:bg-black/5"}
              `}
            >

              <span className="text-xl flex items-center justify-center w-4">
                {item.icon}
              </span>

              {sidebarOpen && (
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  {item.label}
                </span>
              )}

              {item.id === "messages" && unreadMessageCount > 0 && sidebarOpen && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              )}

            </button>
          ))}

        </div>
      </div>

      {/* User Profile Section */}
      <div className={`border-t border-b ${sidebarOpen ? "p-3" : "p-2"}`}>
        <div className={`flex items-center ${sidebarOpen ? "gap-2" : "justify-center"}`}>
          {user?.avatar ? (
            <img
              src={user.avatar}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex-shrink-0"
              alt="user"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 bg-gradient-to-br from-[#4f7c82] to-[#3d6166] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">Welcome</p>
            </div>
          )}
        </div>
      </div>

      {/* LOGOUT */}
      <div className={`${sidebarOpen ? "p-3 sm:p-4" : "p-2 flex justify-center"}`}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 sm:py-3 rounded-lg bg-[#4f7c82] text-white hover:bg-[#42686d] transition-colors"
        >
          <span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>

          {sidebarOpen && (
            <span className="font-medium text-xs sm:text-sm">
              Logout
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
