"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signupUser, resetAuth } from "@/store/auth_temp.js";
import Input from "@/components/Input";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Toast from "@/components/Toast";

export default function InstructorSignup() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, success, error, user } = useSelector((state) => state.auth);
  const [showToast, setShowToast] = useState(false);
  const [validationError, setValidationError] = useState("");
 
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "instructor",
    about: "",
    experience: "",
    accountNumber: "",
    bank: "",
    image: null,
    skills: [],
    education: "",
    address: "",
    contact: "",
    languages: [],
    loginEmail: "", 
  });

  const [showPassword, setShowPassword] = useState(false);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file" && files && files[0]) {
      const file = files[0];
      
     
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setValidationError("Only image files (JPEG, PNG, GIF, WebP) are allowed");
        setShowToast(true);
        e.target.value = ""; 
        return;
      }
      
     
      const maxSize = 5 * 1024 * 1024; 
      if (file.size > maxSize) {
        setValidationError("Image size must be less than 5MB");
        setShowToast(true);
        e.target.value = ""; 
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
     
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()],
      }));
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleAddLanguage = () => {
    if (currentLanguage.trim() && !formData.languages.includes(currentLanguage.trim())) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, currentLanguage.trim()],
      }));
      setCurrentLanguage("");
    }
  };

  const handleRemoveLanguage = (languageToRemove) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((language) => language !== languageToRemove),
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      handleAddSkill();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  
  const handleSaveCV = (e) => {
    e.preventDefault();
    
   
    if (!formData.name || !formData.email || !formData.education) {
      setValidationError("Please fill in all required fields: Name, Email, and Education");
      setShowToast(true);
      return;
    }
    
    
    setCurrentStep(2);
  };

 
  const handleNextToBank = async (e) => {
    e.preventDefault();
    
    // Validate login details
    if (!formData.loginEmail || !formData.password) {
      setValidationError("Please fill in Email and Password");
      setShowToast(true);
      return;
    }

    const password = formData.password;

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long!");
      setShowToast(true);
      return;
    }

    const uppercaseRegex = /[A-Z]/;
    if (!uppercaseRegex.test(password)) {
      setValidationError("Password must contain at least one uppercase letter!");
      setShowToast(true);
      return;
    }

    // Check if email already exists before moving to step 3
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.loginEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setValidationError(data.message || "Email already exists");
        setShowToast(true);
        return;
      }
    } catch (error) {
      console.error("Email check error:", error);
    }

    setValidationError("");
    setCurrentStep(3);
  };

  
  const handleSubmit = (e) => {
    e.preventDefault();

   
    if (!formData.accountNumber || !formData.bank) {
      setValidationError("Please fill in Account Number and Bank Name");
      setShowToast(true);
      return;
    }

    const form = new FormData();
    
    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      if (value !== null && value !== "") {
        
        if (key === "loginEmail") {
          form.append("email", value); 
        } else if ((key === "skills" || key === "languages") && Array.isArray(value)) {
          
          if (value.length > 0) {
            form.append(key, value.join(", "));
          }
        } else if (key === "image") {
         
          if (value instanceof File) {
            form.append(key, value);
          }
        } else if (key !== "email") { 
          form.append(key, value);
        }
      }
    });

    dispatch(signupUser(form));
  };


  useEffect(() => {
    dispatch(resetAuth());
  }, [dispatch]);

 
  useEffect(() => {
    if (success && user) {
      
      const timer = setTimeout(() => {
        router.replace("/dashboard/instructor");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [success, user, router]);

  useEffect(() => {
  if (user) {
    router.replace("/dashboard/instructor");
  }
}, [user, router]);


  
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => dispatch(resetAuth()), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // Show toast when error occurs
  useEffect(() => {
    if (error) {
      setShowToast(true);
    }
  }, [error]);

  return (
    <>
      {showToast && (error || validationError) && (
        <Toast
          message={error || validationError}
          onClose={() => {
            setShowToast(false);
            setValidationError("");
            dispatch(resetAuth());
          }}
        />
      )}
      
      <div className="min-h-screen bg-white">
  <div className="flex flex-col lg:flex-row max-w-[1800px] 2xl:max-w-[1680px] mx-auto ">

   
    <div className="w-full lg:w-1/2 2xl:w-[55%] bg-[#4f7c82]/5 2xl:bg-white flex items-center justify-center px-4 sm:px-8 2xl:px-16 py-10">
      <div className="w-full max-w-md 2xl:max-w-2xl rounded-2xl shadow-xl p-6 sm:p-8 bg-white">

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-black mb-6">
          Instructor Signup
        </h2>

      
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1 ? 'bg-[#4f7c82] text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-[#4f7c82]' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 2 ? 'bg-[#4f7c82] text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <div className={`w-12 h-1 ${currentStep >= 3 ? 'bg-[#4f7c82]' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 3 ? 'bg-[#4f7c82] text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
          </div>
        </div>

        
        {currentStep === 1 && (
          <form onSubmit={handleSaveCV} className="">
            <h1 className="text-black font-semibold mb-4">Instructor CV</h1>

          <label className="block text-black pt-4">
  Profile Image
</label>

<div className="flex items-center w-full border rounded-md overflow-hidden">

  <label
    htmlFor="image"
    className="px-4 py-2 text-white bg-[#4f7c82] text-sm cursor-pointer"
  >
    Choose file
  </label>

 
  <span className="px-4 text-sm text-black truncate">
    No file chosen
  </span>
</div>

<input
  id="image"
  type="file"
  name="image"
  onChange={handleChange}
  className="hidden"
/>

<div className="pt-4">
          <label className="text-black">Name </label>
          <Input name="name" value={formData.name} maxLength={50}  placeholder="Enter your name" onChange={handleChange} required />
</div>

<div className="pt-4">
          <label className="text-black">Email </label>
          <Input name="email" value={formData.email}  placeholder="Enter your email" onChange={handleChange} required />
</div>


<div className="pt-4">
          <label className="text-black">About</label>
          <Input name="about" value={formData.about}  maxLength={50}  placeholder="Enter about" onChange={handleChange} />
</div>
  
<div className="pt-4">
          <label className="text-black">Experience</label>
          <Input name="experience" value={formData.experience} type="number"  placeholder="Enter experince"  min={0} onChange={handleChange} />
</div>

      
      <div className="pt-4">

  <label className="text-black">Skills</label>

  <div className="pt-2">
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.skills.map((skill, idx) => (
             <div key={idx} className="flex items-center gap-2 bg-[#4f7c82]/10 text-[#4f7c82] px-3 py-1 rounded-full text-sm">
               <span>{skill}</span>
               <button type="button" onClick={() => handleRemoveSkill(skill)} className="font-bold hover:text-[#3d6166]">×</button>
             </div>
            ))}
           </div>
         )}
         </div>

<div className="flex gap-2">
  <input
    type="text"
    value={currentSkill}
    placeholder="Enter a skill"
    onChange={(e) => setCurrentSkill(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault(); 
        handleAddSkill();
      }
    }}
    className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
  />
  <button
    type="button"
    onClick={handleAddSkill}
    className="px-3 sm:px-4 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg flex items-center justify-center"
  >
    <span className="block sm:hidden text-xl">+</span>
    <span className="hidden sm:block">Add</span>
  </button>
</div>

      </div>



<div className="pt-4">
          <label className="text-black">Education</label>
          <Input name="education" value={formData.education} onChange={handleChange}  placeholder="Enter your education" required/>
</div>

<div className="pt-4">
          <label className="text-black">Address</label>
          <Input name="address"  value={formData.address} onChange={handleChange}  placeholder="Enter your address"/>
</div>

<div className="pt-4">
          <label className="text-black">Contact Number</label>
          <Input name="contact" type="number" value={formData.contact} onChange={handleChange}  placeholder="Enter your contact number"/>
</div>

<div className="pt-4">
  <label className="text-black">Languages</label>

  <div className="pt-2">
        {formData.languages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.languages.map((language, idx) => (
             <div key={idx} className="flex items-center gap-2 bg-[#4f7c82]/10 text-[#4f7c82] px-3 py-1 rounded-full text-sm">
               <span>{language}</span>
               <button type="button" onClick={() => handleRemoveLanguage(language)} className="font-bold hover:text-[#3d6166]">×</button>
             </div>
            ))}
           </div>
         )}
  </div>

  <div className="flex gap-2">
    <input
      type="text"
      value={currentLanguage}
      placeholder="Enter language "
      onChange={(e) => setCurrentLanguage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); 
          handleAddLanguage();
        }
      }}
      className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
    />
    <button
      type="button"
      onClick={handleAddLanguage}
      className="px-3 sm:px-4 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg flex items-center justify-center"
    >
      <span className="block sm:hidden text-xl">+</span>
      <span className="hidden sm:block">Add</span>
    </button>
  </div>
