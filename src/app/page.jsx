'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '@/components/layout/Footer';

const Section2 = dynamic(() => import('@/components/Section22'), {
  loading: () => <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>
});
const Section3 = dynamic(() => import('@/components/section3'));
const Section4 = dynamic(() => import('@/components/section4'));
const Section5 = dynamic(() => import('@/components/section5'));


export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
   
    fetch('/api/init')
      .then(res => res.json())
      .then(data => console.log('Admin initialization:', data))
      .catch(err => console.error('Admin initialization error:', err));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-y-auto hide-scrollbar">
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
      <Footer />
    </div>
  );
}






















// 'use client';

// import Link from 'next/link';
// import { Button } from '@/components/Button';
// import FeatureCard from '@/components/featurecard';
// import Footer from '@/components/layout/Footer';
// // import 'swiper/css'
// // import 'swiper/css/pagination'
// // import 'swiper/css/effect-cards'
// // import 'swiper/css'

// const cards = [
//   {
//     icon: '🚀',
//     title: 'Fast & Reliable',
//     desc: 'Built with modern technology for maximum performance.',
//   },
//   {
//     icon: '🔒',
//     title: 'Secure',
//     desc: 'Industry-standard security for your data.',
//   },
//   {
//     icon: '💡',
//     title: 'Easy to Use',
//     desc: 'Simple and intuitive interface.',
//   },
// ];

// const defaultFeatures = [
//   {
//     id: 1,
//     image: '/plane3.png',
//     width: 60,
//     height: 60,
//     title: 'Genuine Dummy Ticket',
//     description:
//       'Our Service Provides Genuine Dummy Flight Ticket That Meet Visa And Immigration Requirements, Offering Peace Of Mind With Real, Verifiable Bookings. Each Reservation Is Issued By An Authentic Airline, Ensuring Reliability And Compliance With Your Documentation Needs.'
//   },
//   {
//     id: 2,
//     image: '/e2.png',
//     width: 50,
//     height: 50,
//     title: 'Worldwide Flight',
//     description:
//       "With Access To Flights Across The Globe, We Provide Dummy Ticket For All Major Destinations. No Matter Where You're Headed, Our Service Can Secure A Genuine Dummy Flight Ticket Booking With Worldwide Availability."
//   },
//   {
//     id: 3,
//     image: '/done.svg',
//     width: 60,
//     height: 60,
//     title: 'Hassle Free Process',
//     description:
//       'Our Streamlined, User-Friendly Process Allows You To Secure A Dummy Flight Ticket In Just A Few Clicks. With A Simple Online Form And Quick Confirmation, We Eliminate The Usual Complexities, Making It Easy For You To Get The Documentation You Need Quickly And Efficiently.'
//   }
// ]

// export default function LandingPage() {
//   return (
//     <div>
//       <div className="min-h-screen bg-white flex flex-col">
//         <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-grow">

//           {/* Hero Section */}
//           <div className="text-center py-14 sm:py-20">
//             <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-black mb-4 sm:mb-6">
//               Welcome to Your
//               <span className="text-[#4f7c82]"> App</span>
//             </h1>

//             <p className="text-base sm:text-lg md:text-xl text-black/70 mb-6 sm:mb-8 max-w-lg md:max-w-xl mx-auto">
//               Build amazing things with our powerful platform.
//             </p>

//             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//               <Link href="/signup">
//                 <Button variant="primary" className="px-8 py-3 text-lg">
//                   Get Started
//                 </Button>
//               </Link>

//               <Link href="/login">
//                 <Button variant="secondary" className="px-8 py-3 text-lg">
//                   Sign In
//                 </Button>
//               </Link>
//             </div>
//           </div>

//           {/* Ribbon Cards Section */}
//           {/* Ribbon Cards Section */}
//           <div className="py-14 sm:py-20 overflow-hidden">

