/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Notion-style grayscale palette
        notion: {
          bg: '#ffffff',
          text: '#37352f',
          textLight: '#787774',
          border: '#e9e9e7',
          hover: '#f7f6f3',
          accent: '#2383e2',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
