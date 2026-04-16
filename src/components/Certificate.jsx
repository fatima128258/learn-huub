"use client";

import { useRef } from "react";

export default function Certificate({ studentName, playlistTitle, instructorName, completionDate }) {
  const certificateRef = useRef(null);

  const handleDownload = () => {
    if (typeof window === "undefined") return;
    
    import("html2canvas").then((html2canvas) => {
      const certificate = certificateRef.current;
      if (!certificate) return;

      html2canvas.default(certificate, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `certificate-${playlistTitle.replace(/\s+/g, "-")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    });
  };

  const formattedDate = completionDate
    ? new Date(completionDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-1 sm:p-2 md:p-3">
      <div
        ref={certificateRef}
        className="w-full max-w-4xl bg-white border-2 sm:border-4 md:border-6 border-double border-[#C9A961] p-2 sm:p-4 md:p-4 relative"
        style={{ aspectRatio: "1.414/1" }}
      >
        
        {/* <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#C9A961]"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#C9A961]"></div> */}
        {/* <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#C9A961]"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#C9A961]"></div> */}

     
        <div className="flex flex-col items-center justify-center h-full text-center space-y-0.5 sm:space-y-1 md:space-y-1.5 pt-1 sm:pt-2 md:pt-2">
         
          <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-[#C9A961] tracking-wider">
            CERTIFICATE
          </h1>
          <h2 className="text-[10px] sm:text-base md:text-lg font-semibold text-gray-800 tracking-wide">
            OF COMPLETION
          </h2>

          
          <div className="w-10 sm:w-16 md:w-20 h-0.5 bg-[#C9A961] my-0.5 sm:my-1 md:my-1"></div>

         
          <p className="text-[9px] sm:text-xs md:text-sm text-gray-600 max-w-md">
            This is to certify that
          </p>

         
          <h3 className="text-xs sm:text-lg md:text-xl font-bold text-[#C9A961] italic px-2 sm:px-4 md:px-6 py-0.5">
            {studentName}
          </h3>

          
          <p className="text-[9px] sm:text-xs md:text-sm text-gray-700 max-w-2xl leading-relaxed">
            Has successfully completed the
          </p>
          <h4 className="text-[10px] sm:text-base md:text-lg font-bold text-gray-800 uppercase tracking-wide px-2 sm:px-4 md:px-6">
            {playlistTitle}
          </h4>

        
          <p className="text-[9px] sm:text-[11px] md:text-xs text-gray-600 mt-0.5 sm:mt-0.5 md:mt-1">{formattedDate}</p>

    
          <div className="mt-1 sm:mt-2 md:mt-2.5 relative">
            <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#C9A961] flex items-center justify-center relative">
              <div className="w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#C9A961]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
    
            {/* <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              <div className="w-6 h-10 bg-[#C9A961] clip-ribbon"></div>
              <div className="w-6 h-10 bg-[#C9A961] clip-ribbon"></div>
            </div> */}
          </div>

          <div className="mt-1.5 sm:mt-3 md:mt-3.5 pt-1.5 sm:pt-2 md:pt-2.5 border-t border-gray-300 w-28 sm:w-40 md:w-48">
            <p className="text-[8px] sm:text-[10px] md:text-[11px] text-gray-600 italic">Instructor</p>
            <p className="text-[9px] sm:text-xs md:text-sm font-semibold text-gray-800 mt-0.5">
              {instructorName}
            </p>
          </div>
        </div>
      </div>

     
      <button
        onClick={handleDownload}
        className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-[#4f7c82] text-white font-normal rounded-lg hover:bg-[#42686d] transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-sm"
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download Certificate
      </button>

      <style jsx>{`
        .clip-ribbon {
          clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%);
        }
      `}</style>
    </div>
  );
}
