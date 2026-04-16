"use client";

import { useState, useEffect } from "react";
import Input from "@/components/Input";
import { useDispatch, useSelector } from "react-redux";
import { signupUser, resetAuth } from "@/store/auth_temp.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

export default function StudentSignup() {
  const dispatch = useDispatch();
  const router = useRouter();

  // Redux state
  const { loading, success, error, user, isAuthenticated } =
    useSelector((state) => state.auth);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const password = formData.password;

    // Check minimum length
    if (password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    // Check for at least one uppercase letter
    const uppercaseRegex = /[A-Z]/;
    if (!uppercaseRegex.test(password)) {
      alert("Password must contain at least one uppercase letter!");
      return;
    }

    dispatch(signupUser(formData));
  };

  // Clear any errors when component mounts (e.g., login errors from previous page)
  useEffect(() => {
    dispatch(resetAuth());
  }, [dispatch]);


  useEffect(() => {
    if (isAuthenticated && user?.role) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, user, router]);

  // Reset success/error messages after some time
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
      {showToast && error && (
        <Toast
          message={error}
          onClose={() => {
            setShowToast(false);
            dispatch(resetAuth());
          }}
        />
      )}

      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4 md:px-0">
        <div className="flex flex-col md:flex-row items-start md:items-center xl:items-center 2xl:items-center md:justify-center xl:justify-center 2xl:justify-center gap-4 md:gap-6 lg:gap-8 2xl:gap-12 w-full max-w-[2560px] mx-auto md:pl-4 md:pr-10 lg:px-16 2xl:px-20">

        <div className="hidden md:flex md:w-1/2 2xl:w-[40%] justify-center items-center">
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/login-security-illustration-svg-download-png-7271013.png"
            alt="Login Illustration"
            className="w-full max-w-lg 2xl:max-w-xl object-contain"
          />
        </div>

        <div className="w-full md:w-1/2 2xl:w-[40%] max-w-sm lg:max-w-md xl:max-w-md 2xl:max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">

          {/* Header */}
          <div className="text-center mb-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 ">
              Student Signup
            </h2>
            <p className="text-sm sm:text-base tracking-tighter text-gray-500">
              Create your student account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">

            {/* Full Name */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                Full Name
              </label>
              {/* <Input
              name="name"
              value={formData.name}
              placeholder="Enter your name"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
            /> */}

              <Input
                name="name"
                value={formData.name}
                placeholder="Enter your name"
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                Email Address
              </label>
              {/* <Input
                name="email"
                type="email"
                value={formData.email}
                placeholder="example@email.com"
                onChange={handleChange}
                required
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
              /> */}

              <Input
                name="email"
                type="email"
                value={formData.email}
                placeholder="example@email.com"
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                {/* <Input
                  name="password"
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 sm:py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
                /> */}

                <Input
                  name="password"
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4f7c82]"
                >
                  {showPassword ? (
                    <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-1 sm:py-3 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            {/* Success Message */}
            {success && (
              <p className="text-green-600 text-center text-sm sm:text-base font-medium">
                Student account created successfully 
              </p>
            )}
          </form>

          {/* Footer */}
          <p className="text-center text-sm sm:text-base text-gray-500 mt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-[#4f7c82] font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
        </div>
      </div>
    </>
  );
}














// "use client";

// import { useState, useEffect } from "react";
// import Input from "@/components/Input";
// import { useDispatch, useSelector } from "react-redux";
// import { signupUser, resetAuth } from "@/store/auth_temp.js";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import Toast from "@/components/Toast";

// export default function StudentSignup() {
//   const dispatch = useDispatch();
//   const router = useRouter();

//   // Redux state
//   const { loading, success, error, user, isAuthenticated } =
//     useSelector((state) => state.auth);

//   // Form state
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "student",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showToast, setShowToast] = useState(false);

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Handle form submit
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const password = formData.password;