</div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full py-2 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition"
              >
                Save CV & Next
              </button>
            </div>

            <p className="text-center text-sm text-black/60 pt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-[#4f7c82] font-medium hover:underline">
                Login
              </Link>
            </p>
          </form>
        )}

        {/* STEP 2: Login Details */}
        {currentStep === 2 && (
          <form onSubmit={handleNextToBank} className="">
            <h1 className="text-black font-semibold mb-4">Instructor Login Detail</h1>

            <div className="pt-4">
              <label className="text-black">Email </label>
              <Input name="loginEmail" value={formData.loginEmail}  placeholder="Enter your login email" onChange={handleChange} required />
            </div>

            <div className="relative">
              <div className="pt-4">
                <label className="text-black">Password</label>
                <Input type={showPassword ? "text" : "password"}  placeholder="Enter password" minLength={6} name="password" value={formData.password} onChange={handleChange} required  
                  className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bottom-2.5 text-gray-500 hover:text-black"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.025.154-2.014.441-2.947M3.98 3.98l16.04 16.04M9.88 9.88a3 3 0 104.24 4.24" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition"
              >
                Next
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Bank Details */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="">
            <h1 className="text-black font-semibold mb-4">Bank Account Detail </h1>

            <div className="pt-4">
              <label className="text-black">Account Number </label>
              <Input name="accountNumber" value={formData.accountNumber}  placeholder="Enter your account number"  maxLength={34} onChange={handleChange} required />
            </div>

            <div className="pt-4">
              <label className="text-black">Bank Name </label>
              <Input name="bank" value={formData.bank} onChange={handleChange}  placeholder="Enter bank name" required pattern="[A-Za-z\s]+" />
            </div>

            <div className="pt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-1/3 py-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "Signup"}
              </button>
            </div>

            {/* {success && <p className="text-green-600 text-center pt-4">Instructor account created </p>} */}
          </form>
        )}

      </div>
    </div>

  
    <div className="w-full lg:w-1/2 2xl:w-[45%] px-4 sm:px-2 py-10 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-6 sm:p-8 max-w-lg 2xl:max-w-2xl mx-auto">

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#4f7c82] border-b pb-3 mb-6">
          Instructor CV Preview
        </h2>

        <div className="flex gap-6">
          
          <div className="w-1/2">
            <div className="flex justify-start mb-4">
              {imagePreview ? (
                <img src={imagePreview} className="w-24 h-24 rounded-full object-cover border-2 shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-black/5 border-4 border-[#4f7c82]/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-black/40" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
              )}
            </div>

            
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Name</h4>
              <p className="text-sm text-black/80">
                {formData.name || "Your Name"}
              </p>
            </div>

          
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Email</h4>
              <p className="text-xs text-black/70">
                {formData.email || "your.email@example.com"}
              </p>
            </div>

            
            {formData.contact && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Contact</h4>
                <p className="text-xs text-black/70">
                  {formData.contact}
                </p>
              </div>
            )}

           
            {formData.address && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Address</h4>
                <p className="text-xs text-black/70">
                  {formData.address}
                </p>
              </div>
            )}

           
            {formData.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Skills</h3>
                <ul className="space-y-1 list-disc list-inside">
                  {formData.skills.map((skill, index) => (
                    <li key={index} className="text-xs text-black/70">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          
          <div className="w-1/2">
           
            {formData.experience && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Experience</h3>
                <p className="text-xs text-black/70">{formData.experience} years</p>
              </div>
            )}

            {formData.about && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">About</h3>
                <p className="text-xs text-black/70">{formData.about}</p>
              </div>
            )}

       
            {formData.education && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Education</h3>
                <p className="text-xs text-black/70">{formData.education}</p>
              </div>
            )}

            
            {formData.languages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Languages</h3>
                <ul className="space-y-1 list-disc list-inside">
                  {formData.languages.map((language, index) => (
                    <li key={index} className="text-xs text-black/70">
                      {language}
                    </li>
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
    </>
  );
}




































// "use client";

// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { signupUser, resetAuth } from "@/store/auth_temp.js";
// import Input from "@/components/Input";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import Toast from "@/components/Toast";

// export default function InstructorSignup() {
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const { loading, success, error, user } = useSelector((state) => state.auth);
//   const [showToast, setShowToast] = useState(false);
//   const [validationError, setValidationError] = useState("");
 
//   const [currentStep, setCurrentStep] = useState(1);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "instructor",
//     about: "",
//     experience: "",
//     accountNumber: "",
//     bank: "",
//     image: null,
//     skills: [],
//     education: "",
//     address: "",
//     contact: "",
//     languages: [],
//     loginEmail: "", 
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [currentSkill, setCurrentSkill] = useState("");
//   const [currentLanguage, setCurrentLanguage] = useState("");
//   const [imagePreview, setImagePreview] = useState(null);

//   const handleChange = (e) => {
//     const { name, value, files, type } = e.target;
//     if (type === "file" && files && files[0]) {
//       const file = files[0];
      
     
//       const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
//       if (!allowedTypes.includes(file.type)) {
//         setValidationError("Only image files (JPEG, PNG, GIF, WebP) are allowed");
//         setShowToast(true);
//         e.target.value = ""; 
//         return;
//       }
      
     
//       const maxSize = 5 * 1024 * 1024; 
//       if (file.size > maxSize) {
//         setValidationError("Image size must be less than 5MB");
//         setShowToast(true);
//         e.target.value = ""; 
//         return;
//       }
      
//       setFormData((prev) => ({
//         ...prev,
//         [name]: file,
//       }));
     
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   const handleAddSkill = () => {
//     if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
//       setFormData((prev) => ({
//         ...prev,
//         skills: [...prev.skills, currentSkill.trim()],
//       }));
//       setCurrentSkill("");
//     }
//   };

//   const handleRemoveSkill = (skillToRemove) => {
//     setFormData((prev) => ({
//       ...prev,
//       skills: prev.skills.filter((skill) => skill !== skillToRemove),
//     }));
//   };

//   const handleAddLanguage = () => {
//     if (currentLanguage.trim() && !formData.languages.includes(currentLanguage.trim())) {
//       setFormData((prev) => ({
//         ...prev,
//         languages: [...prev.languages, currentLanguage.trim()],
//       }));
//       setCurrentLanguage("");
//     }
//   };

//   const handleRemoveLanguage = (languageToRemove) => {
//     setFormData((prev) => ({
//       ...prev,
//       languages: prev.languages.filter((language) => language !== languageToRemove),
//     }));
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault(); 
//       handleAddSkill();
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       handleAddSkill();
//     }
//   };

  
//   const handleSaveCV = (e) => {
//     e.preventDefault();
    
   
//     if (!formData.name || !formData.email || !formData.education) {
//       setValidationError("Please fill in all required fields: Name, Email, and Education");
//       setShowToast(true);
//       return;
//     }
    
    
//     setCurrentStep(2);
//   };

 
//   const handleNextToBank = async (e) => {
//     e.preventDefault();
    
//     // Validate login details
//     if (!formData.loginEmail || !formData.password) {
//       setValidationError("Please fill in Email and Password");
//       setShowToast(true);
//       return;
//     }

//     const password = formData.password;

//     if (password.length < 6) {
//       setValidationError("Password must be at least 6 characters long!");
//       setShowToast(true);
//       return;
//     }

//     const uppercaseRegex = /[A-Z]/;
//     if (!uppercaseRegex.test(password)) {
//       setValidationError("Password must contain at least one uppercase letter!");
//       setShowToast(true);
//       return;
//     }

//     // Check if email already exists before moving to step 3
//     try {
//       const response = await fetch('/api/auth/check-email', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: formData.loginEmail })
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         setValidationError(data.message || "Email already exists");
//         setShowToast(true);
//         return;
//       }
//     } catch (error) {
//       console.error("Email check error:", error);
//     }

//     setValidationError("");
//     setCurrentStep(3);
//   };

  
//   const handleSubmit = (e) => {
//     e.preventDefault();

   
//     if (!formData.accountNumber || !formData.bank) {
//       setValidationError("Please fill in Account Number and Bank Name");
//       setShowToast(true);
//       return;
//     }

//     const form = new FormData();
    
//     Object.keys(formData).forEach((key) => {
//       const value = formData[key];
//       if (value !== null && value !== "") {
        
//         if (key === "loginEmail") {
//           form.append("email", value); 
//         } else if ((key === "skills" || key === "languages") && Array.isArray(value)) {
          
//           if (value.length > 0) {
//             form.append(key, value.join(", "));
//           }
//         } else if (key === "image") {
         
//           if (value instanceof File) {
//             form.append(key, value);
//           }
//         } else if (key !== "email") { 
//           form.append(key, value);
//         }
//       }
//     });

//     dispatch(signupUser(form));
//   };


//   useEffect(() => {
//     dispatch(resetAuth());
//   }, [dispatch]);

 
//   useEffect(() => {
//     if (success && user) {
      
//       const timer = setTimeout(() => {
//         router.replace("/dashboard/instructor");
//       }, 100);
//       return () => clearTimeout(timer);
//     }
//   }, [success, user, router]);

//   useEffect(() => {
//   if (user) {
//     router.replace("/dashboard/instructor");
//   }
// }, [user, router]);


  
//   useEffect(() => {
//     if (success) {
//       const timer = setTimeout(() => dispatch(resetAuth()), 2000);
//       return () => clearTimeout(timer);
//     }
//   }, [success, dispatch]);

//   // Show toast when error occurs
//   useEffect(() => {
//     if (error) {
//       setShowToast(true);
//     }
//   }, [error]);

//   return (
//     <>
//       {showToast && (error || validationError) && (
//         <Toast
//           message={error || validationError}
//           onClose={() => {
//             setShowToast(false);
//             setValidationError("");
//             dispatch(resetAuth());
//           }}
//         />
//       )}
      
//       <div className="min-h-screen bg-white">
//   <div className="flex flex-col lg:flex-row">

   
//     <div className="w-full lg:w-1/2 bg-[#4f7c82]/5 flex items-center justify-center px-4 sm:px-8 py-10">
//       <div className="w-full max-w-md rounded-2xl shadow-xl p-6 sm:p-8 bg-white">

//         <h2 className="text-2xl sm:text-3xl font-bold text-center text-black mb-6">
//           Instructor Signup
//         </h2>

      
//         <div className="flex justify-center mb-6">
//           <div className="flex items-center space-x-2">
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1 ? 'bg-[#4f7c82] text-white' : 'bg-gray-300 text-gray-600'}`}>
//               1
//             </div>
//             <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-[#4f7c82]' : 'bg-gray-300'}`}></div>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 2 ? 'bg-[#4f7c82] text-white' : 'bg-gray-300 text-gray-600'}`}>
//               2
//             </div>
//             <div className={`w-12 h-1 ${currentStep >= 3 ? 'bg-[#4f7c82]' : 'bg-gray-300'}`}></div>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 3 ? 'bg-[#4f7c82] text-white' : 'bg-gray-300 text-gray-600'}`}>
//               3
//             </div>
//           </div>
//         </div>

        
//         {currentStep === 1 && (
//           <form onSubmit={handleSaveCV} className="">
//             <h1 className="text-black font-semibold mb-4">Instructor CV</h1>

