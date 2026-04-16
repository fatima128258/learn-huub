import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[#4f7c82] text-white hover:bg-[#3d6166]',
    secondary: 'bg-black text-white hover:bg-gray-900',
    danger: 'bg-black text-white hover:bg-gray-900',
    outline: 'bg-transparent border-2 border-[#4f7c82] text-[#4f7c82] hover:bg-[#4f7c82] hover:text-white',
    success: 'bg-[#4f7c82] text-white hover:bg-[#3d6166]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

