/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#00ff00',
        'primary-dark': '#00cc00',
        'bg-dark': '#0a0e27',
        'bg-light': '#f8f9fa',
        'surface-dark': '#1a1f3a',
        'surface-light': '#ffffff',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
