"use client";

import { memo } from "react";

const Input = memo(function Input({
  type = "text",
  name,
  value,
  placeholder,
  onChange,
  required = false,
  className = "",
  ...rest  
}) {
  return (
    <input
      type={type}
      name={name}
      value={value || ""}
      placeholder={placeholder}
      onChange={onChange}
      required={required}
      className={`w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none text-xs sm:text-sm text-black ${className}`}
      {...rest}  
    />
  );
});

export default Input;
























// "use client";

// import { memo } from "react";

// const Input = memo(function Input({
//   type = "text",
//   name,
//   value,
//   placeholder,
//   onChange,
//   required = false,
// }) {
//   return (
//     <input
//       type={type}
//       name={name}
//       value={value || ""}
//       placeholder={placeholder}
//       onChange={onChange}
//       required={required}
//       className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-black"
//     />
//   );
// });

// export default Input;