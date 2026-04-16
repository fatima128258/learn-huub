"use client";

import Messaging from "@/components/Messaging";

export default function DirectMessages({ onUnreadCountChange }) {
  return <Messaging onUnreadCountChange={onUnreadCountChange} />;
}