//     // Check minimum length
//     if (password.length < 6) {
//       alert("Password must be at least 6 characters long!");
//       return;
//     }

//     // Check for at least one uppercase letter
//     const uppercaseRegex = /[A-Z]/;
//     if (!uppercaseRegex.test(password)) {
//       alert("Password must contain at least one uppercase letter!");
//       return;
//     }

//     dispatch(signupUser(formData));
//   };

//   // Clear any errors when component mounts (e.g., login errors from previous page)
//   useEffect(() => {
//     dispatch(resetAuth());
//   }, [dispatch]);


//   useEffect(() => {
//     if (isAuthenticated && user?.role) {
//       router.replace(`/dashboard/${user.role}`);
//     }
//   }, [isAuthenticated, user, router]);

//   // Reset success/error messages after some time
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
//       {showToast && error && (
//         <Toast
//           message={error}
//           onClose={() => {
//             setShowToast(false);
//             dispatch(resetAuth());
//           }}
//         />
//       )}

//       <div className="flex flex-col md:flex-row
// items-start md:items-start xl:items-center
// md:justify-center xl:justify-start
// bg-gray-50
// px-4 md:pl-4 md:pr-10 lg:px-16
// py-4 md:py-4 lg:py-0 xl:py-0
// gap-4 md:gap-6 lg:gap-8">

//         <div className="hidden md:flex md:w-1/2 2xl:w-[40%] justify-center">
//           <img
//             src="https://cdni.iconscout.com/illustration/premium/thumb/login-security-illustration-svg-download-png-7271013.png"
//             alt="Login Illustration"
//             className="w-full max-w-lg object-contain"
//           />
//         </div>

//         <div className="w-full md:w-1/2 max-w-sm lg:max-w-md xl:max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">

//           {/* Header */}
//           <div className="text-center mb-2">
//             <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 ">
//               Student Signup
//             </h2>
//             <p className="text-sm sm:text-base tracking-tighter text-gray-500">
//               Create your student account
//             </p>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} className="space-y-2">

//             {/* Full Name */}
//             <div>
//               <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
//                 Full Name
//               </label>
//               {/* <Input
//               name="name"
//               value={formData.name}
//               placeholder="Enter your name"
//               onChange={handleChange}
//               required
//               className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
//             /> */}

//               <Input
//                 name="name"
//                 value={formData.name}
//                 placeholder="Enter your name"
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
//                 Email Address
//               </label>
//               {/* <Input
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 placeholder="example@email.com"
//                 onChange={handleChange}
//                 required
//                 className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
//               /> */}

//               <Input
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 placeholder="example@email.com"
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
//                 Password
//               </label>
//               <div className="relative">
//                 {/* <Input
//                   name="password"
//                   minLength={6}
//                   type={showPassword ? "text" : "password"}
//                   value={formData.password}
//                   placeholder="••••••••"
//                   onChange={handleChange}
//                   required
//                   className="w-full px-3 py-2 sm:py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
//                 /> */}

//                 <Input
//                   name="password"
//                   minLength={6}
//                   type={showPassword ? "text" : "password"}
//                   value={formData.password}
//                   placeholder="••••••••"
//                   onChange={handleChange}
//                   required
//                 />

//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4f7c82]"
//                 >
//                   {showPassword ? (
//                     <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                   ) : (
//                     <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-1 sm:py-3 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
//             >
//               {loading ? "Creating account..." : "Sign Up"}
//             </button>

//             {/* Success Message */}
//             {success && (
//               <p className="text-green-600 text-center text-sm sm:text-base font-medium">
//                 Student account created successfully 
//               </p>
//             )}
//           </form>

//           {/* Footer */}
//           <p className="text-center text-sm sm:text-base text-gray-500 mt-2">
//             Already have an account?{" "}
//             <Link href="/login" className="text-[#4f7c82] font-medium hover:underline">
//               Login
//             </Link>
//           </p>
//         </div>
//       </div>
//     </>
//   );
// }
