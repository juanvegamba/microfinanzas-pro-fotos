/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1e3a8a',
          secondary: '#1d4ed8',
          accent: '#dc2626',
          surface: '#f3f4f6',
        }
      }
    },
  },
  plugins: [],
}