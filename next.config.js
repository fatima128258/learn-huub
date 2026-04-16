/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optimize compilation
  experimental: {
    optimizePackageImports: ['@reduxjs/toolkit', 'react-redux', 'framer-motion'],
  },
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  serverRuntimeConfig: {
    maxFileSize: '10mb',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.istockphoto.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;













// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   swcMinify: true,
//   // Optimize compilation
//   experimental: {
//     optimizePackageImports: ['@reduxjs/toolkit', 'react-redux', 'framer-motion'],
//   },
//   // Reduce bundle size
//   compiler: {
//     removeConsole: process.env.NODE_ENV === 'production',
//   },
//   serverRuntimeConfig: {
//     maxFileSize: '10mb',
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'img.freepik.com',
//         port: '',
//         pathname: '/**',
//       },
//       {
//         protocol: 'https',
//         hostname: 'encrypted-tbn0.gstatic.com',
//         port: '',
//         pathname: '/**',
//       },
//       {
//         protocol: 'https',
//         hostname: 'media.istockphoto.com',
//         port: '',
//         pathname: '/**',
//       },
//     ],
//   },
// };

// module.exports = nextConfig;