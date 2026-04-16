"use client";

import Messaging from "@/components/Messaging";

export default function StudentMessages({ onUnreadCountChange }) {
  return <Messaging onUnreadCountChange={onUnreadCountChange} />;
}