//           <label className="block text-black pt-4">
//   Profile Image
// </label>

// <div className="flex items-center w-full border rounded-md overflow-hidden">

//   <label
//     htmlFor="image"
//     className="px-4 py-2 text-white bg-[#4f7c82] text-sm cursor-pointer"
//   >
//     Choose file
//   </label>

 
//   <span className="px-4 text-sm text-black truncate">
//     No file chosen
//   </span>
// </div>

// <input
//   id="image"
//   type="file"
//   name="image"
//   onChange={handleChange}
//   className="hidden"
// />

// <div className="pt-4">
//           <label className="text-black">Name </label>
//           <Input name="name" value={formData.name} maxLength={50}  placeholder="Enter your name" onChange={handleChange} required />
// </div>

// <div className="pt-4">
//           <label className="text-black">Email </label>
//           <Input name="email" value={formData.email}  placeholder="Enter your email" onChange={handleChange} required />
// </div>


// <div className="pt-4">
//           <label className="text-black">About</label>
//           <Input name="about" value={formData.about}  maxLength={50}  placeholder="Enter about" onChange={handleChange} />
// </div>
  
// <div className="pt-4">
//           <label className="text-black">Experience</label>
//           <Input name="experience" value={formData.experience} type="number"  placeholder="Enter experince"  min={0} onChange={handleChange} />
// </div>

      
//       <div className="pt-4">

