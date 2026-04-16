"use client";

import { Button } from "@/components/Button";
import Link from "next/link";

export default function SignupCard({
  href,
  icon,
  title,
  description,
  buttonText,
  hoverBorder,
  buttonClass,
  iconBg,
  iconColor,
}) {
  return (
    <Link href={href} className="group">
      <div
        className={`h-full bg-white rounded-2xl shadow-md p-4 sm:p-5 border-2 border-transparent 
        transition-all duration-300 ${hoverBorder} group-hover:shadow-xl`}
      >
        <div className="text-center flex flex-col h-full">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 ${iconBg} rounded-full 
            flex items-center justify-center mx-auto mb-2`}
          >
            <div className={`${iconColor}`}>{icon}</div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {title}
          </h2>

          <p className="text-sm sm:text-base tracking-tighter text-gray-600 mb-4">
            {description}
          </p>

          <Button className={`w-full ${buttonClass}`}>
            {buttonText}
          </Button>
        </div>
      </div>
    </Link>
  );
}