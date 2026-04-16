"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/Button";
import Toast from "@/components/Toast";

export default function QuizBuilder({ onSave, onClose, initialQuizData = null, quizFormat = null, skipFormatStep = false }) {
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // If skipFormatStep is true and quizFormat is provided, start at step 2 with generated configs
  const [step, setStep] = useState(() => {
    if (skipFormatStep && quizFormat) return 2;
    if (initialQuizData) return 2;
    return 1;
  });
  
  const [mcq4Options, setMcq4Options] = useState(0);
  const [mcq2Options, setMcq2Options] = useState(0);
  const [mcq3Options, setMcq3Options] = useState(0);
  
  const [mcqConfigs, setMcqConfigs] = useState(() => {
    // If we have quizFormat and skipFormatStep, generate configs from format
    if (skipFormatStep && quizFormat) {
      const configs = [];
      
      // Add 2-option MCQs
      for (let i = 0; i < (quizFormat.mcq2Options || 0); i++) {
        configs.push({
          question: "",
          options: Array(2).fill(""),
          correctAnswer: "",
          marks: 1,
          optionCount: 2,
        });
      }
      
      // Add 3-option MCQs
      for (let i = 0; i < (quizFormat.mcq3Options || 0); i++) {
        configs.push({
          question: "",
          options: Array(3).fill(""),
          correctAnswer: "",
          marks: 1,
          optionCount: 3,
        });
      }
      
      // Add 4-option MCQs
      for (let i = 0; i < (quizFormat.mcq4Options || 0); i++) {
        configs.push({
          question: "",
          options: Array(4).fill(""),
          correctAnswer: "",
          marks: 1,
          optionCount: 4,
        });
      }
      
      return configs;
    }
    
    // If we have initialQuizData, use it
    if (initialQuizData?.mcqs) {
      return initialQuizData.mcqs.map((mcq) => ({
        question: mcq.question || "",
        options: mcq.options || [],
        correctAnswer: mcq.correctAnswer || "",
        marks: mcq.marks || 1,
        optionCount: mcq.options?.length || 4,
      }));
    }
    
    return [];
  });

 
  const totalMarks = useMemo(() => {
    return mcqConfigs.reduce((sum, mcq) => {
      const marks = Math.round(parseFloat(mcq.marks)) || 0;
      return sum + marks;
    }, 0);
  }, [mcqConfigs]);

  
  const handleSetupSubmit = (e) => {
    e.preventDefault();
    
    const count2 = parseInt(mcq2Options) || 0;
    const count3 = parseInt(mcq3Options) || 0;
    const count4 = parseInt(mcq4Options) || 0;
    const total = count2 + count3 + count4;
    
    if (total < 1) {
      setToastMessage("Please enter at least 1 MCQ");
      setShowToast(true);
      return;
    }

    const newConfigs = [];
    
    // Add 2-option MCQs
    for (let i = 0; i < count2; i++) {
      newConfigs.push({
        question: "",
        options: Array(2).fill(""),
        correctAnswer: "",
        marks: 1,
        optionCount: 2,
      });
    }
    
    // Add 3-option MCQs
    for (let i = 0; i < count3; i++) {
      newConfigs.push({
        question: "",
        options: Array(3).fill(""),
        correctAnswer: "",
        marks: 1,
        optionCount: 3,
      });
    }
    
    // Add 4-option MCQs
    for (let i = 0; i < count4; i++) {
      newConfigs.push({
        question: "",
        options: Array(4).fill(""),
        correctAnswer: "",
        marks: 1,
        optionCount: 4,
      });
    }
    
    // If editing existing quiz, append new configs to existing ones
    if (initialQuizData?.mcqs && mcqConfigs.length > 0) {
      setMcqConfigs([...mcqConfigs, ...newConfigs]);
    } else {
      setMcqConfigs(newConfigs);
    }
    
    setStep(2);
  };

  
  const handleMcqChange = (index, field, value) => {
    const updated = [...mcqConfigs];
    if (field === "question") {
      updated[index].question = value;
    } else if (field.startsWith("option_")) {
      const optIndex = parseInt(field.split("_")[1]);
      updated[index].options[optIndex] = value;
    } else if (field === "correctAnswer") {
      updated[index].correctAnswer = value;
    } else if (field === "marks") {
      
      const roundedMarks = Math.round(parseFloat(value)) || 0;
      updated[index].marks = roundedMarks > 0 ? roundedMarks : 1;
    }
    setMcqConfigs(updated);
  };

  const handleSave = () => {

    for (let i = 0; i < mcqConfigs.length; i++) {
      const mcq = mcqConfigs[i];
      if (!mcq.question.trim()) {
        setToastMessage(`Please enter question for MCQ ${i + 1}`);
        setShowToast(true);
        return;
      }
      if (mcq.options.some((opt) => !opt.trim())) {
        setToastMessage(`Please fill all options for MCQ ${i + 1}`);
        setShowToast(true);
        return;
      }
      if (!mcq.correctAnswer.trim()) {
        setToastMessage(`Please select correct answer for MCQ ${i + 1}`);
        setShowToast(true);
        return;
      }
      const marksValue = Math.round(parseFloat(mcq.marks)) || 0;
      if (!marksValue || marksValue <= 0) {
        setToastMessage(`Please enter marks (whole number) for MCQ ${i + 1}`);
        setShowToast(true);
        return;
      }
    }

    const calculatedTotalMarks = mcqConfigs.reduce((sum, mcq) => {
      const marks = Math.round(parseFloat(mcq.marks)) || 0;
      return sum + marks;
    }, 0);

    if (calculatedTotalMarks <= 0) {
      setToastMessage("Total marks must be greater than 0. Please enter marks for at least one MCQ.");
      setShowToast(true);
      return;
    }

    const quizData = {
      type: "quiz",
      totalMarks: calculatedTotalMarks, 
      mcqs: mcqConfigs.map((mcq) => ({
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer,
        marks: Math.round(parseFloat(mcq.marks)) || 0, 
      })),
    };

    onSave(quizData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {showToast && toastMessage && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
      
      <div className="max-w-6xl 2xl:max-w-[2560px] mx-auto px-3 sm:px-4 2xl:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-medium sm:font-semibold lg:font-semibold text-gray-900">Create Quiz</h1>
          {/* <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold lg:font-bold text-gray-900">Create Quiz</h1> */}
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 sm:gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          {step === 1 && (
            <form onSubmit={handleSetupSubmit} className="space-y-4 sm:space-y-6">
              

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1.5 sm:mb-2">
                    MCQs with 2 Options 
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={mcq2Options}
                    placeholder="Enter number of MCQs with 2 options"
                    onChange={(e) => setMcq2Options(parseInt(e.target.value) || 0)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1.5 sm:mb-2">
                    MCQs with 3 Options 
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={mcq3Options}
                    placeholder="Enter number of MCQs with 3 options"
                    onChange={(e) => setMcq3Options(parseInt(e.target.value) || 0)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-normal sm:font-medium text-gray-700 mb-1.5 sm:mb-2">
                    MCQs with 4 Options 
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={mcq4Options}
                    placeholder="Enter number of MCQs with 4 options"
                    onChange={(e) => setMcq4Options(parseInt(e.target.value) || 0)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-medium text-gray-700">
                  Total MCQs: <span className="text-[#4f7c82] font-bold">{(mcq2Options || 0) + (mcq3Options || 0) + (mcq4Options || 0)}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {mcq2Options || 0} with 2 options, {mcq3Options || 0} with 3 options, {mcq4Options || 0} with 4 options
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#4f7c82] text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
                  disabled={(mcq2Options || 0) + (mcq3Options || 0) + (mcq4Options || 0) < 1}
                >
                  Generate Format
                </Button>
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5">
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-700">
                  <p className="font-semibold text-sm sm:text-lg mb-1">
                    Total Quiz Marks: <span className="text-[#4f7c82] font-bold">{Math.round(totalMarks)}</span>
                  </p>
                </div>
                {/* <p className="text-sm text-gray-600">
                  Fill in the questions, options, and marks for {mcqConfigs.length} MCQ{mcqConfigs.length !== 1 ? "s" : ""}:
                </p> */}
              </div>

              {mcqConfigs.map((mcq, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">
                       Question: {index + 1}
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <label className="text-xs text-gray-600">Marks:</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={Math.round(mcq.marks) || 1}
                            onChange={(e) => handleMcqChange(index, "marks", e.target.value)}
                            required
                            className="w-16 sm:w-20 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 text-xs sm:text-sm focus:ring-[#3d6166]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = mcqConfigs.filter((_, i) => i !== index);
                            setMcqConfigs(updated);
                            setToastMessage(`Question ${index + 1} deleted`);
                            setShowToast(true);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                          title="Delete this question"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={mcq.question}
                      onChange={(e) => handleMcqChange(index, "question", e.target.value)}
                      placeholder="Enter your question here..."
                      required
                      className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3d6166] text-xs sm:text-sm"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      Options ({mcq.optionCount} options) 
                    </label>
                    {mcq.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="radio"
                          name={`correct_${index}`}
                          value={optIndex}
                          checked={mcq.correctAnswer === optIndex.toString()}
                          onChange={(e) =>
                            handleMcqChange(index, "correctAnswer", e.target.value)
                          }
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleMcqChange(index, `option_${optIndex}`, e.target.value)
                          }
                          placeholder={`Option ${optIndex + 1}`}
                          required
                          className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3d6166] text-xs sm:text-sm"
                        />
                        <span className="text-xs text-gray-500"></span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-3 sm:pt-4 border-t space-y-2">
                {/* First row: Save Quiz and Cancel */}
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-[#4f7c82] text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    Save Quiz
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="secondary"
                    className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    Cancel
                  </Button>
                </div>
                
                {/* Second row: Back to Setup (full width on mobile) */}
                {initialQuizData ? (
                  <Button
                    onClick={() => {
                      // Reset format inputs when going back
                      setMcq2Options(0);
                      setMcq3Options(0);
                      setMcq4Options(0);
                      setStep(1);
                    }}
                    className="w-full bg-[#4f7c82] text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    Generate Format
                  </Button>
                ) : (
                  <Button
                    onClick={() => setStep(1)}
                    className="w-full bg-[#4f7c82] text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    ← Back to Setup
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}