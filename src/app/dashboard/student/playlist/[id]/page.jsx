"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import VideoPlayer from "@/components/VideoPlayer";
import { fetchStudentPlaylists } from "@/store/playlist";

export default function StudentPlaylistViewPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!params.id) return;

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
  }, [params.id]);

  const handleClose = () => {
    // Refresh playlists when closing to update progress
    const userId = user?.id || user?._id;
    if (userId && user?.role === "student") {
      dispatch(fetchStudentPlaylists(userId));
    }
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading playlist...</p>
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
