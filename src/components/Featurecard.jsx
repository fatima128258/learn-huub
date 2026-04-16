'use client'

import Image from 'next/image'

const FeatureCard = ({
    title,
    description,
    icon = null, // SVG or Image
    width = 'w-full max-w-[330px]',
    height = 'h-auto min-h-[250px]',
    className = ''
}) => {
    return (
        <div
            className={`flex flex-col items-center rounded-xl pt-6 sm:pt-8 pb-6 sm:pb-8 px-6 sm:px-8 transition-all duration-300 shadow-[0_-2px_8px_rgba(0,0,0,0.06),0_10px_25px_rgba(0,0,0,0.15)] ${width} ${height} ${className}`}
        >
            {/* Icon with colored circular background */}
            {icon && (
                <div className="mb-4 w-14 h-14 sm:w-18 sm:h-18 flex items-center justify-center rounded-lg bg-[#4f7c82] p-2">
                    {icon}
                </div>
            )}

            {/* Title */}
            <h3 className='text-lg sm:text-xl lg:text-xl xl:text-xl 2xl:text-2xl font-[510] text-black mb-3 sm:mb-4 text-center tracking-tight'>
                {title}
            </h3>

            {/* Description */}
            <p className='text-[#7f7f81] tracking-tight text-sm sm:text-base lg:text-sm xl:text-sm 2xl:text-lg leading-[1.6] sm:leading-[1.6] lg:leading-[1.6] xl:leading-[1.7] 2xl:leading-[1.7] text-center w-full font-SF-Pro-Display flex-1'>
                {description}
            </p>
        </div>
    )
}

export default FeatureCard