//             <div className="flex gap-6 animate-ribbon pl-6 sm:pl-10 lg:pl-16">
//               {[...cards, ...cards].map((card, index) => (
//                 <div
//                   key={index}
//                   className="bg-white p-6 rounded-lg shadow-md min-w-[300px] lg:min-w-[360px] text-center"

//                 >
//                   <div className="text-4xl mb-4">{card.icon}</div>
//                   <h3 className="text-xl font-semibold mb-2">
//                     {card.title}
//                   </h3>
//                   <p className="text-black/70 text-sm">
//                     {card.desc}
//                   </p>
//                 </div>
//               ))}
//             </div>

//           </div>


//         </div>

//         <div
//           id="desktop2-section"
//           className="relative min-h-screen 2xl:min-h-[60vh] flex items-center justify-center overflow-hidden"
//         >

//           <div className='w-full max-w-[3200px] mx-auto'>
//             {/* Background Elements */}
//             <div className='absolute inset-0 z-0'>
//               {/* <Image
//               src='/Desktop2.png'
//               alt='Background'
//               fill
//               className='object-cover'
//               priority
//             /> */}
//             </div>
//             {/* Overlay for better text readability */}
//             <div className='absolute inset-0 pointer-events-none'></div>

//             {/* Content Container */}
//             <div className='relative z-10 w-full  max-w-[3200px] mx-auto px-5 sm:px-6 md:px-8 flex flex-col items-center justify-center lg:px-12 py-8 sm:py-10 overflow-hidden'>
//               {/* Header Section */}
//               <div className='text-center sm:mb-12'>
//                 <div className='inline-block tracking-tight text-[#5057EA] font-SF-Pro-Display font-[500] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm md:text-base lg:text-sm xl:text-sm xl:pt-10 2xl:text-base mb-1 sm:mb-4'>
//                   SWIFT & SECURE
//                 </div>
//                 <h2 className='text-2xl sm:text-3xl !font-Mona-Sans md:text-3xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-semibold text-[#303031] mb-4 sm:mb-6 xl:-mt-4 leading-[1.5] tracking-tighter sm:tracking-normal'>
//                   <span className='md:whitespace-nowrap'>Dummy Flight Tickets That Are</span>{' '}
//                   <br className='hidden sm:block' />{' '}
//                   Fast, Genuine, & Hassle Free
//                 </h2>
//               </div>

//               {/* Mobile Swiper View */}
//               {/* <div className='block lg:hidden mr-2 mb-8 sm:mb-10'>
//               <Swiper
//                 modules={[Pagination, Autoplay, EffectCards]}
//                 spaceBetween={0}
//                 slidesPerView={1.01}
//                 centeredSlides={true}
//                 loop={true}
//                 grabCursor={true}
//                 allowTouchMove={true}
//                 simulateTouch={true}
//                 touchRatio={1}
//                 touchAngle={45}
//                 threshold={10}
//                 longSwipesRatio={0.5}
//                 longSwipesMs={300}
//                 followFinger={true}
//                 effect='cards'
//                 cardsEffect={{
//                   perSlideOffset: 19,
//                   perSlideRotate: 9,
//                   rotate: true,
//                   slideShadows: false,
//                   slideblur: true
//                 }}
//                 autoplay={{
//                   delay: 2600,
//                   disableOnInteraction: true,
//                   pauseOnMouseEnter: true,
//                   stopOnLastSlide: true,
//                   reverseDirection: true
//                 }}
//                 pagination={{
//                   clickable: true,
//                   el: '.swiper-pagination'
//                 }}
//                 className='desktop2-swiper w-full'
//                 breakpoints={{
//                   480: {
//                     slidesPerView: 1,
//                     spaceBetween: 0,
//                     centeredSlides: true
//                   },
//                   640: {
//                     slidesPerView: 1,
//                     spaceBetween: 0,
//                     centeredSlides: true
//                   }
//                 }}
//               >
//                 {defaultFeatures.map((feature, index) => (
//                   <SwiperSlide key={feature.id}>
//                     <FeatureCard
//                       image={feature.image}
//                       icon={feature.icon}
//                       title={feature.title}
//                       description={feature.description}
//                       iconBgColor={index === 1 ? 'bg-[#5057ea]' : 'bg-[#f1f2fd]'}
//                       width='w-[283px] min-[375px]:w-[300px] min-[425px]:w-[320px] sm:w-[85%] max-w-[283px] min-[375px]:max-w-[300px] min-[425px]:max-w-[320px] sm:max-w-[350px]'
//                       height='h-[430px]'
//                     />
//                   </SwiperSlide>
//                 ))}
//               </Swiper>
//               <div className='swiper-pagination flex justify-center gap-2 mt-6'></div>
//             </div> */}

