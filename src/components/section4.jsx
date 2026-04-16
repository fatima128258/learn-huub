'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { useRef, useState } from 'react'


import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'


const fallbackAudiences = [
    {
        id: 1,
        title: 'Beginners',
        image: 'https://img.freepik.com/free-photo/book-composition-with-open-book_23-2147690555.jpg?semt=ais_hybrid&w=740&q=80',
        description:
            'Start your learning journey with our beginner-friendly courses. Get the fundamentals right and build a strong foundation in any skill.',
        hasDescription: true
    },
    {
        id: 2,
        title: 'Working Professionals',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbjB-taUsDcj48pLiChIivSJY6nxPeH19pqQ&s',
        description:
            'Upgrade your career skills with flexible online courses. Learn at your own pace and gain practical knowledge to stay ahead in your field.',
        hasDescription: true
    },
    {
        id: 3,
        title: 'Students',
        image: 'https://media.istockphoto.com/id/499924122/photo/e-learning-concept-with-a-teacher-presenting-online-education-program.jpg?s=612x612&w=0&k=20&c=9zr-SHF6kpOaY4jb3bPXAs2iQum9VxxSPlQsrrqZzng=',
        description:
            'Boost your academic performance with interactive courses and exercises. Get access to quizzes, assignments, and expert guidance anytime.',
        hasDescription: true
    },
    {
        id: 4,
        title: 'Lifelong Learners',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSysFQmdYBzzpcDxxFyg8DhYibmvx69xYBu_w&s',
        description:
            'Keep learning new skills for personal growth and curiosity. Our platform offers engaging courses for continuous development at any age.',
        hasDescription: true
    },
    {
        id: 5,
        title: 'Career Changers',
        image: 'https://media.istockphoto.com/id/1500285927/photo/young-woman-a-university-student-studying-online.jpg?s=612x612&w=0&k=20&c=yvFDnYMNEJ6WEDYrAaOOLXv-Jhtv6ViBRXSzJhL9S_k=',
        description:
            'Transition to a new career with confidence. Our comprehensive courses help you acquire in-demand skills and make a successful career pivot.',
        hasDescription: true
    },
    // {
    //     id: 6,
    //     title: 'Entrepreneurs',
    //     image: 'https://media.istockphoto.com/id/1500285927/photo/young-woman-a-university-student-studying-online.jpg?s=612x612&w=0&k=20&c=yvFDnYMNEJ6WEDYrAaOOLXv-Jhtv6ViBRXSzJhL9S_k=',
    //     description:
    //         'Build your business with expert knowledge. Learn business strategies, marketing, and management skills to launch and grow your venture.',
    //     hasDescription: true
    // }
]

const fallbackImages = [
    '/image1.png',
    '/image2.png',
    '/image3.png',
    '/image4.png'
]

