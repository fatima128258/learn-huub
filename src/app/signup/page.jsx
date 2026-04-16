










"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import SignupCard from "@/components/Signupcard";



export default function SignupPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6 lg:py-10 overflow-y-auto hide-scrollbar">
      <div className="w-full max-w-lg sm:max-w-2xl lg:max-w-4xl 2xl:max-w-5xl">

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Create Your Account
          </h1>
          <p className="text-sm text-gray-600">
            Choose your account type to get started
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 sm:gap-8">

          {/* Student */}
          <Link href="/signup/student" className="group">
            <div className="h-full bg-white rounded-2xl shadow-md p-4 sm:p-5 border-2 border-transparent 
              transition-all duration-300 group-hover:border-[#4f7c82] group-hover:shadow-xl">

              <div className="text-center flex flex-col h-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#4f7c82]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-[#4f7c82]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
                      C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13
                      C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13
                      C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>

                <h2 className="text-xl sm:text-xl font-semibold text-gray-800 mb-2">
                  Student Signup
                </h2>

                <p className="text-sm sm:text-base tracking-tighter text-gray-600 mb-2 flex-grow">
                  Join as a student to access courses, learn new skills, and grow your knowledge.
                </p>

                <Button className="w-full bg-[#4f7c82] hover:bg-[#446b70]">
                  Sign up as Student
                </Button>
              </div>
            </div>
          </Link>

          {/* Instructor */}
          <Link href="/signup/instructor" className="group">
            <div className="h-full bg-white rounded-2xl shadow-md p-4 sm:p-5 border-2 border-transparent 
              transition-all duration-300 group-hover:border-black group-hover:shadow-xl">

              <div className="text-center flex flex-col h-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15
                      c-3.183 0-6.22-.62-9-1.745M16 6V4
                      a2 2 0 00-2-2h-4a2 2 0 00-2 2v2
                      m4 6h.01M5 20h14a2 2 0 002-2V8
                      a2 2 0 00-2-2H5a2 2 0 00-2 2v10
                      a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <h2 className="text-xl sm:text-xl font-semibold text-gray-800 mb-2">
                  Instructor Signup
                </h2>

                <p className="text-sm sm:text-base tracking-tighter text-gray-600 mb-6 flex-grow">
                  Join as an instructor to create courses, teach students, and share your expertise.
                </p>

                <Button
                  variant="secondary"
                  className="w-full border-[#4f7c82] text-[#4f7c82] hover:bg-[#4f7c82]/10"
                >
                  Sign up as Instructor
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Login */}
        <div className="text-center pt-6">
          <p className="text-sm sm:text-base text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-gray-800 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



// "use client";

// import Link from "next/link";
// import { Button } from "@/components/Button";
// import SignupCard from "@/components/Signupcard";



// export default function SignupPage() {
//   return (
//     <div className="flex items-start lg:items-start justify-center px-4 py-6 lg:py-10">

//       <div className="w-full max-w-lg sm:max-w-2xl lg:max-w-4xl">

//         < div className="text-center mb-6" >
//           <h1 className="text-2xl sm:text-2xl md:text-3xl font-semibold text-gray-900 ">
//             Create Your Account
//           </h1>
//           <p className="text-sm text-gray-600">
//             Choose your account type to get started
//           </p>
//         </div >

//         {/* Cards */}
//         < div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 sm:gap-8" >

//           {/* Student */}
//           < Link href="/signup/student" className="group" >
//             <div className="h-full bg-white rounded-2xl shadow-md p-4 sm:p-5 border-2 border-transparent 
//               transition-all duration-300 group-hover:border-[#4f7c82] group-hover:shadow-xl">

//               <div className="text-center flex flex-col h-full">
//                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#4f7c82]/10 rounded-full flex items-center justify-center mx-auto mb-2">
//                   <svg
//                     className="w-8 h-8 sm:w-10 sm:h-10 text-[#4f7c82]"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
//                       C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13
//                       C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13
//                       C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
//                     />
//                   </svg>
//                 </div>

//                 <h2 className="text-xl sm:text-xl font-semibold text-gray-800 mb-2">
//                   Student Signup
//                 </h2>

//                 <p className="text-sm sm:text-base tracking-tighter text-gray-600 mb-2 flex-grow">
//                   Join as a student to access courses, learn new skills, and grow your knowledge.
//                 </p>

//                 <Button className="w-full bg-[#4f7c82] hover:bg-[#446b70]">
//                   Sign up as Student
//                 </Button>
//               </div>
//             </div>
//           </Link >

//           {/* Instructor */}
//           < Link href="/signup/instructor" className="group" >
//             <div className="h-full bg-white rounded-2xl shadow-md p-4 sm:p-5 border-2 border-transparent 
//               transition-all duration-300 group-hover:border-black group-hover:shadow-xl">

//               <div className="text-center flex flex-col h-full">
//                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-2">
//                   <svg
//                     className="w-8 h-8 sm:w-10 sm:h-10 text-black"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M21 13.255A23.931 23.931 0 0112 15
//                       c-3.183 0-6.22-.62-9-1.745M16 6V4
//                       a2 2 0 00-2-2h-4a2 2 0 00-2 2v2
//                       m4 6h.01M5 20h14a2 2 0 002-2V8
//                       a2 2 0 00-2-2H5a2 2 0 00-2 2v10
//                       a2 2 0 002 2z"
//                     />
//                   </svg>
//                 </div>

              
//                 <h2 className="text-xl sm:text-xl font-semibold text-gray-800 mb-2">
//                   Instructor Signup
//                 </h2>

//                 <p className="text-sm sm:text-base tracking-tighter text-gray-600 mb-6 flex-grow">
//                   Join as an instructor to create courses, teach students, and share your expertise.
//                 </p>

//                 <Button
//                   variant="secondary"
//                   className="w-full border-[#4f7c82] text-[#4f7c82] hover:bg-[#4f7c82]/10"
//                 >
//                   Sign up as Instructor
//                 </Button>
//               </div>
//             </div>
//           </Link >
//         </div >

//         {/* Login */}
//         < div className="text-center pt-6" >
//           <p className="text-sm sm:text-base text-gray-600">
//             Already have an account?{" "}
//             <Link href="/login" className="font-semibold text-gray-800 hover:underline">
//               Login here
//             </Link>
//           </p>
//         </div >
//       </div >
//     </div >
//   );
// }