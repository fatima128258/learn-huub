"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Certificate from "@/components/Certificate";

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      try {
        const response = await fetch(`/api/playlist/${params.playlistId}`);
        const data = await response.json();

        if (data.success) {
          setCertificateData({
            studentName: user?.name || user?.username || user?.email || "Student",
            playlistTitle: data.playlist.title,
            instructorName: data.playlist.instructor?.name || "Instructor",
            completionDate: data.playlist.purchase?.completedAt || new Date(),
          });
        }
      } catch (error) {
        console.error("Error fetching playlist:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.playlistId && user) {
      fetchPlaylistData();
    }
  }, [params.playlistId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f7c82] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Certificate not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#42686d]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-6xl 2xl:max-w-[2560px] mx-auto px-2 sm:px-4">
        <button
          onClick={() => router.back()}
          className="mb-3 sm:mb-4 md:mb-6 flex items-center gap-1.5 sm:gap-2 text-[#4f7c82] hover:text-[#42686d] font-normal sm:font-medium text-xs sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <Certificate
          studentName={certificateData.studentName}
          playlistTitle={certificateData.playlistTitle}
          instructorName={certificateData.instructorName}
          completionDate={certificateData.completionDate}
        />
      </div>
    </div>
  );
}
