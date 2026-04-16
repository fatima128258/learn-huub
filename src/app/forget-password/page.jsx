"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function ForgetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/forget-password", {
        email: formData.email,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4 md:px-0">
      <div className="flex flex-col md:flex-row items-start md:items-center xl:items-center 2xl:items-center md:justify-center xl:justify-center 2xl:justify-center gap-4 md:gap-6 lg:gap-8 2xl:gap-12 w-full max-w-[2560px] mx-auto md:pl-4 md:pr-10 lg:px-16 2xl:px-20">

        <div className="hidden md:flex w-full md:w-1/2 2xl:w-[45%] justify-center items-center px-0">
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/forgot-password-illustration-download-png-svg-7271014.png"
            alt="Forget Password Illustration"
            className="w-full max-w-lg 2xl:max-w-xl object-contain"
          />
        </div>

        <div className="w-full sm:w-10/12 md:w-6/12 lg:w-[40%] 2xl:w-[45%] max-w-md 2xl:max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-2">
            <h2 className="text-2xl sm:text-2xl font-semibold text-gray-800 mb-2">
              Forget Password
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Enter your email and new password to reset
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-600 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-600 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] focus:border-[#4f7c82]"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm sm:text-base">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 sm:py-3 bg-[#4f7c82] hover:bg-[#3d6166] text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-2 text-center">
            <p className="text-sm sm:text-base text-gray-600">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-[#4f7c82] font-medium hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

























// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import axios from "axios";

// export default function ForgetPasswordPage() {
//   const router = useRouter();
//   const [formData, setFormData] = useState({
//     email: "",
//     newPassword: "",
//     confirmPassword: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     setError("");
//     setSuccess("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setLoading(true);

//     // Validation
//     if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
//       setError("All fields are required");
//       setLoading(false);
//       return;
//     }

//     if (formData.newPassword !== formData.confirmPassword) {
//       setError("Passwords do not match");
//       setLoading(false);
//       return;
//     }

//     if (formData.newPassword.length < 6) {
//       setError("Password must be at least 6 characters long");
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.post("/api/auth/forget-password", {
//         email: formData.email,
//         newPassword: formData.newPassword,
//       });

//       if (response.data.success) {
//         setSuccess("Password reset successfully! Redirecting to login...");
//         setTimeout(() => {
//           router.push("/login");
//         }, 2000);
//       }
//     } catch (error) {
//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to reset password"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
//         <div className="text-center mb-8">
//           <h2 className="text-3xl font-bold text-gray-800 mb-2">
//             Forget Password
//           </h2>
//           <p className="text-gray-500">
//             Enter your email and new password to reset
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Email */}
//           <div>
//             <label className="block text-sm font-medium text-gray-600 mb-1">
//               Email Address
//             </label>
//             <input
//               type="email"
//               name="email"
//               placeholder="Enter your email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-600 mb-1">
//               New Password
//             </label>
//             <input
//               type="password"
//               name="newPassword"
//               placeholder="Enter new password"
//               value={formData.newPassword}
//               onChange={handleChange}
//               required
//               minLength={6}
//               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//             />
//           </div>

       
//           <div>
//             <label className="block text-sm font-medium text-gray-600 mb-1">
//               Confirm New Password
//             </label>
//             <input
//               type="password"
//               name="confirmPassword"
//               placeholder="Confirm new password"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               required
//               minLength={6}
//               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82]"
//             />
//           </div>

          
//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
//               {error}
//             </div>
//           )}

//           {/* Success Message */}
//           {success && (
//             <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
//               {success}
//             </div>
//           )}

//           {/* Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2 bg-[#4f7c82] text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
//           >
//             {loading ? "Resetting Password..." : "Reset Password"}
//           </button>
//         </form>

        
//         <div className="mt-6 text-center">
//           <p className="text-sm text-gray-600">
//             Remember your password?{" "}
//             <Link
//               href="/login"
//               className="text-[#4f7c82] font-medium hover:underline"
//             >
//               Login here
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

