'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TestimonialsSection from './customertestimentional'

const CtaButton = ({ href, children, className = '' }) => {
  return (
    <Link href={href}>
      <button className={`bg-[#4CAF50] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3d6166] transition-colors ${className}`}>
        {children}
      </button>
    </Link>
  )
}

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const imageRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fade, setFade] = useState(true)
  
  const phrases = [
    'At Your Own Pace.',
    'Anytime, Anywhere.',
    'With Expert Guidance.',
    'And Earn Certificates.'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % phrases.length)
        setFade(true)
      }, 800)
    }, 4000)

    return () => clearInterval(interval)
  }, [phrases.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current)
      }
    }
  }, [])

  return (
    <>
      <section
        id='hero-section'
        className='relative w-full h-auto flex flex-col justify-center items-center overflow-visible pt-16 sm:pt-0 sm:-top-20 md:-top-10 sm:-mb-20 md:-mb-30'
      >
        {/* Decorative background elements - hidden on mobile */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none hidden sm:block'>
          <div className='absolute top-0 right-0 w-96 h-96 bg-[#4f7c82]/5 rounded-full blur-3xl'></div>
          <div className='absolute bottom-0 left-0 w-96 h-96 bg-[#4f7c82]/5 rounded-full blur-3xl'></div>
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f7c82]/3 rounded-full blur-3xl'></div>
        </div>
    
        <div
          id='hero-container'
          className='py-4 sm:py-10 flex flex-col justify-center items-center 
             md:py-6 lg:py-8 xl:py-16 2xl:py-10 relative z-10 min-h-[auto] sm:min-h-[80vh] md:min-h-[50vh] lg:min-h-[60vh] xl:min-h-[70vh] 2xl:min-h-[60vh]
             px-4 sm:px-6 lg:px-12 w-full max-w-7xl 2xl:max-w-[1800px] mx-auto box-border'
        >
          <div
            id='hero-grid'
            className='flex flex-col lg:flex-row gap-4 sm:gap-8 md:gap-6 lg:gap-6 xl:gap-8 2xl:gap-20 
               items-center justify-between w-full min-h-0 sm:min-h-[80vh] md:min-h-0'
          >
            <div
              id='left-content'
              className='w-full lg:w-1/2 flex flex-col justify-center space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 xl:space-y-6 
                 text-center lg:text-left order-1 
                 p-0 sm:p-4 md:p-6 lg:p-0 lg:pl-12 lg:pt-8'
            >
              <h1
                id='main-headline'
                className='text-xl sm:text-3xl lg:w-140 md:text-3xl lg:text-lg xl:text-4xl 2xl:text-5xl 
                  font-medium md:font-normal text-[#303031] tracking-tight 2xl:w-auto 2xl:max-w-none leading-tight'
              >
                Learn From Expert Instructors <br className='hidden lg:block' />{' '}
                <span className={`inline-block min-w-[200px] sm:min-w-[250px] lg:min-w-[300px] transition-opacity duration-700 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}>
                  {phrases[currentIndex]}
                </span>
              </h1>
              
              <p
                id='hero-description'
                className='text-xs sm:text-base md:text-lg lg:text-base xl:text-sm 2xl:text-xl 
                   !font-SF-Pro-Display text-gray-500 tracking-tighter leading-relaxed'
              >
                Access High-Quality Video Courses, Interactive Labs, Activities & Quizzes. Track <br className='hidden lg:block' /> Your Progress And Earn Certificates.
              </p>
              <div className='w-full flex justify-center lg:justify-start mb-4'>
                <TestimonialsSection />
              </div>
              <CtaButton
                href='/signup'
                variant='solid'
                size='md'
                className='mt-4 sm:mt-4 w-36 sm:w-40 text-sm tracking-tighter bg-[#4f7c82] lg:text-sm sm:text-base mx-auto lg:mx-0 !font-SF-Pro-Display hover:bg-[#3d6166]'
              >
                Get Started
              </CtaButton>
            </div>

            <div
              id='right-content'
              className='hidden lg:flex w-full lg:w-1/2 items-center justify-center order-2 p-4 2xl:pr-0 lg:pr-8'
            >
              <div className='relative w-full max-w-[350px] md:max-w-[380px] lg:max-w-[380px] xl:max-w-[420px] 2xl:max-w-[700px]'>
                <Image
                  src='https://media.istockphoto.com/id/2000672702/photo/happy-smiling-mature-indian-or-latin-business-man-ceo-trader-using-computer-typing-working-in.jpg?s=612x612&w=0&k=20&c=cQ7M4YxnYYDTKzYMS6pKjmZAH-9LpXjcMmJJyhT6LE0='
                  alt='Student learning online'
                  width={1200}
                  height={900}
                  className='rounded-2xl shadow-2xl object-cover w-full h-auto max-h-[350px] lg:max-h-[380px] xl:max-h-[420px]'
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default HeroSection