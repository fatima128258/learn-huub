/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '425px',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: '#4f7c82',
        'primary-dark': '#3d6166',
        'primary-light': '#6b9ba3',
      },
    },
  },
  plugins: [],
};

