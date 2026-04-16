"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const initialFeatures = [
  { id: 1, title: "Learn Faster. Lead Better.", description: "We cut out the fluff to deliver streamlined learning—from basics to mastery—so you reach your goals faster.", icon: "⚡" },
  { id: 2, title: "Career-Oriented Skills", description: "Build skills that matter in today’s market and prepare yourself for real opportunities, not just certificates.", icon: "🎯" },
  { id: 3, title: "Your Potential, Unlocked.", description: "We don’t just provide courses; we provide breakthroughs. Gain the confidence and the credentials to take your next big step with ease.", icon: "🔓" },
  { id: 4, title: "Education That Fits Your Life.", description: "Stop pausing your life to learn. Learn Hub offers bite-sized, premium content that fits into your busy schedule—anytime, anywhere.", icon: "💡" },
];

export default function Section5() {
  const [cards, setCards] = useState(initialFeatures);
  const [isLeaving, setIsLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024); // Changed from 640 to 1024
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return; // No animation on mobile
    
    const interval = setInterval(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setCards(prev => {
          const [first, ...rest] = prev;
          return [...rest, first];
        });
        setIsLeaving(false);
      }, 800);
    }, 3000);

    return () => clearInterval(interval);
  }, [isMobile]);

  if (!mounted) return null;

  return (
    <section className="bg-gray-50 py-6 sm:py-10 lg:py-12 2xl:py-10 overflow-hidden">
      <div className="max-w-7xl 2xl:max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-24 ">

        
        <div className="text-center max-w-4xl md:max-w-2xl lg:max-w-4xl mx-auto mb-14">
          <h2 className='text-xl sm:text-2xl md:text-2xl lg:text-3xl 2xl:text-4xl font-semibold text-[#303031] sm:mb-6 leading-[1.5] tracking-tighter'>
            WHY CHOOSE US</h2>
          <p className="mt-4 text-gray-500 tracking-tighter max-w-full md:max-w-xl lg:max-w-full mx-auto">
            Empowering Your Growth Through Learning – We provide practical, flexible, and expert-led courses designed to upskill you for today’s fast-changing world. Choose us to unlock your potential and achieve your goals with confidence.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-26 2xl:gap-28 items-start max-w-7xl 2xl:max-w-[1800px] mx-auto w-full">

          <div className="relative overflow-visible lg:h-[400px] xl:h-[460px] w-full">

            {isMobile ? (
              // Simple static cards for mobile (no animation)
              <div className="space-y-4">
                {initialFeatures.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl px-4 py-3 shadow-sm w-full"
                  >
                    <div className="flex gap-4">
                      <div>
                        <h4 className="font-semibold tracking-tight text-[#2f3e46] text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-500 mt-1 tracking-tight">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Animated cards for tablet and desktop
              <AnimatePresence>
                {cards.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: index === 2 ? 120 : 0 }}
                    animate={{ opacity: 1, y: 0, x: index === 0 && isLeaving ? "-120%" : "0%" }}
                    exit={{ opacity: 0, x: "-120%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className={`bg-white rounded-2xl px-4 py-3 shadow-sm w-full
                                ${index > 0 ? 'mt-4' : ''} lg:mt-0`}
                    style={{
                      top: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${index * 130}px` : "auto",
                      position: typeof window !== 'undefined' && window.innerWidth >= 1024 ? "absolute" : "relative",
                    }}
                  >
                    <div className="flex gap-4">
                      <div>
                        <h4 className="font-semibold tracking-tight text-[#2f3e46] text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-500 mt-1 tracking-tight">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

          </div>

          {/* RIGHT – IMAGE (hidden on mobile and tablet, visible on laptop+) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative w-full h-[280px] sm:h-[320px] lg:h-[350px] xl:h-[400px] rounded-3xl overflow-hidden hidden lg:block"
          >
            <Image
              src="https://media.istockphoto.com/id/1500285927/photo/young-woman-a-university-student-studying-online.jpg?s=612x612&w=0&k=20&c=yvFDnYMNEJ6WEDYrAaOOLXv-Jhtv6ViBRXSzJhL9S_k="
              alt="Digital Learning"
              fill
              unoptimized
              priority={true}
              className="object-cover"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
