/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#10B981',
          secondary: '#34D399',
          mint: '#6EE7B7'
        },
        dark: {
          bg: '#09090B',
          surface: '#101513',
          elevated: '#141A18',
          border: 'rgba(255, 255, 255, 0.06)',
          text: {
            primary: '#F8FAFC',
            secondary: '#CBD5E1',
            muted: '#94A3B8'
          }
        },
        iot: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
          indigo: '#6366F1'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)'
      }
    },
  },
  plugins: [],
}
