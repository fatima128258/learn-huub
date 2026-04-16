"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import VideoPlayer from "@/components/VideoPlayer";

export default function PlaylistViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { playlists } = useSelector((state) => state.playlist);
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!params.id) return;

      // First, try to get from Redux state (instant)
      const cachedPlaylist = playlists.find(p => p._id === params.id);
      if (cachedPlaylist) {
        setPlaylist(cachedPlaylist);
        setLoading(false);
        return;
      }

      // If not in Redux, fetch from API
      try {
        setLoading(true);
        const response = await axios.get(`/api/playlist/${params.id}`);
        
        if (response.data.success) {
          setPlaylist(response.data.playlist);
        } else {
          setError("Failed to load playlist");
        }
      } catch (err) {
        console.error("Error fetching playlist:", err);
        setError(err.response?.data?.message || "Failed to load playlist");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [params.id, playlists]);

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4f7c82] border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <VideoPlayer 
        playlist={playlist} 
        open={true} 
        onClose={handleClose}
        fullPage={true}
      />
    </div>
  );
}
