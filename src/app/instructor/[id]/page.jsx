"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/Button";
import Link from "next/link";
import MessageModal from "@/components/MessageModal";

export default function InstructorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const instructorId = params.id;

  const [instructor, setInstructor] = useState(null);
  const [cv, setCv] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [showCV, setShowCV] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

       
        const instructorRes = await fetch(`/api/instructor/cv?instructorId=${instructorId}`);
        const instructorData = await instructorRes.json();

        if (!instructorData.success) {
          throw new Error(instructorData.message || "Instructor not found");
        }

        
        if (instructorData.instructor) {
          setInstructor(instructorData.instructor);
        }

       
        setCv(instructorData.cv);

        
        const playlistsRes = await fetch(`/api/instructor/playlists?instructorId=${instructorId}`);
        const playlistsData = await playlistsRes.json();

        if (playlistsData.success) {
          setPlaylists(playlistsData.playlists);
        }
      } catch (err) {
        console.error("Error fetching instructor data:", err);
        setError(err.message || "Failed to load instructor profile");
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) {
      fetchData();
    }
  }, [instructorId, isAuthenticated, user, router]);

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedPlaylist(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-black/70">Loading instructor profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-black text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-black mb-2">Error</h2>
            <p className="text-black/70 mb-6">{error}</p>
            <Button onClick={() => router.push("/dashboard/student")} variant="primary">
              Go Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
     
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/student"
              className="flex items-center gap-1.5 sm:gap-2 text-[#4f7c82] hover:text-[#3d6166] font-normal sm:font-medium transition-colors group text-xs sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Logged in as: <span className="font-semibold text-gray-800">{user.name}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 overflow-hidden relative"> */}
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex flex-col md:flex-row gap-8 relative z-10">
            
            <div className="flex-shrink-0">
              {cv?.profileImage ? (
                <div className="relative">
                  <img
                    src={cv.profileImage}
                    alt="Profile"
                    className="w-28 h-30 rounded-2xl object-cover border-4 border-white shadow-2xl ring-4 ring-[#4f7c82]/20"
                  />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-[#4f7c82]/10 to-[#4f7c82]/5 border-4 border-white shadow-2xl ring-4 ring-[#4f7c82]/20 flex items-center justify-center">
                  <svg
                    className="w-20 h-20 text-[#4f7c82]/40"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

           
            <div className="flex-1">
              <div className="mb-2">
                <h1 className="text-lg font-semibold text-gray-900 mb-2">
                  {instructor?.name || "Instructor"}
                </h1>
                <div className="flex items-center gap-2 text-gray-500">
                  {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg> */}
                  <span className="text-sm">Instructor</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
               {/*  {cv && (
                  <Button
                    onClick={() => setShowCV(!showCV)}
                    variant="primary"
                    className="bg-gradient-to-r from-[#4f7c82] to-[#3d6166] text-white hover:from-[#3d6166] hover:to-[#2d4d52] px-4 py-1 rounded-md shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {showCV ? "Hide instructor detail" : "View instructor detail"}
                  </Button>
                )} */}
                {user && user.role === "student" && instructor && (
                  <Button
                    onClick={() => setIsMessageModalOpen(true)}
                    variant="primary"
                    className="bg-gradient-to-r from-[#4f7c82] to-[#3d6166] text-white hover:from-[#3d6166] hover:to-[#2d4d52] px-4 py-1 rounded-md shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Messages
                  </Button>
                )}
              </div>
            </div>
          </div>
        {/* </div> */}

        {cv && showCV && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 animate-in slide-in-from-top-5 duration-300">
            {/* <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-[#4f7c82] to-[#3d6166] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Instructor CV</h2>
            </div> */}

            <div className="flex gap-12">
              {cv.about && (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-[#4f7c82] rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">About</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{cv.about}</p>
                </div>
              )}

              {cv.education && (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-[#4f7c82] rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Education</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{cv.education}</p>
                </div>
              )}

              {cv.experience && (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-[#4f7c82] rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Experience</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <div className="w-12 h-12 bg-gradient-to-br from-[#4f7c82] to-[#3d6166] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div> */}
                    <p className="text-lg font-semibold text-gray-900">{cv.experience} years</p>
                  </div>
                </div>
              )}

              {cv.skills && (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-[#4f7c82] rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {cv.skills.split(", ").map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-[#4f7c82]/10 to-[#4f7c82]/5 text-[#4f7c82] rounded-lg text-sm font-semibold border border-[#4f7c82]/20 hover:from-[#4f7c82]/20 hover:to-[#4f7c82]/10 transition-all duration-200"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        
        {/* <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"> */}
          {/* <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100"> */}
            {/* <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#4f7c82] to-[#3d6166] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Playlists
                <span className="ml-3 text-xl text-gray-500 font-normal">({playlists.length})</span>
              </h2>
            </div> */}
          {/* </div> */}

          {playlists.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No approved playlists available yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap pt-4 gap-6">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-4 gap-6"> */}
              {playlists.map((playlist) => (
                <div
                  key={playlist._id}
                  className="group bg-white border-2 border-gray-100 rounded-xl p-6 px-12 hover:border-[#4f7c82]/30 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden"
                >
                
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4f7c82]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex-1 relative z-10">
                    <div className="mb-4">
                      <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-[#4f7c82] transition-colors">
                        {playlist.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {playlist.description || "No description available"}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-xs font-medium">
                          {playlist.content?.length || playlist.videos?.length || 0} item
                          {(playlist.content?.length || playlist.videos?.length || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4  border-t border-gray-100 relative z-10">
                    <Button
                      onClick={() => {
                        setSelectedPlaylist(playlist);
                        setIsPlayerOpen(true);
                      }}
                      variant="primary"
                      className="w-full bg-gradient-to-r from-[#4f7c82] to-[#3d6166] text-white hover:from-[#3d6166] hover:to-[#2d4d52] rounded-xl py-3 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                      disabled={
                        ((!playlist.videos || playlist.videos.length === 0) &&
                          (!playlist.content || playlist.content.length === 0))
                      }
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Play Content
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        {/* </div> */}
      </div>

   
      <VideoPlayer
        playlist={selectedPlaylist}
        open={isPlayerOpen}
        onClose={handleClosePlayer}
      />

      {(instructor || instructorId) && (
        <MessageModal
          open={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          otherUserId={instructor?._id || instructorId}
          otherUserName={instructor?.name || "Instructor"}
          otherUserRole="instructor"
        />
      )}
    </div>
  );
}