"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function EditCV() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    about: "",
    experience: "",
    education: "",
    contact: "",
    address: "",
  });
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCV = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/instructor/cv?instructorId=${userId}`);
        const data = await response.json();

        if (data.success && data.cv) {
          setFormData({
            about: data.cv.about || "",
            experience: data.cv.experience || "",
            education: data.cv.education || "",
            contact: data.cv.contact || "",
            address: data.cv.address || "",
          });
         
          if (data.cv.skills) {
            const skillsArray = data.cv.skills.split(",").map(s => s.trim()).filter(s => s);
            setSkills(skillsArray);
          }
          
          if (data.cv.languages) {
            const languagesArray = data.cv.languages.split(",").map(l => l.trim()).filter(l => l);
            setLanguages(languagesArray);
          }
          
          if (data.cv.profileImage) {
            setImagePreview(data.cv.profileImage);
          }
        }
      } catch (err) {
        console.error("Error fetching CV:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCV();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addLanguage = () => {
    if (currentLanguage.trim() && !languages.includes(currentLanguage.trim())) {
      setLanguages([...languages, currentLanguage.trim()]);
      setCurrentLanguage("");
    }
  };

  const removeLanguage = (languageToRemove) => {
    setLanguages(languages.filter(language => language !== languageToRemove));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const formDataToSend = new FormData();
      formDataToSend.append("instructorId", userId);
      formDataToSend.append("about", formData.about);
      formDataToSend.append("experience", formData.experience);
      formDataToSend.append("skills", skills.join(", "));
      formDataToSend.append("education", formData.education);
      formDataToSend.append("contact", formData.contact);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("languages", languages.join(", "));
      
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const response = await fetch("/api/instructor/cv", {
        method: "PUT",
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/instructor");
        }, 1500);
      } else {
        setError(data.message || "Failed to save CV");
      }
    } catch (err) {
      setError("Error saving CV");
      console.error("Error saving CV:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md text-black p-6 mt-4">
        <div className="flex items-center justify-center py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg sm:text-2xl lg:text-3xl font-semibold sm:font-bold text-[#4f7c82] mb-4 sm:mb-6 text-center">Edit CV</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Side - Edit Form */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold text-gray-800 mb-3 sm:mb-4">Edit Information</h3>

            {error && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs sm:text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-100 border border-green-400 text-green-700 rounded text-xs sm:text-sm">
                CV saved successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs sm:text-sm text-gray-600 w-full"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  About
                </label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Experience (years)
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Skills
                </label>
                {/* Display added skills as tags */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-gray-500 hover:text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {/* Input field to add new skill */}
                <div className="flex gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                    placeholder="Enter a skill"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-3 sm:px-6 py-1.5 sm:py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] font-normal sm:font-medium text-xs sm:text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Education
                </label>
                <textarea
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  placeholder="Your educational background..."
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Contact
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                  placeholder="Your address"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Languages
                </label>
                {/* Display added languages as tags */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {languages.map((language, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm"
                    >
                      {language}
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="text-gray-500 hover:text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {/* Input field to add new language */}
                <div className="flex gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLanguage();
                      }
                    }}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
                    placeholder="Enter a language"
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="px-3 sm:px-6 py-1.5 sm:py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] font-normal sm:font-medium text-xs sm:text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-4 pt-3 sm:pt-4">
                <Button
                  type="button"
                  onClick={() => router.push("/dashboard/instructor")}
                  className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] disabled:opacity-50 text-xs sm:text-sm"    
                  // className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#4f7c82] text-white rounded-lg hover:bg-[#3d6166] disabled:opacity-50 text-xs sm:text-sm"
                >
                  {saving ? "Saving..." : "Save CV"}
                </Button>
              </div>
            </form>
          </div>

         
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-4 lg:self-start">
            <h3 className="text-base sm:text-lg lg:text-2xl font-semibold sm:font-bold text-center text-[#4f7c82] border-b pb-2 sm:pb-3 mb-4 sm:mb-6">CV Preview</h3>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
             
              <div className="w-full sm:w-1/2">
           
                <div className="flex justify-center sm:justify-start mb-3 sm:mb-4">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shadow-lg" 
                      alt="Profile"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 border-4 border-[#4f7c82]/20 flex items-center justify-center">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </div>
                  )}
                </div>

                
                <div className="mb-2 sm:mb-3">
                  <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Name</h4>
                  <p className="text-xs sm:text-sm lg:text-base tracking-tight text-black/80 pl-2 sm:pl-0">{user?.name || "Your Name"}</p>
                </div>

                {/* Email */}
                <div className="mb-2 sm:mb-3">
                  <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Email</h4>
                  <p className="text-xs sm:text-sm tracking-tight text-black/70 pl-2 sm:pl-0 break-words">{user?.email || "your.email@example.com"}</p>
                </div>

                {/* Contact */}
                {formData.contact && (
                  <div className="mb-2 sm:mb-3">
                    <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Contact</h4>
                    <p className="text-xs sm:text-sm tracking-tight text-black/70 break-words pl-2 sm:pl-0">{formData.contact}</p>
                  </div>
                )}

                {/* Address */}
                {formData.address && (
                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-xs sm:text-sm font-medium sm:font-semibold text-[#4f7c82] mb-1">Address</h4>
                    <p className="text-xs sm:text-sm tracking-tight text-black/70 break-words pl-2 sm:pl-0">{formData.address}</p>
                  </div>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm lg:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1.5 sm:mb-2">Skills</h3>
                    <ul className="space-y-1 list-disc list-inside pl-2 sm:pl-0">
                      {skills.map((skill, index) => (
                        <li key={index} className="text-xs sm:text-sm tracking-tight text-black/70 break-words">{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="w-full sm:w-1/2">
                {/* Experience */}
                {formData.experience && (
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm lg:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1.5 sm:mb-2">Experience</h3>
                    <p className="text-xs sm:text-sm tracking-tight text-black/70 break-words pl-2 sm:pl-0">{formData.experience} years</p>
                  </div>
                )}

                {/* About */}
                {formData.about && (
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm lg:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1.5 sm:mb-2">About</h3>
                    <p className="text-xs sm:text-sm tracking-tight text-black/70 break-words pl-2 sm:pl-0">{formData.about}</p>
                  </div>
                )}

                {/* Education */}
                {formData.education && (
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm lg:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1.5 sm:mb-2">Education</h3>
                    <p className="text-xs sm:text-sm tracking-tight text-black/70 break-words pl-2 sm:pl-0">{formData.education}</p>
                  </div>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm lg:text-base font-medium sm:font-semibold text-[#4f7c82] mb-1.5 sm:mb-2">Languages</h3>
                    <ul className="space-y-1 list-disc list-inside pl-2 sm:pl-0">
                      {languages.map((language, index) => (
                        <li key={index} className="text-xs sm:text-sm tracking-tight text-black/70 break-words">{language}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