const Section4 = ({ audiences = null }) => {
    const swiperRef = useRef(null)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [scaledPreview, setScaledPreview] = useState(null) 

    const audienceData = audiences || fallbackAudiences

    return (
        <section
            id='target-audience-section'
            className='relative flex items-center justify-center overflow-visible py-6 sm:py-10 lg:py-12 2xl:py-10'
        >

            {/* Content Container */}
            <div
                id='audience-content-container'
                className='relative z-10 w-full max-w-7xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-24'
            >
                {/* Header Section */}
                <div
                    id='audience-header'
                    className='flex flex-col items-start gap-6 lg:gap-8 mb-8 lg:mb-10'
                >
             
                    <div
                        id='header-text'
                        className='flex flex-col text-left'
                    >
                        <p className='inline-block tracking-tight text-[#4f7c82] font-[500] rounded-full text-xs sm:text-sm md:text-base mb-1 sm:mb-4'>
                            CAREER BOOST
                        </p>

                        <h2 className='text-xl sm:text-2xl md:text-2xl lg:text-3xl 2xl:text-4xl font-semibold text-[#303031] sm:mb-6 leading-[1.5] tracking-tighter'>
                            <span>Upskill With Our Online Courses</span>{' '}
                            <br className='hidden sm:block' />{' '}
                            And Achieve Your Goals
                        </h2>
                    </div>
                </div>

                
                <div className='block lg:hidden mb-4 mt-2'>
                
                    <div className='mb-4 pt-4 pb-2'>
                        <div className='flex justify-center items-center gap-2 overflow-x-auto pb-2 px-4 py-1'>
                            {/* All Preview Cards */}
                            {audienceData.map((audience, index) => {
                                const imageSrc =
                                    audience.image ||
                                    fallbackImages[index % fallbackImages.length]
                                const isCurrent = index === currentSlide
                                const isScaled = scaledPreview === index

                                return (
                                    <div
                                        key={`preview-${audience.id}`}
                                        className={`bg-white rounded-lg shadow-md overflow-hidden h-16 w-12 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg flex-shrink-0 transform ${isScaled
                                            ? 'scale-125 z-10 opacity-100 ring-2 ring-[#4f7c82]'
                                            : isCurrent
                                                ? 'opacity-100 ring-1 ring-[#4f7c82] scale-100 hover:scale-110'
                                                : 'opacity-60 hover:opacity-80 scale-95 hover:scale-105'
                                            }`}
                                        onClick={() => {
                                            if (isScaled) {
                                                setScaledPreview(null) // Click again to unscale
                                            } else {
                                                // setScaledPreview(index) // Scale this card
                                                setCurrentSlide(index)
                                                swiperRef.current?.swiper?.slideTo(index)
                                            }
                                        }}
                                    >
                                        <div className='relative  h-full w-full'>
                                            <Image
                                                src={imageSrc}
                                                alt={audience.title}
                                                width={48}
                                                height={64}
                                                className='object-cover w-full h-full transition-transform duration-300 hover:scale-105'
                                            />
                                            {/* Card number indicator */}
                                            <div
                                                className={`absolute top-1 left-1 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center transition-all duration-300 ${isScaled
                                                    ? 'bg-green-500 animate-bounce'
                                                    : isCurrent
                                                        ? 'bg-[#4f7c82] animate-pulse'
                                                        : 'bg-black/50'
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            {/* Title overlay */}
                                            <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 transition-opacity duration-300'>
                                                <p className='text-white text-xs font-SF-Pro-Display font-medium truncate leading-tight'>
                                                    {audience.title.split(' ')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Main Card - Full Width */}
                    <div className='w-full px-4'>
                        <Swiper
                            ref={swiperRef}
                            modules={[Navigation, Pagination, Autoplay]}
                            spaceBetween={20}
                            slidesPerView={1}
                            loop={true}
                            grabCursor={true}
                            allowTouchMove={true}
                            simulateTouch={true}
                            autoplay={{
                                delay: 4000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            }}
                            onSlideChange={swiper => setCurrentSlide(swiper.activeIndex)}
                            className='audience-swiper h-[400px] w-full'
                        >
                            {audienceData.map((audience, index) => {
                                const imageSrc =
                                    audience.image ||
                                    fallbackImages[index % fallbackImages.length]

                                return (
                                    <SwiperSlide key={audience.id}>
                                        <div className='bg-white rounded-2xl shadow-lg overflow-hidden h-[350px] sm:h-[400px] w-full mx-auto max-w-sm'>
                                            <div className='relative h-full w-full'>
                                                <Image
                                                    src={imageSrc}
                                                    alt={audience.title}
                                                    fill
                                                    className='object-cover'
                                                />

                                                {/* Overlay with Title and Description */}
                                                <div className='absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent'>
                                                    <div className='p-4 sm:p-6'>
                                                        <h3 className='text-xl sm:text-2xl font-semibold text-white mb-3'>
                                                            {audience.title}
                                                        </h3>
                                                        {audience.hasDescription && (
                                                            <p className='text-base font-SF-Pro-Display text-white/90 leading-relaxed line-clamp-4 w-[90%]'>
                                                                {audience.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </SwiperSlide>
                                )
                            })}
                        </Swiper>
                    </div>

                    {/* Pagination */}
                    <div className='flex justify-center gap-2 mt-6'>
                        {audienceData.map((_, index) => (
                            <button
                                key={index}
                                className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-[#4f7c82]' : 'bg-gray-300'
                                    }`}
                                onClick={() => {
                                    setCurrentSlide(index)
                                    swiperRef.current?.swiper?.slideTo(index)
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Desktop Grid View */}
                {/* <div className='hidden lg:block px-4 lg:px-8 xl:px-12 2xl:px-0'> */}
                <div className='hidden lg:block '>

                    <div
                        id='audience-cards-grid'
                        className='grid lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 justify-center gap-6 lg:gap-4 xl:gap-4 2xl:gap-8 '
                    >
                        {(audiences || fallbackAudiences).slice(0, 4).map((audience, index) => {
                            const imageSrc =
                                audience.image || fallbackImages[index % fallbackImages.length]

                            return (
                                <div
                                    key={audience.id}
                                    id={`audience-card-${audience.id}`}
                                    className='group bg-white rounded-2xl w-full h-[280px] lg:h-[280px] xl:h-[290px] 2xl:h-[340px] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden'
                                >
                                    {/* Card Image with Text Overlay */}
                                    <div
                                        id={`card-image-${audience.id}`}
                                        className='relative h-full w-full overflow-hidden'
                                    >
                                        <Image
                                            src={imageSrc}
                                            alt={audience.title}
                                            fill
                                            className='object-cover'
                                        />

                                        {/* Default Light Overlay - Always Visible */}
                                        <div
                                            id={`card-default-overlay-${audience.id}`}
                                            className='absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/20 via-black/10 to-transparent z-20'
                                        >
                                            {/* Default Title - Always Visible */}
                                            <div className='absolute p-6 text-white'>
                                                <h3 className='2xl:text-2xl xl:pb-2 xl:text-lg 2xl:font-md tracking-tight xl:font-md'>
                                                    {audience.title}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Hover Dark Overlay - Appears on Hover */}
                                        <div
                                            id={`card-hover-overlay-${audience.id}`}
                                            className='absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/50 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-10'
                                        >
                                            <div
                                                id={`card-overlay-content-${audience.id}`}
                                                className='absolute bottom-6 left-6 right-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out'
                                            >
                                                {/* Description at Top (only for first card) */}
                                                {audience.hasDescription && (
                                                    <div
                                                        id={`card-description-container-${audience.id}`}
                                                        className='mt-5'
                                                    >
                                                        <p
                                                            id={`card-description-${audience.id}`}
                                                            className='2xl:text-base xl:pb-6 xl:text-sm leading-tighter xl:text-[12px]  2xl:leading-[1.8] xl:leading-[1.5] font-SF-Pro-Display font-light text-white mb-8'
                                                        >
                                                            {audience.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {/* 5th Card - Only on 2xl */}
                        {(audiences || fallbackAudiences)[4] && (
                            <div
                                key={(audiences || fallbackAudiences)[4].id}
                                id={`audience-card-${(audiences || fallbackAudiences)[4].id}`}
                                className='hidden 2xl:block group bg-white rounded-2xl w-full h-[340px] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden'
                            >
                                {/* Card Image with Text Overlay */}
                                <div
                                    id={`card-image-${(audiences || fallbackAudiences)[4].id}`}
                                    className='relative h-full w-full overflow-hidden'
                                >
                                    <Image
                                        src={(audiences || fallbackAudiences)[4].image || fallbackImages[4 % fallbackImages.length]}
                                        alt={(audiences || fallbackAudiences)[4].title}
                                        fill
                                        className='object-cover'
                                    />

                                    {/* Default Light Overlay - Always Visible */}
                                    <div
                                        id={`card-default-overlay-${(audiences || fallbackAudiences)[4].id}`}
                                        className='absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/20 via-black/10 to-transparent z-20'
                                    >
                                        {/* Default Title - Always Visible */}
                                        <div className='absolute p-6 text-white'>
                                            <h3 className='2xl:text-2xl xl:pb-2 xl:text-lg 2xl:font-md tracking-tight xl:font-md'>
                                                {(audiences || fallbackAudiences)[4].title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Hover Dark Overlay - Appears on Hover */}
                                    <div
                                        id={`card-hover-overlay-${(audiences || fallbackAudiences)[4].id}`}
                                        className='absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/50 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-10'
                                    >
                                        <div
                                            id={`card-overlay-content-${(audiences || fallbackAudiences)[4].id}`}
                                            className='absolute bottom-6 left-6 right-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out'
                                        >
                                            {/* Description at Top */}
                                            {(audiences || fallbackAudiences)[4].hasDescription && (
                                                <div
                                                    id={`card-description-container-${(audiences || fallbackAudiences)[4].id}`}
                                                    className='mt-5'
                                                >
                                                    <p
                                                        id={`card-description-${(audiences || fallbackAudiences)[4].id}`}
                                                        className='2xl:text-base xl:pb-6 xl:text-sm leading-tighter xl:text-[12px]  2xl:leading-[1.8] xl:leading-[1.5] font-SF-Pro-Display font-light text-white mb-8'
                                                    >
                                                        {(audiences || fallbackAudiences)[4].description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <style jsx global>{`
        .audience-swiper {
          width: 100%;
          height: 400px;
          overflow: hidden;
        }
        .audience-swiper .swiper-wrapper {
          display: flex;
          align-items: center;
        }
        .audience-swiper .swiper-slide {
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          flex-shrink: 0;
        }
        .audience-swiper .swiper-container {
          overflow: hidden;
        }

        /* Custom animations */
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
            transform: scale(1.05);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.08);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        /* Smooth card transitions */
        .preview-card-enter {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
        }

        .preview-card-enter-active {
          opacity: 1;
          transform: scale(1) translateY(0);
          transition: all 300ms ease-out;
        }

        .preview-card-exit {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        .preview-card-exit-active {
          opacity: 0;
          transform: scale(0.8) translateY(-20px);
          transition: all 300ms ease-in;
        }

        /* Hover effects */
        .preview-card:hover {
          transform: scale(1.1) translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        /* Smooth image transitions */
        .preview-image {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .preview-image:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }

        /* Desktop cards animation */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        #audience-cards-grid > div {
          animation: slideInUp 0.6s ease-out forwards;
        }

        #audience-cards-grid > div:nth-child(1) {
          animation-delay: 0.1s;
        }

        #audience-cards-grid > div:nth-child(2) {
          animation-delay: 0.2s;
        }

        #audience-cards-grid > div:nth-child(3) {
          animation-delay: 0.3s;
        }

        #audience-cards-grid > div:nth-child(4) {
          animation-delay: 0.4s;
        }

        #audience-cards-grid > div:nth-child(5) {
          animation-delay: 0.5s;
        }
      `}</style>
        </section>
    )
}

export default Section4
