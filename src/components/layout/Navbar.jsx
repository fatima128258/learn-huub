'use client';

import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import Link from 'next/link';

function Navbar({ variant = 'default' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const routes = useMemo(() => [
    { name: 'Home', path: '/' },
    { name: 'FAQ', path: '/FAQ' },
    { name: 'Contact Us', path: '/ContactUs' },
    { name: 'Signup', path: '/signup' },
    { name: 'Login', path: '/login' },
  ], []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

   
  const containerClass =
    variant === 'auth'
       ? 'max-w-5xl px-2 sm:px-4 md:px-6 2xl:max-w-[1800px]'
    : 'max-w-7xl px-2 sm:px-4 md:px-6 lg:px-24 2xl:max-w-[1800px]';

  return (
    <div className={`sticky top-0 z-50 shadow transition-all duration-300 ${scrolled ? 'bg-white/70 backdrop-blur-lg' : 'bg-white'}`}>
      <div className={`${containerClass} mx-auto`}>
        <div className="flex items-center justify-between h-16 md:h-20">

         
          <Link href="/" className="flex outline-none items-center gap-1 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#4f7c82] outline-none rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="font-semibold text-lg sm:text-2xl">Learn Hub</span>
          </Link>

          {/* Desktop Menu */}
          {/* Desktop Menu */}
          <div className="hidden lg:flex gap-4 xl:gap-8 font-semibold text-sm xl:text-base">
            {routes.map(({ name, path }) => (
              <Link
                key={name}
                href={path}
                className="relative hover:text-[#4f7c82]
        after:absolute after:left-0 after:-bottom-1
        after:h-[2px] after:w-0 after:bg-[#4f7c82]
        after:transition-all after:duration-300
        hover:after:w-full"
              >
                {name}
              </Link>
            ))}
          </div>


          {/* Mobile Button */}
          <button onClick={toggleMenu} className="lg:hidden" aria-label="Open menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isMenuOpen
                ? "M6 18L18 6M6 6l12 12"
                : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>
    </div>

      {/* Overlay */ }
  {
    isMenuOpen && (
      <div
        onClick={closeMenu}
        className="fixed inset-0 bg-black/40 lg:hidden z-40"
      />
    )
  }

  {/* Side Menu */ }
  <div
    className={`fixed top-16 right-4 w-64 rounded-xl bg-[#2c2c2c] text-white shadow-2xl z-50 transition-all duration-300 lg:hidden
        ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
  >
    <ul className="py-2">
      {routes.map(({ name, path }) => (
        <li key={name}>
          <Link
            href={path}
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg"
          >
            <span className="text-sm font-semibold">{name}</span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
    </div >
  );
}

export default memo(Navbar);