//   <label className="text-black">Skills</label>

//   <div className="pt-2">
//         {formData.skills.length > 0 && (
//           <div className="flex flex-wrap gap-2 mb-2">
//             {formData.skills.map((skill, idx) => (
//              <div key={idx} className="flex items-center gap-2 bg-[#4f7c82]/10 text-[#4f7c82] px-3 py-1 rounded-full text-sm">
//                <span>{skill}</span>
//                <button type="button" onClick={() => handleRemoveSkill(skill)} className="font-bold hover:text-[#3d6166]">×</button>
//              </div>
//             ))}
//            </div>
//          )}
//          </div>

// <div className="flex gap-2">
//   <input
//     type="text"
//     value={currentSkill}
//     placeholder="Enter a skill"
//     onChange={(e) => setCurrentSkill(e.target.value)}
//     onKeyDown={(e) => {
//       if (e.key === "Enter") {
//         e.preventDefault(); 
//         handleAddSkill();
//       }
//     }}
//     className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//   />
//   <button
//     type="button"
//     onClick={handleAddSkill}
//     className="px-3 sm:px-4 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg flex items-center justify-center"
//   >
//     <span className="block sm:hidden text-xl">+</span>
//     <span className="hidden sm:block">Add</span>
//   </button>
// </div>

//       </div>



