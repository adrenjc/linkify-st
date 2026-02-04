/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.tsx',
    './src/components/**/*.tsx',
    './src/layouts/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#722ED1', // Deep Purple for premium feel
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Avoid conflicts with Ant Design
  },
};