//               {/* Mobile Scroll Cards */}
//               <div className="block lg:hidden mb-8 sm:mb-10">
//                 <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-2 scrollbar-hide">
//                   {defaultFeatures.map((feature, index) => (
//                     <div
//                       key={feature.id}
//                       className="snap-center shrink-0"
//                     >
//                       <FeatureCard
//                         image={feature.image}
//                         title={feature.title}
//                         description={feature.description}
//                         iconBgColor={index === 1 ? 'bg-[#5057ea]' : 'bg-[#f1f2fd]'}
//                         width="w-[280px]"
//                         height="h-[420px]"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>


//               {/* Desktop Grid View */}
//               <div className='hidden lg:flex flex-wrap justify-center items-stretch gap-6 sm:gap-8 lg:gap-8 xl:gap-6 2xl:gap-12 mb-8 sm:mb-10 lg:mb-12 w-full'>
//                 {defaultFeatures.map((feature, index) => (
//                   <FeatureCard
//                     key={feature.id}
//                     image={feature.image}
//                     // icon={feature.icon}
//                     title={feature.title}
//                     description={feature.description}
//                     iconBgColor={index === 1 ? 'bg-[#5057ea]' : 'bg-[#f1f2fd]'}
//                     width='w-full max-w-[350px] lg:max-w-[320px] xl:max-w-[350px] 2xl:max-w-[530px]'
//                     height='h-auto min-h-[280px] lg:min-h-[320px] xl:min-h-[280px] 2xl:min-h-[340px]'
//                   />
//                 ))}
//               </div>
//             </div>

//             <style jsx global>{`
//           .desktop2-swiper {
//             width: 100% !important;
//             height: auto !important;
//             overflow: hidden !important;
//             padding: 0 !important;
//           }

//           .desktop2-swiper .swiper-wrapper {
//             align-items: center !important;
//             display: flex !important;
//             height: auto !important;
//           }
//           .swiper-slide {
//             filter: none;
//             transition: filter 0.3s ease-in-out;
//           }

//           .swiper-slide.swiper-slide-prev,
//           .swiper-slide.swiper-slide-next {
//             filter: blur(7px);
//           }

//           .desktop2-swiper .swiper-slide {
//             height: auto !important;
//             display: flex !important;
//             align-items: center !important;
//             justify-content: center !important;
//             width: 100% !important;
//             flex-shrink: 0 !important;
//           }

//           .desktop2-swiper .swiper-container {
//             overflow: hidden !important;
//           }

//           .desktop2-swiper .swiper-pagination {
//             position: relative !important;
//             margin-top: 20px !important;
//           }

//           .desktop2-swiper .swiper-pagination-bullet {
//             background: #5057ea !important;
//             opacity: 0.5 !important;
//             width: 12px !important;
//             height: 12px !important;
//             margin: 0 6px !important;
//           }

//           .desktop2-swiper .swiper-pagination-bullet-active {
//             opacity: 1 !important;
//             background: #5057ea !important;
//           }


//           .desktop2-swiper .swiper-slide-shadow {
//             background: rgba(0, 0, 0, 0.1) !important;
//           }
//         `}</style>
//           </div>

//           <Footer />
//         </div>
//       </div>
//       );
// }









// 'use client';

// import Link from 'next/link';
// import { Button } from '@/components/Button';
// import Footer from '@/components/layout/Footer';


