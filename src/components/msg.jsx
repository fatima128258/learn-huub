"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import MessageModal from "@/components/MessageModal";

export default function Insmsg({ instructor }) {
  const { user } = useSelector((state) => state.auth);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  if (!user || user.role !== "student" || !instructor) {
    return null;
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation(); // prevent card click
          setIsMessageModalOpen(true);
        }}
        className="flex items-center gap-2 px-3 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition-colors text-sm font-medium"
        title="Send message to instructor"
      >
        <span className="text-base">💬</span>
        <span>Message</span>
      </button>

      <MessageModal
        open={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        otherUserId={instructor._id}
        otherUserName={instructor.name}
        otherUserRole="instructor"
      />
    </>
  );
}
