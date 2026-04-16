"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuizBuilder from "@/components/QuizBuilder";

export default function AddPlaylistQuizPage() {
  const router = useRouter();
  const [quizData, setQuizData] = useState(null);
  const [quizFormat, setQuizFormat] = useState(null);

  // Load quiz format or existing quiz data from localStorage
  useEffect(() => {
    // Check for existing quiz data first (when editing)
    const existingQuiz = localStorage.getItem("existingQuizData");
    if (existingQuiz) {
      try {
        const parsedQuiz = JSON.parse(existingQuiz);
        setQuizData(parsedQuiz);
        localStorage.removeItem("existingQuizData");
      } catch (error) {
        console.error("Error parsing existing quiz data:", error);
      }
    } else {
      // Otherwise check for new quiz format
      const savedFormat = localStorage.getItem("quizFormat");
      if (savedFormat) {
        try {
          setQuizFormat(JSON.parse(savedFormat));
        } catch (error) {
          console.error("Error parsing quiz format:", error);
        }
      }
    }
  }, []);

  const handleQuizSave = (savedQuizData) => {
    setQuizData(savedQuizData);
    // Save to localStorage
    localStorage.setItem("tempQuizData", JSON.stringify(savedQuizData));
    // Clear format
    localStorage.removeItem("quizFormat");
    // Navigate back
    router.back();
  };

  // If no format data and no existing quiz, redirect back
  if (!quizFormat && !quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading quiz...</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizBuilder
        onSave={handleQuizSave}
        onClose={() => router.back()}
        initialQuizData={quizData}
        quizFormat={quizFormat}
        skipFormatStep={!!quizFormat}
      />
    </div>
  );
}
