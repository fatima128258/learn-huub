"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser, resetAuth } from "@/store/auth_temp.js";
import Input from "@/components/Input";
import Link from "next/link";
import Toast from "@/components/Toast";

function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check lockout timer
  useEffect(() => {
    if (isLocked && lockoutTime) {
      const timer = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.ceil((lockoutTime - now) / 1000);
        
        if (timeLeft <= 0) {
          setIsLocked(false);
          setFailedAttempts(0);
          setLockoutTime(null);
          setRemainingTime(0);
        } else {
          setRemainingTime(timeLeft);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user && user.role) {
      if (user.role === "admin") {
        router.replace("/dashboard/admin");
      } else if (user.role === "instructor") {
        router.replace("/dashboard/instructor");
      } else if (user.role === "student") {
        router.replace("/dashboard/student");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Check if locked
    if (isLocked) {
      setShowToast(true);
      return;
    }
    
    try {
      const result = await dispatch(loginUser(formData)).unwrap();

      if (result.user) {
        // Reset failed attempts on successful login
        setFailedAttempts(0);
        setIsLocked(false);
        setLockoutTime(null);
        
        if (result.user.role === "admin") {
          router.replace("/dashboard/admin");
        } else if (result.user.role === "instructor") {
          router.replace("/dashboard/instructor");
        } else {
          router.replace("/dashboard/student");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Check if error is from rate limiting (status 429)
      if (error.blocked || error.remainingSeconds) {
        setIsLocked(true);
        const lockTime = Date.now() + (error.remainingSeconds * 1000);
        setLockoutTime(lockTime);
        setRemainingTime(error.remainingSeconds);
        setShowToast(true);
        return;
      }
      
      // Update remaining attempts from backend
      if (error.remainingAttempts !== undefined) {
        const attemptsUsed = 3 - error.remainingAttempts;
        setFailedAttempts(attemptsUsed);
        
        // If no attempts remaining, lock the user
        if (error.remainingAttempts === 0) {
          setIsLocked(true);
          const lockTime = Date.now() + 60000; // 1 minute
          setLockoutTime(lockTime);
          setRemainingTime(60);
        }
      } else {
        // Fallback to client-side counting
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // Lock after 3 failed attempts
        if (newFailedAttempts >= 3) {
          setIsLocked(true);
          const lockTime = Date.now() + 60000;
          setLockoutTime(lockTime);
          setRemainingTime(60);
        }
      }
      
      setShowToast(true);
    }
  }, [formData, dispatch, router, isLocked, failedAttempts]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Show toast only when locked
  useEffect(() => {
    if (isLocked) {
      setShowToast(true);
    }
  }, [isLocked]);

  return (
    <>
      {showToast && (
        <Toast
          message={isLocked 
            ? `Too many failed attempts. Please wait ${remainingTime} seconds before trying again.`
            : error
          }
          onClose={() => {
            setShowToast(false);
            if (!isLocked) {
              dispatch(resetAuth());
            }
          }}
        />
      )}

      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4 md:px-0 overflow-y-auto hide-scrollbar">
        <div className="flex flex-col md:flex-row items-start md:items-center xl:items-center 2xl:items-center md:justify-center xl:justify-center 2xl:justify-center gap-4 md:gap-6 lg:gap-8 2xl:gap-12 w-full max-w-[2560px] mx-auto md:pl-4 md:pr-10 lg:px-16 2xl:px-20">


        <div className="hidden md:flex w-full md:w-1/2 2xl:w-[45%] justify-center items-center px-0">
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/login-security-illustration-svg-download-png-7271013.png"
            alt="Login Illustration"
            className="w-full max-w-lg 2xl:max-w-xl object-contain"
          />
        </div>

        <div className="w-full sm:w-10/12 md:w-6/12 lg:w-[40%] 2xl:w-[45%] max-w-md 2xl:max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">

          <div className="text-center mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Login</h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Sign in to your account
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-4">


            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-600 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l13.42 13.42"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className=" text-right">
                <Link
                  href="/forget-password"
                  className="tracking-tighter text-[#4f7c82] hover:underline"
                >
                  Forget Password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-2 sm:py-3 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLocked 
                ? `Locked (${remainingTime}s)` 
                : loading 
                  ? "Logging in..." 
                  : "Login"
              }
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-2 text-center">
            <p className="text-sm sm:text-base text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-[#4f7c82] font-medium hover:underline"
              >
                Signup
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

export default memo(LoginPage);








































// "use client";

// import { useState, useEffect, useCallback, memo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useRouter } from "next/navigation";
// import { loginUser, resetAuth } from "@/store/auth_temp.js";
// import Input from "@/components/Input";
// import Link from "next/link";
// import Toast from "@/components/Toast";

// function LoginPage() {
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const { loading, error, isAuthenticated, user } = useSelector(
//     (state) => state.auth
//   );

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showToast, setShowToast] = useState(false);

//   useEffect(() => {
//     if (isAuthenticated && user?.role) {
//       router.replace(`/dashboard/${user.role}`);
//     }
//   }, [isAuthenticated, user, router]);



//   useEffect(() => {
//     if (isAuthenticated && user && user.role) {

//       if (user.role === "admin") {
//         router.replace("/dashboard/admin");
//       } else if (user.role === "instructor") {
//         router.replace("/dashboard/instructor");
//       } else if (user.role === "student") {
//         router.replace("/dashboard/student");
//       }
//     }
//   }, [isAuthenticated, user, router]);

//   const handleChange = useCallback((e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   }, []);

//   const handleSubmit = useCallback(async (e) => {
//     e.preventDefault();
//     try {
//       const result = await dispatch(loginUser(formData)).unwrap();

//       if (result.user) {
//         if (result.user.role === "admin") {
//           router.replace("/dashboard/admin");
//         } else if (result.user.role === "instructor") {
//           router.replace("/dashboard/instructor");
//         } else {
//           router.replace("/dashboard/student");
//         }
//       }
//     } catch (error) {

//       console.error("Login error:", error);
//     }
//   }, [formData, dispatch, router]);

//   const toggleShowPassword = useCallback(() => {
//     setShowPassword((prev) => !prev);
//   }, []);

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


//         <div className="hidden md:flex w-full md:w-1/2 justify-center px-0">
//           <img
//             src="https://cdni.iconscout.com/illustration/premium/thumb/login-security-illustration-svg-download-png-7271013.png"
//             alt="Login Illustration"
//             className="w-full max-w-lg object-contain"
//           />
//         </div>
//         {/* <div className="w-full md:w-1/2 max-w-sm lg:max-w-md xl:max-w-md bg-white rounded-2xl shadow-xl sm:p-8"> */}

//         {/* <div className="w-full sm:w-10/12 md:w-5/12 lg:w-2/3 max-w-sm lg:max-w-sm xl:max-w-sm bg-white rounded-2xl shadow-xl sm:p-8"> */}

//         <div className="w-full sm:w-10/12 md:w-6/12 lg:w-1/2 max-w-md bg-white rounded-2xl shadow-xl sm:p-8">

//           <div className="text-center mb-2">
//             <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Login</h2>
//             <p className="text-gray-500 text-sm sm:text-base">
//               Sign in to your account
//             </p>
//           </div>


//           <form onSubmit={handleSubmit} className="space-y-4">


//             <div>
//               <label className="block text-sm sm:text-base font-medium text-gray-600 mb-1">
//                 Email Address
//               </label>
//               {/* <Input
//               type="email"
//               name="email"
//               placeholder="Enter your email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
//             /> */}
//               <Input
//                 type="email"
//                 name="email"
//                 placeholder="Enter your email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm sm:text-base font-medium text-gray-600 mb-1">
//                 Password
//               </label>
//               <div className="relative">
//                 {/* <Input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   placeholder="••••••••"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
//                 /> */}

//                 <Input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   placeholder="••••••••"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                 />

//                 <button
//                   type="button"
//                   onClick={toggleShowPassword}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
//                 >
//                   {showPassword ? (
//                     <svg
//                       className="w-5 h-5 sm:w-6 sm:h-6"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l13.42 13.42"
//                       />
//                     </svg>
//                   ) : (
//                     <svg
//                       className="w-5 h-5 sm:w-6 sm:h-6"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                       />
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//                       />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//               <div className=" text-right">
//                 <Link
//                   href="/forget-password"
//                   className="tracking-tighter text-[#4f7c82] hover:underline"
//                 >
//                   Forget Password?
//                 </Link>
//               </div>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-2 sm:py-3 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
//             >
//               {loading ? "Logging in..." : "Login"}
//             </button>
//           </form>

//           {/* Signup Link */}
//           <div className="mt-2 text-center">
//             <p className="text-sm sm:text-base text-gray-600">
//               Don't have an account?{" "}
//               <Link
//                 href="/signup"
//                 className="text-[#4f7c82] font-medium hover:underline"
//               >
//                 Signup
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default memo(LoginPage);