/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editorial/Voice-app aligned palette
        cream: {
          DEFAULT: '#f0ede8',      // Warm cream - main bg
          dark: '#e8e5e0',         // Darker cream
        },
        card: '#fdfcfa',           // Off-white for cards
        dark: '#1a1a1a',           // Dark sidebar/header

        // Text colors
        ink: {
          DEFAULT: '#1a1a1a',      // Almost black
          medium: '#4a4a4a',       // Medium gray
          light: '#787774',        // Light gray
        },

        // Semantic colors (monochromatic)
        primary: '#000000',        // Primary CTA - pure black
        success: '#4a4a4a',        // Success - medium gray
        warning: '#787774',        // Warning - light gray
        danger: '#5a3a3a',         // Error - dark warm gray

        // Border
        'border-light': '#e3e2df',
        'border-default': '#d4d2ce',
      },
      backgroundColor: {
        primary: '#f0ede8',
        secondary: '#e8e5e0',
      },
      textColor: {
        primary: '#ffffff',
        secondary: '#ffffff',
        tertiary: '#ffffff',
        inverse: '#1a1a1a',
        white: '#ffffff',
      },
      borderColor: {
        light: '#e3e2df',
        DEFAULT: '#d4d2ce',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SF Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'title': ['40px', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        'label': ['11px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.1em' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        'sm': '3px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
