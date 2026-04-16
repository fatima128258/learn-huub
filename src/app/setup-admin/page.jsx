"use client";

import { useState } from "react";

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFixAdmin = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/fix-admin", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}\n\nAdmin Credentials:\nEmail: Admin@learnhub.com\nPassword: Admin123`);
      } else {
        setError(data.message || "Failed to fix admin");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Admin Setup
        </h1>

        <p className="text-gray-600 text-center mb-6">
          Click the button below to create/reset the admin account with new credentials.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">New Admin Credentials:</h3>
          <p className="text-sm text-blue-800">
            <strong>Email:</strong> Admin@learnhub.com
          </p>
          <p className="text-sm text-blue-800">
            <strong>Password:</strong> Admin123
          </p>
        </div>

        <button
          onClick={handleFixAdmin}
          disabled={loading}
          className="w-full py-3 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Setting up..." : "Setup Admin Account"}
        </button>

        {message && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg whitespace-pre-line">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-[#4f7c82] font-semibold hover:underline"
            >
              Go to Login →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