// <div className="pt-4">
//           <label className="text-black">Education</label>
//           <Input name="education" value={formData.education} onChange={handleChange}  placeholder="Enter your education" required/>
// </div>

// <div className="pt-4">
//           <label className="text-black">Address</label>
//           <Input name="address"  value={formData.address} onChange={handleChange}  placeholder="Enter your address"/>
// </div>

// <div className="pt-4">
//           <label className="text-black">Contact Number</label>
//           <Input name="contact" type="number" value={formData.contact} onChange={handleChange}  placeholder="Enter your contact number"/>
// </div>

// <div className="pt-4">
//   <label className="text-black">Languages</label>

//   <div className="pt-2">
//         {formData.languages.length > 0 && (
//           <div className="flex flex-wrap gap-2 mb-2">
//             {formData.languages.map((language, idx) => (
//              <div key={idx} className="flex items-center gap-2 bg-[#4f7c82]/10 text-[#4f7c82] px-3 py-1 rounded-full text-sm">
//                <span>{language}</span>
//                <button type="button" onClick={() => handleRemoveLanguage(language)} className="font-bold hover:text-[#3d6166]">×</button>
//              </div>
//             ))}
//            </div>
//          )}
//   </div>

//   <div className="flex gap-2">
//     <input
//       type="text"
//       value={currentLanguage}
//       placeholder="Enter language "
//       onChange={(e) => setCurrentLanguage(e.target.value)}
//       onKeyDown={(e) => {
//         if (e.key === "Enter") {
//           e.preventDefault(); 
//           handleAddLanguage();
//         }
//       }}
//       className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//     />
//     <button
//       type="button"
//       onClick={handleAddLanguage}
//       className="px-3 sm:px-4 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg flex items-center justify-center"
//     >
//       <span className="block sm:hidden text-xl">+</span>
//       <span className="hidden sm:block">Add</span>
//     </button>
//   </div>
// </div>

