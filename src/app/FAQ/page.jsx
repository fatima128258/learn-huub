'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What is Learn Hub?',
      answer: 'Learn Hub is a comprehensive online learning platform designed to help students master new skills and advance their careers. We offer structured courses, interactive content, quizzes, labs, and activities to ensure effective learning experiences.',
      image: '/images/learn-hub-hero.jpg', 
    },
    {
      question: 'How do I get started?',
      answer: 'Getting started is easy! Simply create an account by signing up on our platform. Choose your role (Student or Instructor), complete your profile, and you\'re ready to explore courses or start creating content.',
      image: '/images/get-started.jpg',
    },
    {
      question: 'What happens if I fail the quiz?',
      answer: 'You get three attempts to pass the quiz for each course. If you pass the quiz within 3 attempts, you get lifetime access to the playlist. If you fail all three attempts, you will still have 1 year access to the playlist from your purchase date.',
      image: '/images/quiz.jpg',
    },
    {
      question: 'Can I become an instructor?',
      answer: 'Yes! If you\'re passionate about teaching, you can sign up as an instructor. Create your profile, upload your courses (videos, labs, activities, quizzes), set your prices, and start earning. Instructors receive 70% of course sales, with payments transferred within 8 days of purchase.',
      image: '/images/instructor.jpg',
    },
    {
      question: 'Can I track my learning progress?',
      answer: 'Absolutely! Students have access to a comprehensive Progress section that shows completion percentage for each purchased course, quiz attempts, and overall learning statistics. You can see detailed progress for videos, activities, labs, and quizzes.',
      image: '/images/progress.jpg',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'Currently, we accept payments through bank transfers. When purchasing a course, you\'ll need to provide bank details and transaction information.',
      image: '/images/payment-methods.jpg',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white flex flex-col overflow-y-auto hide-scrollbar">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-12 2xl:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-black mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-[10px] sm:text-[14px] text-black/70 max-w-2xl tracking-tight mx-auto leading-relaxed">
              You can find your relevant query with this set of FAQs. If you are still searching for your question,
              you can contact us via <strong>WhatsApp</strong> at{" "}
              <a
                href="https://wa.me/923005053471"
                className="text-[#4f7c82] hover:underline"
              >
                +92 300 5053471
              </a>{" "}
              or <strong>Email</strong> us at{" "}
              <a
                href="mailto:info@learnhub.com"
                className="text-[#4f7c82] hover:underline"
              >
                info@learnhub.com
              </a>.
            </p>

          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h2 className="text-lg tracking-tight font-normal text-black pr-4">
                    {faq.question}
                  </h2>
                  <svg
                    className={`w-6 h-6 text-[#4f7c82] flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'transform rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index
                      ? 'max-h-[2000px] opacity-100'
                      : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-6 pb-6 ">
                    <p className="text-gray-700 tracking-tight leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
