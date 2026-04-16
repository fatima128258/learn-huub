"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function InstructorCV() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const fetchCV = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/instructor/cv?instructorId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setCv(data.cv);
        } else {
          setError(data.message || "Failed to fetch CV");
        }
      } catch (err) {
        setError("Error loading CV");
        console.error("Error fetching CV:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCV();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-6 mt-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c82]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-6 mt-4">
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-6 mt-4">
        <div className="text-center py-8">
          <p className="text-black/70 mb-4">No CV found. Create your CV to showcase your profile.</p>
          <Button
            onClick={() => {
              setNavigating(true);
              router.push("/dashboard/instructor/edit-cv");
            }}
            disabled={navigating}
            className="bg-[#4f7c82] text-white hover:bg-[#3d6166] px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {navigating ? "Loading..." : "Create CV"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-4 sm:p-6 lg:p-8">
          
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold sm:font-bold text-center text-[#4f7c82] border-b pb-2 sm:pb-3 mb-4 sm:mb-6">
            Instructor CV
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            
            {/* Left Column */}
            <div className="w-full sm:w-1/2">
              <div className="flex justify-center sm:justify-start mb-3 sm:mb-4">
                {cv.profileImage ? (
                  <img 
                    src={cv.profileImage} 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shadow-lg" 
                    alt="Profile"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/5 border-4 border-[#4f7c82]/20 flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-black/40" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="mb-2 sm:mb-3">
                <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Name</h4>
                <p className="text-xs sm:text-sm lg:text-base text-black/80 pl-4 sm:pl-0">
                  {user?.name || "Your Name"}
                </p>
              </div>

              <div className="mb-2 sm:mb-3">
                <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Email</h4>
                <p className="text-xs sm:text-sm text-black/70 break-words pl-4 sm:pl-0">
                  {user?.email || "your.email@example.com"}
                </p>
              </div>

              {cv.contact && (
                <div className="mb-2 sm:mb-3">
                  <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Contact</h4>
                  <p className="text-xs sm:text-sm text-black/70 break-words pl-4 sm:pl-0">
                    {cv.contact}
                  </p>
                </div>
              )}

              {cv.address && (
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Address</h4>
                  <p className="text-xs sm:text-sm text-black/70 break-words pl-4 sm:pl-0">
                    {cv.address}
                  </p>
                </div>
              )}

              {cv.skills && cv.skills.split(",").filter(s => s.trim()).length > 0 && (
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1 sm:mb-2">Skills</h3>
                  <ul className="space-y-0.5 sm:space-y-1 list-disc list-inside pl-4 sm:pl-0">
                    {cv.skills.split(",").map((skill, index) => (
                      <li key={index} className="text-xs sm:text-sm text-black/70 break-words">
                        {skill.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="w-full sm:w-1/2">
              {cv.experience && (
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1 sm:mb-2">Experience</h3>
                  <p className="text-xs sm:text-sm text-black/70 break-words pl-4 sm:pl-0">{cv.experience} years</p>
                </div>
              )}

              {cv.about && (
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1 sm:mb-2">About</h3>
                  <p className="text-xs sm:text-sm text-black/70 break-words pl-4 sm:pl-0">{cv.about}</p>
                </div>
              )}

              {cv.education && (
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1 sm:mb-2">Education</h3>
                  <p className="text-xs sm:text-sm text-black/70 break-words pl-4 sm:pl-0">{cv.education}</p>
                </div>
              )}

              {cv.languages && cv.languages.split(",").filter(l => l.trim()).length > 0 && (
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1 sm:mb-2">Languages</h3>
                  <ul className="space-y-0.5 sm:space-y-1 list-disc list-inside pl-4 sm:pl-0">
                    {cv.languages.split(",").map((language, index) => (
                      <li key={index} className="text-xs sm:text-sm text-black/70 break-words">
                        {language.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* Edit Button */}
          <div className="mt-4 sm:mt-6 flex justify-center">
            <Button
              onClick={() => {
                setNavigating(true);
                router.push("/dashboard/instructor/edit-cv");
              }}
              disabled={navigating}
              className="bg-[#4f7c82] text-white hover:bg-[#3d6166] px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {navigating ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit CV
                </>
              )}
            </Button>
          </div>

         
          <div className="mt-3 sm:mt-4 text-center text-[10px] sm:text-xs text-gray-500">
            <p>Last updated: {new Date(cv.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