//             <div className="pt-6">
//               <button
//                 type="submit"
//                 className="w-full py-2 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition"
//               >
//                 Save CV & Next
//               </button>
//             </div>

//             <p className="text-center text-sm text-black/60 pt-4">
//               Already have an account?{" "}
//               <Link href="/login" className="text-[#4f7c82] font-medium hover:underline">
//                 Login
//               </Link>
//             </p>
//           </form>
//         )}

//         {/* STEP 2: Login Details */}
//         {currentStep === 2 && (
//           <form onSubmit={handleNextToBank} className="">
//             <h1 className="text-black font-semibold mb-4">Instructor Login Detail</h1>

//             <div className="pt-4">
//               <label className="text-black">Email </label>
//               <Input name="loginEmail" value={formData.loginEmail}  placeholder="Enter your login email" onChange={handleChange} required />
//             </div>

//             <div className="relative">
//               <div className="pt-4">
//                 <label className="text-black">Password</label>
//                 <Input type={showPassword ? "text" : "password"}  placeholder="Enter password" minLength={6} name="password" value={formData.password} onChange={handleChange} required  
//                   className="pr-10" />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 bottom-2.5 text-gray-500 hover:text-black"
//                 >
//                   {showPassword ? (
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.025.154-2.014.441-2.947M3.98 3.98l16.04 16.04M9.88 9.88a3 3 0 104.24 4.24" />
//                     </svg>
//                   ) : (
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//             </div>

