"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { createPortal } from "react-dom";


export default function Submissions() {
  const { user } = useSelector((state) => state.auth);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grading, setGrading] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackToView, setFeedbackToView] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  useEffect(() => {
  if (selectedSubmission) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [selectedSubmission]);

  const fetchSubmissions = async () => {
    if (!user?.id && !user?._id) {
      console.log("No user ID found");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const instructorId = user?.id || user?._id;
      console.log("Fetching submissions for instructor:", instructorId);
      
      const response = await axios.get(
        `/api/instructor/submissions?instructorId=${instructorId}`
      );

      console.log("Submissions response:", response.data);

      if (response.data.success) {
        setSubmissions(response.data.submissions || []);
      } else {
        setError(response.data.message || "Failed to fetch submissions");
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || err.message || "Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submission) => {
    if (!user?.id && !user?._id) return;

    const grade = parseFloat(gradeInput);
    if (isNaN(grade) || grade < 0) {
      return;
    }

    
    if (submission.totalMarks) {
      if (grade > submission.totalMarks) {
        return;
      }
    } else {
     
      if (grade > 100) {
        return;
      }
    }

//     useEffect(() => {
//   if (selectedSubmission) {
//     document.body.style.overflow = "hidden";
//   } else {
//     document.body.style.overflow = "auto";
//   }

//   return () => {
//     document.body.style.overflow = "auto";
//   };
// }, [selectedSubmission]);



    setGrading({ ...grading, [submission.id]: true });
    try {
      const instructorId = user?.id || user?._id;
      const response = await axios.post("/api/instructor/grade-submission", {
        instructorId,
        studentId: submission.student.id,
        playlistId: submission.playlist.id,
        contentOrder: submission.contentOrder,
        type: submission.type,
        grade: grade,
        feedback: feedbackInput || null,
      });

      if (response.data.success) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submission.id
              ? {
                ...sub,
                grade: grade,
                gradedAt: new Date().toISOString(),
                feedback: feedbackInput || null,
              }
              : sub
          )
        );
        setSelectedSubmission(null);
        setGradeInput("");
        setFeedbackInput("");
      }
    } catch (err) {
      console.error("Error grading submission:", err);
    } finally {
      setGrading({ ...grading, [submission.id]: false });
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (activeTab === "ungraded_lab") return sub.type === "lab" && sub.grade === null;
    if (activeTab === "ungraded_activity") return sub.type === "activity" && sub.grade === null;
    if (activeTab === "graded_lab") return sub.type === "lab" && sub.grade !== null;
    if (activeTab === "graded_activity") return sub.type === "activity" && sub.grade !== null;
    return true;
  });

  const getGradeColor = (grade) => {
    return "text-black";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 tracking-tight border border-red-200 rounded-lg p-6 m-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to fetch submissions</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-gray-600 mb-4">
          This could be due to a network issue or database connection problem. Please try again.
        </p>
        <button
          onClick={fetchSubmissions}
          className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
     
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <h2 className="text-2xl font-semibold text-gray-800">Student Submissions</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-700">Total Submissions</p>
          <p className="text-2xl font-semibold ">{submissions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-700">Labs</p>
          <p className="text-2xl font-semibold ">
            {submissions.filter((s) => s.type === "lab").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-700">Activities</p>
          <p className="text-2xl font-semibold ">
            {submissions.filter((s) => s.type === "activity").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-700">Ungraded</p>
          <p className="text-2xl font-semibold ">
            {submissions.filter((s) => s.grade === null).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: "all", label: "All" },
              { id: "ungraded_lab", label: "Ungraded Lab" },
              { id: "ungraded_activity", label: "Ungraded Activity" },
              { id: "graded_lab", label: "Graded Lab" },
              { id: "graded_activity", label: "Graded Activity" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No submissions found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Playlist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.playlist.title}
                        </div>
                        <div className="">
                          <span className={`inline-block  rounded text-xs font-semibold ${submission.type === "lab" ? "text-[#4f7c82]" : "text-[#4f7c82]"}`}>
                            {submission.type === "lab" ? "Lab" : "Activity"}
                          </span>
                        </div>
                        {/* {submission.totalMarks && (
                          <div className="text-xs text-gray-900">
                            Total Marks: {submission.totalMarks}
                          </div>
                        )} */}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{submission.student.name}</div>
                        <div className="text-xs text-gray-500">{submission.student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(submission.submittedAt)}</div>
                        {submission.gradedAt && (
                          <div className="text-xs text-gray-500">
                            Graded: {formatDate(submission.gradedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.grade !== null ? (
                          <div>
                            <span
                              className={`px-3 py-1 tracking-tight text-sm font-semibold ${getGradeColor(
                                submission.grade
                              )} `}
                            >
                              {submission.grade}
                              {submission.totalMarks ? ` / ${submission.totalMarks}` : "%"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not graded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.grade === null ? (
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setGradeInput("");
                              setFeedbackInput("");
                            }}
                            className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm whitespace-nowrap"
                          >
                            Grade
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setGradeInput(submission.grade?.toString() || "");
                              setFeedbackInput(submission.feedback || "");
                            }}
                            className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm whitespace-nowrap"
                          >
                            Edit Grade
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <a
                            href={submission.uploadedFilePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4f7c82] hover:underline text-sm font-medium cursor-pointer"
                          >
                            View File →
                          </a>
                          {submission.feedback && (
                            <button
                              onClick={() => {
                                setFeedbackToView(submission.feedback);
                                setShowFeedbackModal(true);
                              }}
                              className="text-[#4f7c82] hover:underline text-sm font-medium cursor-pointer"
                            >
                             View Feedback
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div key={submission.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
                    {/* Playlist Title */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Playlist</p>
                      <p className="text-sm font-medium text-gray-900">{submission.playlist.title}</p>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${submission.type === "lab" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                          {submission.type === "lab" ? "Lab" : "Activity"}
                        </span>
                      </div>
                      {submission.totalMarks && (
                        <p className="text-xs text-gray-500 mt-1">Total Marks: {submission.totalMarks}</p>
                      )}
                    </div>

                    {/* Student Info */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Student</p>
                      <p className="text-sm text-gray-900">{submission.student.name}</p>
                      <p className="text-xs text-gray-500">{submission.student.email}</p>
                    </div>

                    {/* Submission Date */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Submitted</p>
                      <p className="text-sm text-gray-900">{formatDate(submission.submittedAt)}</p>
                      {submission.gradedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Graded: {formatDate(submission.gradedAt)}
                        </p>
                      )}
                    </div>

                    {/* Grade */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Grade</p>
                      {submission.grade !== null ? (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(
                            submission.grade
                          )} bg-gray-100`}
                        >
                          {submission.grade}
                          {submission.totalMarks ? ` / ${submission.totalMarks}` : "%"}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Not graded</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      {submission.grade === null ? (
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setGradeInput("");
                            setFeedbackInput("");
                          }}
                          className="w-full px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm font-medium"
                        >
                          Grade Submission
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setGradeInput(submission.grade?.toString() || "");
                            setFeedbackInput(submission.feedback || "");
                          }}
                          className="w-full px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm font-medium"
                        >
                          Edit Grade
                        </button>
                      )}
                      
                      <div className="flex gap-2">
                        <a
                          href={submission.uploadedFilePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-4 py-2 border border-[#4f7c82] text-[#4f7c82] rounded-lg hover:bg-[#4f7c82] hover:text-white transition-colors text-sm font-medium"
                        >
                          View File
                        </a>
                        {submission.feedback && (
                          <button
                            onClick={() => {
                              setFeedbackToView(submission.feedback);
                              setShowFeedbackModal(true);
                            }}
                            className="flex-1 px-4 py-2 border border-[#4f7c82] text-[#4f7c82] rounded-lg hover:bg-[#4f7c82] hover:text-white transition-colors text-sm font-medium"
                          >
                            View Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedSubmission && (
         createPortal(
        <div className="fixed inset-0 z-[100000] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"       
               onClick={() => {
                setSelectedSubmission(null);
                setGradeInput("");
                setFeedbackInput(""); }}
          />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        
            <div className="bg-white p-4 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold">
                Grade {selectedSubmission.type === "lab" ? "Lab" : "Activity"}
              </h3>
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setGradeInput("");
                  setFeedbackInput("");
                }}
                className="text-2xl hover:text-gray-600"
              >
                ✕
              </button>
            </div>

          
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
           
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade {selectedSubmission.totalMarks ? `(0-${selectedSubmission.totalMarks})` : "(0-100)"} 
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubmission.totalMarks || 100}
                  step="0.01"
                  value={gradeInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && selectedSubmission.totalMarks) {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue > selectedSubmission.totalMarks) {
                        return;
                      }
                    }
                    setGradeInput(value);
                  }}
                  onBlur={(e) => {
                    if (selectedSubmission.totalMarks) {
                      const numValue = parseFloat(e.target.value);
                      if (!isNaN(numValue) && numValue > selectedSubmission.totalMarks) {
                        setGradeInput(selectedSubmission.totalMarks.toString());
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  placeholder={selectedSubmission.totalMarks ? `Enter grade (0-${selectedSubmission.totalMarks})` : "Enter grade (0-100)"}
                />
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] resize-none"
                  placeholder="Enter feedback ..."
                />
              </div>
            </div>

       
            <div className="p-6  bg-white flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setGradeInput("");
                  setFeedbackInput("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGrade(selectedSubmission)}
                disabled={grading[selectedSubmission.id]}
                className="flex-1 px-4 py-3 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {grading[selectedSubmission.id] ? "Submitting..." : "Submit Grade"}
              </button>
            </div>
          </div>
        </div>,
        document.body)
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative z-[10000]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Instructor Feedback</h3>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackToView("");
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{feedbackToView}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackToView("");
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}































// "use client";

// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import axios from "axios";

// export default function Submissions() {
//   const { user } = useSelector((state) => state.auth);
//   const [submissions, setSubmissions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [grading, setGrading] = useState({});
//   const [selectedSubmission, setSelectedSubmission] = useState(null);
//   const [gradeInput, setGradeInput] = useState("");
//   const [feedbackInput, setFeedbackInput] = useState("");
//   const [filter, setFilter] = useState("all");
//   const [activeTab, setActiveTab] = useState("all");
//   const [showFeedbackModal, setShowFeedbackModal] = useState(false);
//   const [feedbackToView, setFeedbackToView] = useState("");

//   useEffect(() => {
//     fetchSubmissions();
//   }, [user]);

//   const fetchSubmissions = async () => {
//     if (!user?.id && !user?._id) {
//       console.log("No user ID found");
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const instructorId = user?.id || user?._id;
//       console.log("Fetching submissions for instructor:", instructorId);
      
//       const response = await axios.get(
//         `/api/instructor/submissions?instructorId=${instructorId}`
//       );

//       console.log("Submissions response:", response.data);

//       if (response.data.success) {
//         setSubmissions(response.data.submissions || []);
//       } else {
//         setError(response.data.message || "Failed to fetch submissions");
//       }
//     } catch (err) {
//       console.error("Error fetching submissions:", err);
//       console.error("Error response:", err.response?.data);
//       setError(err.response?.data?.message || err.message || "Failed to fetch submissions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGrade = async (submission) => {
//     if (!user?.id && !user?._id) return;

//     const grade = parseFloat(gradeInput);
//     if (isNaN(grade) || grade < 0) {
//       alert("Please enter a valid grade (must be 0 or greater)");
//       return;
//     }

    
//     if (submission.totalMarks) {
//       if (grade > submission.totalMarks) {
//         alert(`Grade cannot exceed total marks (${submission.totalMarks})`);
//         return;
//       }
//     } else {
     
//       if (grade > 100) {
//         alert("Please enter a valid grade between 0 and 100");
//         return;
//       }
//     }

//     setGrading({ ...grading, [submission.id]: true });
//     try {
//       const instructorId = user?.id || user?._id;
//       const response = await axios.post("/api/instructor/grade-submission", {
//         instructorId,
//         studentId: submission.student.id,
//         playlistId: submission.playlist.id,
//         contentOrder: submission.contentOrder,
//         type: submission.type,
//         grade: grade,
//         feedback: feedbackInput || null,
//       });

//       if (response.data.success) {
//         setSubmissions((prev) =>
//           prev.map((sub) =>
//             sub.id === submission.id
//               ? {
//                 ...sub,
//                 grade: grade,
//                 gradedAt: new Date().toISOString(),
//                 feedback: feedbackInput || null,
//               }
//               : sub
//           )
//         );
//         setSelectedSubmission(null);
//         setGradeInput("");
//         setFeedbackInput("");
//         alert("Submission graded successfully!");
//       } else {
//         alert("Failed to grade submission");
//       }
//     } catch (err) {
//       console.error("Error grading submission:", err);
//       alert(err.response?.data?.message || "Failed to grade submission");
//     } finally {
//       setGrading({ ...grading, [submission.id]: false });
//     }
//   };

//   const filteredSubmissions = submissions.filter((sub) => {
//     if (activeTab === "pending") return sub.grade === null;
//     if (activeTab === "approved") return sub.grade !== null;
//     return true;
//   });

//   const getGradeColor = (grade) => {
//     return "text-black";
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <p className="text-gray-600">Loading submissions...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-50 tracking-tight border border-red-200 rounded-lg p-6 m-4">
//         <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to fetch submissions</h3>
//         <p className="text-red-600 mb-4">{error}</p>
//         <p className="text-sm text-gray-600 mb-4">
//           This could be due to a network issue or database connection problem. Please try again.
//         </p>
//         <button
//           onClick={fetchSubmissions}
//           className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468]"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 pt-20 md:pt-0">
     
//       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
//         <h2 className="text-2xl font-semibold text-gray-800">Student Submissions</h2>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-sm text-gray-700">Total Submissions</p>
//           <p className="text-2xl font-semibold ">{submissions.length}</p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-sm text-gray-700">Labs</p>
//           <p className="text-2xl font-semibold ">
//             {submissions.filter((s) => s.type === "lab").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-sm text-gray-700">Activities</p>
//           <p className="text-2xl font-semibold ">
//             {submissions.filter((s) => s.type === "activity").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-sm text-gray-700">Ungraded</p>
//           <p className="text-2xl font-semibold ">
//             {submissions.filter((s) => s.grade === null).length}
//           </p>
//         </div>
//       </div>

//       <div className="bg-white rounded-lg shadow-md">
//         <div className="p-4 border-b border-gray-200">
//           <div className="flex gap-2 overflow-x-auto">
//             {[
//               { id: "all", label: "All" },
//               { id: "pending", label: "Pending" },
//               { id: "approved", label: "Approved" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
//                   activeTab === tab.id
//                     ? "text-[#4f7c82] border-b-2 border-[#4f7c82]"
//                     : "text-gray-600 hover:text-gray-800"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="p-6">
//           {filteredSubmissions.length === 0 ? (
//             <div className="text-center py-8">
//               <p className="text-gray-600">No submissions found</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//               <thead className="bg-gray-50 border-b border-gray-200">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Playlist
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Student
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Submitted
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Grade
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Action
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     File
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredSubmissions.map((submission) => (
//                   <tr key={submission.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4">
//                       <div className="text-sm font-medium text-gray-900">
//                         {submission.playlist.title}
//                       </div>
//                       {submission.totalMarks && (
//                         <div className="text-xs text-gray-500">
//                           Total Marks: {submission.totalMarks}
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="text-sm text-gray-900">{submission.student.name}</div>
//                       <div className="text-xs text-gray-500">{submission.student.email}</div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900">{formatDate(submission.submittedAt)}</div>
//                       {submission.gradedAt && (
//                         <div className="text-xs text-gray-500">
//                           Graded: {formatDate(submission.gradedAt)}
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {submission.grade !== null ? (
//                         <div>
//                           <span
//                             className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(
//                               submission.grade
//                             )} bg-gray-100`}
//                           >
//                             {submission.grade}
//                             {submission.totalMarks ? ` / ${submission.totalMarks}` : "%"}
//                           </span>
//                         </div>
//                       ) : (
//                         <span className="text-sm text-gray-500">Not graded</span>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {submission.grade === null ? (
//                         <button
//                           onClick={() => {
//                             setSelectedSubmission(submission);
//                             setGradeInput("");
//                             setFeedbackInput("");
//                           }}
//                           className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm whitespace-nowrap"
//                         >
//                           Grade
//                         </button>
//                       ) : (
//                         <button
//                           onClick={() => {
//                             setSelectedSubmission(submission);
//                             setGradeInput(submission.grade?.toString() || "");
//                             setFeedbackInput(submission.feedback || "");
//                           }}
//                           className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm whitespace-nowrap"
//                         >
//                           Edit Grade
//                         </button>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex gap-2">
//                         <a
//                           href={submission.uploadedFilePath}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-[#4f7c82] hover:underline text-sm font-medium cursor-pointer"
//                         >
//                           View File →
//                         </a>
//                         {submission.feedback && (
//                           <button
//                             onClick={() => {
//                               setFeedbackToView(submission.feedback);
//                               setShowFeedbackModal(true);
//                             }}
//                             className="text-[#4f7c82] hover:underline text-sm font-medium cursor-pointer"
//                           >
//                            View Feedback
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {selectedSubmission && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
//             <h3 className="text-xl font-semibold text-gray-800 mb-4">
//               Grade {selectedSubmission.type === "lab" ? "Lab" : "Activity"}
//             </h3>

//             <div className="mb-4">
//               <p className="text-sm text-gray-600 mb-1">
//                 <strong>Playlist:</strong> {selectedSubmission.playlist.title}
//               </p>
//               <p className="text-sm text-gray-600 mb-4">
//                 <strong>Student:</strong> {selectedSubmission.student.name}
//               </p>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Grade {selectedSubmission.totalMarks ? `(0-${selectedSubmission.totalMarks})` : "(0-100)"}
//               </label>
//               <input
//                 type="number"
//                 min="0"
//                 max={selectedSubmission.totalMarks || 100}
//                 step="0.01"
//                 value={gradeInput}
//                 onChange={(e) => {
//                   const value = e.target.value;
//                   if (value && selectedSubmission.totalMarks) {
//                     const numValue = parseFloat(value);
//                     if (!isNaN(numValue) && numValue > selectedSubmission.totalMarks) {
//                       return; 
//                     }
//                   }
//                   setGradeInput(value);
//                 }}
//                 onBlur={(e) => {
//                   if (selectedSubmission.totalMarks) {
//                     const numValue = parseFloat(e.target.value);
//                     if (!isNaN(numValue) && numValue > selectedSubmission.totalMarks) {
//                       setGradeInput(selectedSubmission.totalMarks.toString());
//                     }
//                   }
//                 }}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//                 placeholder={selectedSubmission.totalMarks ? `Enter grade (0-${selectedSubmission.totalMarks})` : "Enter grade (0-100)"}
//               />
//               {selectedSubmission.totalMarks && (
//                 <p className="text-xs text-gray-500 mt-1">
//                   Total Marks: {selectedSubmission.totalMarks}
//                 </p>
//               )}
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Feedback (Optional)
//               </label>
//               <textarea
//                 value={feedbackInput}
//                 onChange={(e) => setFeedbackInput(e.target.value)}
//                 rows="4"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//                 placeholder="Enter feedback for the student..."
//               />
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => {
//                   setSelectedSubmission(null);
//                   setGradeInput("");
//                   setFeedbackInput("");
//                 }}
//                 className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleGrade(selectedSubmission)}
//                 disabled={grading[selectedSubmission.id]}
//                 className="flex-1 px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {grading[selectedSubmission.id] ? "Grading..." : "Submit Grade"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showFeedbackModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-bold text-gray-800">Instructor Feedback</h3>
//                 <button
//                   onClick={() => {
//                     setShowFeedbackModal(false);
//                     setFeedbackToView("");
//                   }}
//                   className="text-gray-500 hover:text-gray-700 text-2xl"
//                 >
//                   ×
//                 </button>
//               </div>
//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//                 <p className="text-gray-700 whitespace-pre-wrap">{feedbackToView}</p>
//               </div>
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={() => {
//                     setShowFeedbackModal(false);
//                     setFeedbackToView("");
//                   }}
//                   className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

















// "use client";

// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import axios from "axios";
// import { createPortal } from "react-dom";


// export default function Submissions() {
//   const { user } = useSelector((state) => state.auth);
//   const [submissions, setSubmissions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [grading, setGrading] = useState({});
//   const [selectedSubmission, setSelectedSubmission] = useState(null);
//   const [gradeInput, setGradeInput] = useState("");
//   const [feedbackInput, setFeedbackInput] = useState("");
//   const [filter, setFilter] = useState("all");
//   const [activeTab, setActiveTab] = useState("all");
//   const [showFeedbackModal, setShowFeedbackModal] = useState(false);
//   const [feedbackToView, setFeedbackToView] = useState("");

//   useEffect(() => {
//     fetchSubmissions();
//   }, [user]);

//   useEffect(() => {
//   if (selectedSubmission) {
//     document.body.style.overflow = "hidden";
//   } else {
//     document.body.style.overflow = "auto";
//   }

//   return () => {
//     document.body.style.overflow = "auto";
//   };
// }, [selectedSubmission]);

//   const fetchSubmissions = async () => {
//     if (!user?.id && !user?._id) {
//       console.log("No user ID found");
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const instructorId = user?.id || user?._id;
//       console.log("Fetching submissions for instructor:", instructorId);
      
//       const response = await axios.get(
//         `/api/instructor/submissions?instructorId=${instructorId}`
//       );

//       console.log("Submissions response:", response.data);

//       if (response.data.success) {
//         setSubmissions(response.data.submissions || []);
//       } else {
//         setError(response.data.message || "Failed to fetch submissions");
//       }
//     } catch (err) {
//       console.error("Error fetching submissions:", err);
//       console.error("Error response:", err.response?.data);
//       setError(err.response?.data?.message || err.message || "Failed to fetch submissions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGrade = async (submission) => {
//     if (!user?.id && !user?._id) return;

//     const grade = parseFloat(gradeInput);
//     if (isNaN(grade) || grade < 0) {
//       return;
//     }

    
//     if (submission.totalMarks) {
//       if (grade > submission.totalMarks) {
//         return;
//       }
//     } else {
     
//       if (grade > 100) {
//         return;
//       }
//     }

// //     useEffect(() => {
// //   if (selectedSubmission) {
// //     document.body.style.overflow = "hidden";
// //   } else {
// //     document.body.style.overflow = "auto";
// //   }

// //   return () => {
// //     document.body.style.overflow = "auto";
// //   };
// // }, [selectedSubmission]);



//     setGrading({ ...grading, [submission.id]: true });
//     try {
//       const instructorId = user?.id || user?._id;
//       const response = await axios.post("/api/instructor/grade-submission", {
//         instructorId,
//         studentId: submission.student.id,
//         playlistId: submission.playlist.id,
//         contentOrder: submission.contentOrder,
//         type: submission.type,
//         grade: grade,
//         feedback: feedbackInput || null,
//       });

//       if (response.data.success) {
//         setSubmissions((prev) =>
//           prev.map((sub) =>
//             sub.id === submission.id
//               ? {
//                 ...sub,
//                 grade: grade,
//                 gradedAt: new Date().toISOString(),
//                 feedback: feedbackInput || null,
//               }
//               : sub
//           )
//         );
//         setSelectedSubmission(null);
//         setGradeInput("");
//         setFeedbackInput("");
//       }
//     } catch (err) {
//       console.error("Error grading submission:", err);
//     } finally {
//       setGrading({ ...grading, [submission.id]: false });
//     }
//   };

//   const filteredSubmissions = submissions.filter((sub) => {
//     if (activeTab === "ungraded_lab") return sub.type === "lab" && sub.grade === null;
//     if (activeTab === "ungraded_activity") return sub.type === "activity" && sub.grade === null;
//     if (activeTab === "graded_lab") return sub.type === "lab" && sub.grade !== null;
//     if (activeTab === "graded_activity") return sub.type === "activity" && sub.grade !== null;
//     return true;
//   });

//   const getGradeColor = (grade) => {
//     return "text-black";
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <p className="text-gray-600">Loading submissions...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-50 tracking-tight border border-red-200 rounded-lg p-6 m-4">
//         <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to fetch submissions</h3>
//         <p className="text-red-600 mb-4">{error}</p>
//         <p className="text-sm text-gray-600 mb-4">
//           This could be due to a network issue or database connection problem. Please try again.
//         </p>
//         <button
//           onClick={fetchSubmissions}
//           className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468]"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
     
//       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
//         <h2 className="text-lg sm:text-xl lg:text-xl font-medium sm:font-semibold text-gray-800">Student Submissions</h2>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-xs sm:text-sm text-gray-700">Total Submissions</p>
//           <p className="text-xl sm:text-2xl font-medium sm:font-semibold">{submissions.length}</p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-xs sm:text-sm text-gray-700">Labs</p>
//           <p className="text-xl sm:text-2xl font-medium sm:font-semibold">
//             {submissions.filter((s) => s.type === "lab").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-xs sm:text-sm text-gray-700">Activities</p>
//           <p className="text-xl sm:text-2xl font-medium sm:font-semibold">
//             {submissions.filter((s) => s.type === "activity").length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <p className="text-xs sm:text-sm text-gray-700">Ungraded</p>
//           <p className="text-xl sm:text-2xl font-medium sm:font-semibold">
//             {submissions.filter((s) => s.grade === null).length}
//           </p>
//         </div>
//       </div>

//       <div className="bg-white rounded-lg shadow-md">
//         <div className="p-3 sm:p-4 border-b border-gray-200">
//           <div className="flex flex-wrap gap-2 overflow-x-auto">
//             {[
//               { id: "all", label: "All" },
//               { id: "ungraded_lab", label: "Ungraded Lab" },
//               { id: "ungraded_activity", label: "Ungraded Activity" },
//               { id: "graded_lab", label: "Graded Lab" },
//               { id: "graded_activity", label: "Graded Activity" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-normal sm:font-medium transition-colors whitespace-nowrap rounded-lg sm:rounded-none ${
//                   activeTab === tab.id
//                     ? "bg-[#4f7c82] text-white sm:bg-transparent sm:text-[#4f7c82] sm:border-b-2 sm:border-[#4f7c82]"
//                     : "bg-gray-100 text-gray-700 sm:bg-transparent sm:text-gray-600 hover:bg-gray-200 sm:hover:bg-transparent sm:hover:text-gray-800"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="p-4 sm:p-6">
//           {filteredSubmissions.length === 0 ? (
//             <div className="text-center py-8">
//               <p className="text-gray-600">No submissions found</p>
//             </div>
//           ) : (
//             <>
//               {/* Desktop Table View */}
//               <div className="hidden lg:block overflow-x-auto">
//                 <table className="w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Playlist
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Student
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Submitted
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Grade
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Action
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       File
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredSubmissions.map((submission) => (
//                     <tr key={submission.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4">
//                         <div className="text-sm font-medium text-gray-900">
//                           {submission.playlist.title}
//                         </div>
//                         <div className="">
//                           <span className={`inline-block  rounded text-xs font-semibold ${submission.type === "lab" ? "text-[#4f7c82]" : "text-[#4f7c82]"}`}>
//                             {submission.type === "lab" ? "Lab" : "Activity"}
//                           </span>
//                         </div>
//                         {/* {submission.totalMarks && (
//                           <div className="text-xs text-gray-900">
//                             Total Marks: {submission.totalMarks}
//                           </div>
//                         )} */}
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900">{submission.student.name}</div>
//                         <div className="text-xs text-gray-500">{submission.student.email}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">{formatDate(submission.submittedAt)}</div>
//                         {submission.gradedAt && (
//                           <div className="text-xs text-gray-500">
//                             Graded: {formatDate(submission.gradedAt)}
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {submission.grade !== null ? (
//                           <div>
//                             <span
//                               className={`px-3 py-1 tracking-tight text-sm font-semibold ${getGradeColor(
//                                 submission.grade
//                               )} `}
//                             >
//                               {submission.grade}
//                               {submission.totalMarks ? ` / ${submission.totalMarks}` : "%"}
//                             </span>
//                           </div>
//                         ) : (
//                           <span className="text-sm text-gray-500">Not graded</span>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {submission.grade === null ? (
//                           <button
//                             onClick={() => {
//                               setSelectedSubmission(submission);
//                               setGradeInput("");
//                               setFeedbackInput("");
//                             }}
//                             className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm whitespace-nowrap"
//                           >
//                             Grade
//                           </button>
//                         ) : (
//                           <button
//                             onClick={() => {
//                               setSelectedSubmission(submission);
//                               setGradeInput(submission.grade?.toString() || "");
//                               setFeedbackInput(submission.feedback || "");
//                             }}
//                             className="px-4 py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-sm whitespace-nowrap"
//                           >
//                             Edit Grade
//                           </button>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex gap-2">
//                           <a
//                             href={submission.uploadedFilePath}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-[#4f7c82] hover:underline text-sm font-medium cursor-pointer"
//                           >
//                             View File →
//                           </a>
//                           {submission.feedback && (
//                             <button
//                               onClick={() => {
//                                 setFeedbackToView(submission.feedback);
//                                 setShowFeedbackModal(true);
//                               }}
//                               className="text-[#4f7c82] hover:underline text-sm font-medium cursor-pointer"
//                             >
//                              View Feedback
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               </div>

//               {/* Mobile/Tablet Card View */}
//               <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
//                 {filteredSubmissions.map((submission) => (
//                   <div key={submission.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 space-y-2">
//                     {/* Playlist Title */}
//                     <div className="space-y-1">
//                       <div className="flex items-start gap-2">
//                         <span className="text-xs font-semibold text-black uppercase whitespace-nowrap">Playlist:</span>
//                         <p className="text-xs sm:text-sm text-gray-900 flex-1 text-right break-words">{submission.playlist.title}</p>
//                       </div>
//                       <div className="flex items-start gap-2">
//                         <span className="text-xs font-semibold text-black uppercase whitespace-nowrap">Type:</span>
//                         <p className="text-xs sm:text-sm text-[#4f7c82] flex-1 text-right">
//                           {submission.type === "lab" ? "Lab" : "Activity"}
//                           {submission.totalMarks && ` • Total Marks: ${submission.totalMarks}`}
//                         </p>
//                       </div>
//                     </div>

//                     {/* Student Info */}
//                     <div className="space-y-1 pt-2 border-t border-gray-100">
//                       <div className="flex items-start gap-2">
//                         <span className="text-xs font-semibold text-black uppercase whitespace-nowrap">Student:</span>
//                         <p className="text-xs sm:text-sm text-gray-900 flex-1 text-right">{submission.student.name}</p>
//                       </div>
//                       <div className="flex items-start gap-2">
//                         <span className="text-xs font-semibold text-black uppercase whitespace-nowrap">Email:</span>
//                         <p className="text-xs sm:text-sm text-gray-600 flex-1 text-right break-words">{submission.student.email}</p>
//                       </div>
//                     </div>

//                     {/* Submission Date */}
//                     <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
//                       <span className="text-xs font-semibold text-black uppercase whitespace-nowrap">Submitted:</span>
//                       <div className="flex-1 text-right">
//                         <p className="text-xs sm:text-sm text-gray-900">{formatDate(submission.submittedAt)}</p>
//                         {submission.gradedAt && (
//                           <p className="text-xs text-gray-500 mt-0.5">
//                             Graded: {formatDate(submission.gradedAt)}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Grade */}
//                     <div className="flex items-start gap-2">
//                       <span className="text-xs font-semibold text-black uppercase whitespace-nowrap">Grade:</span>
//                       <div className="flex-1 text-right">
//                         {submission.grade !== null ? (
//                           <span className="text-xs sm:text-sm font-medium text-gray-900">
//                             {submission.grade}
//                             {submission.totalMarks ? ` / ${submission.totalMarks}` : "%"}
//                           </span>
//                         ) : (
//                           <span className="text-xs sm:text-sm text-gray-500">Not graded</span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Actions */}
//                     <div className="pt-2 sm:pt-3 border-t border-gray-200 space-y-2">
//                       <div className="flex gap-1 sm:gap-2">
//                         {submission.grade === null ? (
//                           <button
//                             onClick={() => {
//                               setSelectedSubmission(submission);
//                               setGradeInput("");
//                               setFeedbackInput("");
//                             }}
//                             className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-xs sm:text-sm font-normal sm:font-medium"
//                           >
//                             Grade Submission
//                           </button>
//                         ) : (
//                           <button
//                             onClick={() => {
//                               setSelectedSubmission(submission);
//                               setGradeInput(submission.grade?.toString() || "");
//                               setFeedbackInput(submission.feedback || "");
//                             }}
//                             className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3f6468] transition-colors text-xs sm:text-sm font-normal sm:font-medium"
//                           >
//                             Edit Grade
//                           </button>
//                         )}
                        
//                         <a
//                           href={submission.uploadedFilePath}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="flex-1 text-center px-2 sm:px-4 py-1.5 sm:py-2 border border-[#4f7c82] text-[#4f7c82] rounded-lg hover:bg-[#4f7c82] hover:text-white transition-colors text-xs sm:text-sm font-normal sm:font-medium"
//                         >
//                           View File
//                         </a>
//                       </div>
                      
//                       {submission.feedback && (
//                         <button
//                           onClick={() => {
//                             setFeedbackToView(submission.feedback);
//                             setShowFeedbackModal(true);
//                           }}
//                           className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border border-[#4f7c82] text-[#4f7c82] rounded-lg hover:bg-[#4f7c82] hover:text-white transition-colors text-xs sm:text-sm font-normal sm:font-medium"
//                         >
//                           View Feedback
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {selectedSubmission && (
//          createPortal(
//         <div className="fixed inset-0 z-[100000] flex justify-end">
//           <div 
//             className="absolute inset-0 bg-black/50 backdrop-blur-sm"       
//                onClick={() => {
//                 setSelectedSubmission(null);
//                 setGradeInput("");
//                 setFeedbackInput(""); }}
//           />
//           <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        
//             <div className="bg-white p-3 sm:p-4 flex justify-between items-center flex-shrink-0 border-b border-gray-200">
//               <h3 className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold lg:font-bold">
//                 Grade {selectedSubmission.type === "lab" ? "Lab" : "Activity"}
//               </h3>
//               <button
//                 onClick={() => {
//                   setSelectedSubmission(null);
//                   setGradeInput("");
//                   setFeedbackInput("");
//                 }}
//                 className="text-xl sm:text-2xl hover:text-gray-600"
//               >
//                 ✕
//               </button>
//             </div>

          
//             <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-hide">
           
//               <div>
//                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
//                   Grade {selectedSubmission.totalMarks ? `(0-${selectedSubmission.totalMarks})` : "(0-100)"} 
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   max={selectedSubmission.totalMarks || 100}
//                   step="0.01"
//                   value={gradeInput}
//                   onChange={(e) => {
//                     const value = e.target.value;
//                     if (value && selectedSubmission.totalMarks) {
//                       const numValue = parseFloat(value);
//                       if (!isNaN(numValue) && numValue > selectedSubmission.totalMarks) {
//                         return;
//                       }
//                     }
//                     setGradeInput(value);
//                   }}
//                   onBlur={(e) => {
//                     if (selectedSubmission.totalMarks) {
//                       const numValue = parseFloat(e.target.value);
//                       if (!isNaN(numValue) && numValue > selectedSubmission.totalMarks) {
//                         setGradeInput(selectedSubmission.totalMarks.toString());
//                       }
//                     }
//                   }}
//                   className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//                   placeholder={selectedSubmission.totalMarks ? `Enter grade (0-${selectedSubmission.totalMarks})` : "Enter grade (0-100)"}
//                 />
//               </div>

              
//               <div>
//                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
//                   Feedback (Optional)
//                 </label>
//                 <textarea
//                   value={feedbackInput}
//                   onChange={(e) => setFeedbackInput(e.target.value)}
//                   rows="6"
//                   className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] resize-none"
//                   placeholder="Enter feedback ..."
//                 />
//               </div>
//             </div>

       
//             <div className="p-3 sm:p-4 lg:p-6 bg-white flex gap-2 sm:gap-3 flex-shrink-0 border-t border-gray-200">
//               <button
//                 onClick={() => {
//                   setSelectedSubmission(null);
//                   setGradeInput("");
//                   setFeedbackInput("");
//                 }}
//                 className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-normal sm:font-medium text-xs sm:text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleGrade(selectedSubmission)}
//                 disabled={grading[selectedSubmission.id]}
//                 className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-normal sm:font-medium text-xs sm:text-sm"
//               >
//                 {grading[selectedSubmission.id] ? "Submitting..." : "Submit Grade"}
//               </button>
//             </div>
//           </div>
//         </div>,
//         document.body)
//       )}

//       {showFeedbackModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
//           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative z-[10000]">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-bold text-gray-800">Instructor Feedback</h3>
//                 <button
//                   onClick={() => {
//                     setShowFeedbackModal(false);
//                     setFeedbackToView("");
//                   }}
//                   className="text-gray-500 hover:text-gray-700 text-2xl"
//                 >
//                   ×
//                 </button>
//               </div>
//               <div className="rounded-lg">
//                 <p className="text-gray-700 whitespace-pre-wrap">{feedbackToView}</p>
//               </div>
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={() => {
//                     setShowFeedbackModal(false);
//                     setFeedbackToView("");
//                   }}
//                   className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
