// const cards = [
//   {
//     icon: '🚀',
//     title: 'Fast & Reliable',
//     desc: 'Built with modern technology for maximum performance.',
//   },
//   {
//     icon: '🔒',
//     title: 'Secure',
//     desc: 'Industry-standard security for your data.',
//   },
//   {
//     icon: '💡',
//     title: 'Easy to Use',
//     desc: 'Simple and intuitive interface.',
//   },
// ];


// export default function LandingPage() {
//   return (
//     <div className="min-h-screen bg-white flex flex-col">
//       {/* Hero Section */}
//       <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-grow">

//         {/* Hero Content */}
//         <div className="text-center py-14 sm:py-20">
//           <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-black mb-4 sm:mb-6">
//             Welcome to Your
//             <span className="text-[#4f7c82]"> App</span>
//           </h1>

//           <p className="text-base sm:text-lg md:text-xl text-black/70 mb-6 sm:mb-8 max-w-lg md:max-w-xl mx-auto">
//             Build amazing things with our powerful platform. Get started today and experience the future.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//             <Link href="/signup" className="w-full sm:w-auto">
//               <Button variant="primary" className="w-full sm:w-auto px-8 py-3 text-base sm:text-lg">
//                 Get Started
//               </Button>
//             </Link>

//             <Link href="/login" className="w-full sm:w-auto">
//               <Button variant="secondary" className="w-full sm:w-auto px-8 py-3 text-base sm:text-lg">
//                 Sign In
//               </Button>
//             </Link>
//           </div>
//         </div>

//         {/* Features Section */}
//         <div className="py-14 sm:py-20 overflow-hidden">

//           <div className="flex gap-6 animate-ribbon">
//             {[...cards, ...cards].map((card, index) => (
//               <div
//                 key={index}
//                 className="bg-white p-6 rounded-lg shadow-md
//                    min-w-[280px] lg:min-w-[320px]
//                    text-center md:text-left"
//               >
//                 <div className="text-4xl mb-4">{card.icon}</div>
//                 <h3 className="text-lg sm:text-xl font-semibold mb-2">
//                   {card.title}
//                 </h3>
//                 <p className="text-black/70 text-sm sm:text-base">
//                   {card.desc}
//                 </p>
//               </div>
//             ))}
//           </div>

//         </div>
//       </div>
//       <Footer />
//     </div >
//   );
// }














// 'use client';

// import Link from 'next/link';
// import { Button } from '@/components/Button';
// import Footer from '@/components/layout/Footer';

// export default function LandingPage() {
//   return (
//     <div className="min-h-screen bg-white flex flex-col">
//       {/* Hero Section */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Hero Content */}
//         <div className="text-center py-20">
//           <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
//             Welcome to Your
//             <span className="text-[#4f7c82]"> Amazing App</span>
//           </h1>
//           <p className="text-xl text-black/70 mb-8 max-w-2xl mx-auto">
//             Build amazing things with our powerful platform. Get started today and experience the future.
//           </p>
//           <div className="flex gap-4 justify-center">
//             <Link href="/signup">
//               <Button variant="primary" className="px-8 py-3 text-lg">
//                 Get Started
//               </Button>
//             </Link>
//             <Link href="/login">
//               <Button variant="secondary" className="px-8 py-3 text-lg">
//                 Sign In
//               </Button>
//             </Link>
//           </div>
//         </div>

//         {/* Features Section */}
//         <div className="grid md:grid-cols-3 gap-8 py-20">
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="text-4xl mb-4">🚀</div>
//             <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
//             <p className="text-black/70">
//               Built with modern technology for maximum performance and reliability.
//             </p>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="text-4xl mb-4">🔒</div>
//             <h3 className="text-xl font-semibold mb-2">Secure</h3>
//             <p className="text-black/70">
//               Your data is protected with industry-standard security measures.
//             </p>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="text-4xl mb-4">💡</div>
//             <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
//             <p className="text-black/70">
//               Intuitive interface designed for both beginners and experts.
//             </p>
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// }
