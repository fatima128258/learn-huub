'use client';
import FeatureCard from "./Featurecard";

const defaultFeatures = [
    {
        id: 1,
        title: 'Expert-Led Courses',
        description:
            'Learn from industry experts and experienced instructors. Our courses are designed to give you practical knowledge and skills.',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 sm:w-14 sm:h-14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l9-5-9-5-9 5 9 5zM12 12v8M21 7l-9 5-9-5" />
            </svg>
        ),
    },
    {
        id: 2,
        title: 'Learn Anytime, Anywhere',
        description:
            "Access our platform from any device, at any time. Study at your own pace and never miss a lesson.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 sm:w-14 sm:h-14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18M3 12h18M3 16h18" />
            </svg>
        ),
    },
    {
        id: 3,
        title: 'Interactive & Engaging',
        description:
            'Quizzes, assignments, and interactive exercises to make learning fun and effective.',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 sm:w-14 sm:h-14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        ),
    },
];



export default function Section3() {
    return (
        <div
            id="desktop2-section"
            className="relative py-6 sm:py-10 lg:py-12 2xl:py-10 flex items-center bg-gray-50 justify-center overflow-hidden"
        >
            <div className='w-full max-w-7xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-24 flex flex-col items-center justify-center overflow-hidden'>
                {/* Header Section */}
                <div className='text-center sm:mb-12'>
                    <div className='inline-block tracking-tight text-[#4f7c82] font-[500] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm md:text-base mb-1 sm:mb-4'>
                        LEARN & GROW
                    </div>
                    <h2 className='text-xl sm:text-2xl md:text-2xl lg:text-3xl 2xl:text-4xl font-semibold text-[#303031] sm:mb-6 leading-[1.5] tracking-tight'>
                        <span>Interactive Online Courses</span>{' '}
                        <br className='hidden sm:block' />{' '}
                        To Boost Your Skills & Knowledge
                    </h2>
                </div>

               
                {/* Mobile/Tablet View */}
                <div className='block lg:hidden w-full pt-4 md:pt-0 px-2 sm:px-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2  md:grid-cols-3 gap-4 sm:gap-6 mb-8'>
                        {defaultFeatures.map((feature) => (
                            <FeatureCard
                                key={feature.id}
                                title={feature.title}
                                description={feature.description}
                                icon={feature.icon}
                                width="w-full"
                                height="h-auto min-h-[220px] sm:min-h-[240px]"
                                className="transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
                            />
                        ))}
                    </div>
                </div>

                {/* Desktop View - 3 Cards */}
                <div className='hidden lg:grid lg:grid-cols-3 justify-center items-stretch gap-6 sm:gap-8 lg:gap-8 xl:gap-6 2xl:gap-8 mb-8 sm:mb-10 lg:mb-12 w-full'>
                    {defaultFeatures.map((feature) => (
                        <FeatureCard
                            key={feature.id}
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                            width="w-full"
                            height="h-auto min-h-[240px] sm:min-h-[240px] lg:min-h-[250px] 2xl:min-h-[280px]"
                            className="
    transition-all duration-300 ease-out
    hover:-translate-y-1
    hover:shadow-lg
    hover:scale-[1.01]
  "
                        />
                    ))}
                </div>
            </div>

            <style jsx global>{`
        .desktop2-swiper {
          width: 100% !important;
          height: auto !important;
          overflow: hidden !important;
          padding: 0 !important;
        }
        .desktop2-swiper .swiper-wrapper {
          align-items: center !important;
          display: flex !important;
          height: auto !important;
        }
        .swiper-slide {
          filter: none;
          transition: filter 0.3s ease-in-out;
        }
        .swiper-slide.swiper-slide-prev,
        .swiper-slide.swiper-slide-next {
          filter: blur(7px);
        }
        .desktop2-swiper .swiper-slide {
          height: auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          flex-shrink: 0 !important;
        }
        .desktop2-swiper .swiper-pagination-bullet {
          background: #5057ea !important;
          opacity: 0.5 !important;
          width: 12px !important;
          height: 12px !important;
          margin: 0 6px !important;
        }
        .desktop2-swiper .swiper-pagination-bullet-active {
          opacity: 1 !important;
          background: #5057ea !important;
        }
      `}</style>
        </div>
    )
}