//             <div className="pt-6 flex gap-3">
//               <button
//                 type="button"
//                 onClick={() => setCurrentStep(1)}
//                 className="w-1/3 py-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition"
//               >
//                 Back
//               </button>
//               <button
//                 type="submit"
//                 className="w-2/3 py-2 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition"
//               >
//                 Next
//               </button>
//             </div>
//           </form>
//         )}

//         {/* STEP 3: Bank Details */}
//         {currentStep === 3 && (
//           <form onSubmit={handleSubmit} className="">
//             <h1 className="text-black font-semibold mb-4">Bank Account Detail </h1>

//             <div className="pt-4">
//               <label className="text-black">Account Number </label>
//               <Input name="accountNumber" value={formData.accountNumber}  placeholder="Enter your account number"  maxLength={34} onChange={handleChange} required />
//             </div>

//             <div className="pt-4">
//               <label className="text-black">Bank Name </label>
//               <Input name="bank" value={formData.bank} onChange={handleChange}  placeholder="Enter bank name" required pattern="[A-Za-z\s]+" />
//             </div>

//             <div className="pt-6 flex gap-3">
//               <button
//                 type="button"
//                 onClick={() => setCurrentStep(2)}
//                 className="w-1/3 py-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition"
//               >
//                 Back
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-2/3 py-2 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60"
//               >
//                 {loading ? "Creating..." : "Signup"}
//               </button>
//             </div>

