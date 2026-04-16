"use client";

import { useState } from "react";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const days = [];
  
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() &&
           month === today.getMonth() &&
           year === today.getFullYear();
  };

  return (
    <div className="bg-white rounded-lg 2xl:h-[440px] shadow-md p-3 sm:p-4 w-full border-0 overflow-hidden">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-sm sm:text-base lg:text-lg font-medium sm:font-semibold text-gray-800">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={handleToday}
            className="text-xs text-[#4f7c82] hover:text-[#4f7c82]/80 font-medium"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 max-h-[250px] 2xl:max-h-[370px]">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-semibold text-gray-600 py-1"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`
              flex items-center justify-center text-[10px] sm:text-xs rounded-md min-h-[32px] sm:min-h-[28px] 2xl:min-h-[60px]
              ${day === null ? "text-transparent" : ""}
              ${day !== null && isToday(day)
                ? "bg-[#4f7c82] text-white font-semibold"
                : day !== null
                ? "text-gray-700 hover:bg-gray-100 cursor-pointer"
                : ""
              }
            `}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}