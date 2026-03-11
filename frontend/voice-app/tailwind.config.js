/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme palette
        notion: {
          bg: 'transparent',    // use body gradient
          surface: 'rgba(255, 255, 255, 0.05)',   // glass surface
          text: '#ffffff',      // white
          textLight: 'rgba(255, 255, 255, 0.7)', // white 70%
          border: 'rgba(255, 255, 255, 0.1)',    // white 10%
          hover: 'rgba(255, 255, 255, 0.1)',     // white hover
          accent: '#2383e2',    // blue for data/links
        },
        // Coral accent — main CTA color (PlayerZero-inspired)
        coral: {
          50: '#fff1ee',
          100: '#fdddd5',
          400: '#f07a5c',
          500: '#e85d3a',
          600: '#d44d2a',
          700: '#b83d1e',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2383e2',
          700: '#1d6cc7',
          800: '#1e4fa8',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