//             {/* {success && <p className="text-green-600 text-center pt-4">Instructor account created </p>} */}
//           </form>
//         )}

//       </div>
//     </div>

  
//     <div className="w-full lg:w-1/2 px-4 sm:px-2 py-10 overflow-y-auto">
//       <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-6 sm:p-8 max-w-lg mx-auto">

//         <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#4f7c82] border-b pb-3 mb-6">
//           Instructor CV Preview
//         </h2>

//         <div className="flex gap-6">
          
//           <div className="w-1/2">
//             <div className="flex justify-start mb-4">
//               {imagePreview ? (
//                 <img src={imagePreview} className="w-24 h-24 rounded-full object-cover border-2 shadow-lg" />
//               ) : (
//                 <div className="w-24 h-24 rounded-full bg-black/5 border-4 border-[#4f7c82]/20 flex items-center justify-center">
//                   <svg className="w-12 h-12 text-black/40" fill="currentColor" viewBox="0 0 20 20">
//                     <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
//                   </svg>
//                 </div>
//               )}
//             </div>

            
//             <div className="mb-3">
//               <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Name</h4>
//               <p className="text-sm text-black/80">
//                 {formData.name || "Your Name"}
//               </p>
//             </div>

          
//             <div className="mb-3">
//               <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Email</h4>
//               <p className="text-xs text-black/70">
//                 {formData.email || "your.email@example.com"}
//               </p>
//             </div>

            
//             {formData.contact && (
//               <div className="mb-3">
//                 <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Contact</h4>
//                 <p className="text-xs text-black/70">
//                   {formData.contact}
//                 </p>
//               </div>
//             )}

           
//             {formData.address && (
//               <div className="mb-4">
//                 <h4 className="text-xs font-semibold text-[#4f7c82] mb-1">Address</h4>
//                 <p className="text-xs text-black/70">
//                   {formData.address}
//                 </p>
//               </div>
//             )}

           
//             {formData.skills.length > 0 && (
//               <div className="mb-4">
//                 <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Skills</h3>
//                 <ul className="space-y-1 list-disc list-inside">
//                   {formData.skills.map((skill, index) => (
//                     <li key={index} className="text-xs text-black/70">
//                       {skill}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>

          
//           <div className="w-1/2">
           
//             {formData.experience && (
//               <div className="mb-4">
//                 <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Experience</h3>
//                 <p className="text-xs text-black/70">{formData.experience} years</p>
//               </div>
//             )}

//             {formData.about && (
//               <div className="mb-4">
//                 <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">About</h3>
//                 <p className="text-xs text-black/70">{formData.about}</p>
//               </div>
//             )}

       
//             {formData.education && (
//               <div className="mb-4">
//                 <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Education</h3>
//                 <p className="text-xs text-black/70">{formData.education}</p>
//               </div>
//             )}

            
//             {formData.languages.length > 0 && (
//               <div className="mb-4">
//                 <h3 className="text-sm font-semibold text-[#4f7c82] mb-2">Languages</h3>
//                 <ul className="space-y-1 list-disc list-inside">
//                   {formData.languages.map((language, index) => (
//                     <li key={index} className="text-xs text-black/70">
//                       {language}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>

//         </div>
//       </div>
//     </div>

//   </div>
// </div>
//     </>
//   );
// }
