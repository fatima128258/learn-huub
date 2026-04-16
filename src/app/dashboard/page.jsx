"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Redirect based on role
    if (user.role === "admin") {
      router.push("/dashboard/admin");
    } else if (user.role === "instructor") {
      router.push("/dashboard/instructor");
    } else if (user.role === "student") {
      router.push("/dashboard/student");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}