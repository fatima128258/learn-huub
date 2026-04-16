'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import Footer from '@/components/layout/Footer';
import Input from '@/components/Input';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error(error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen overflow-y-auto hide-scrollbar">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-8 2xl:py-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">

            <p className=" text-gray-600 tracking-tight max-w-2xl mx-auto px-4">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 tracking-tight lg:grid-cols-2 gap-6 sm:gap-8">
   
            <Card title="Get in Touch">
              <div className="space-y-2 sm:space-y-2 text-gray-600">
                <div className="flex items-start gap-3 sm:gap-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#4f7c82] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1">Address</p>
                    <p className="text-sm sm:text-base break-words">H#258, ST#26, DEFENSE VIEW</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#4f7c82] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1">Phone</p>
                    <a href="tel:03030800123" className="text-sm sm:text-base hover:text-[#4f7c82] transition-colors">
                      0303 0800 123
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#4f7c82] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1">Email</p>
                    <a href="mailto:info@learnhub.com" className="text-sm sm:text-base hover:text-[#4f7c82] transition-colors break-all">
                      info@learnhub.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#4f7c82] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1">WhatsApp</p>
                    <a href="https://wa.me/923005053471" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base hover:text-[#4f7c82] transition-colors">
                      +92 300 5053471
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Form Card */}
            <Card title="Send us a Message">
              {submitted ? (
                <div className="bg-green-100 border text-[#4f7c82] px-4 py-3 rounded-lg text-sm sm:text-base">
                  Thank you! Your message has been sent.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm sm:text-base font-medium ">Name</label>
                    {/* <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] text-sm sm:text-base"
                      placeholder="Your name"
                      required
                      disabled={loading}
                    /> */}


                    <Input
                      type="text"
                      // name="bankName"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium ">Email</label>
                    {/* <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] text-sm sm:text-base"
                      placeholder="your.email@example.com"
                      required
                      disabled={loading}
                    /> */}
                    <Input
                      type="email"
                      // name="bankName"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium">Message</label>

                    {/* <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] resize-none text-sm sm:text-base"
                      rows="5"
                      placeholder="How can we help you?"
                      required
                      disabled={loading}
                    /> */}

                    <textarea
                      type="email"
                      // name="bankName"
                      placeholder="How can we help you?"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f7c82] resize-none text-sm sm:text-base"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full py-3 text-sm sm:text-base font-medium" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

