/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0F172A',
          900: '#131D2E',
          850: '#1E2D3D',
          800: '#26384C',
        },
        coral: {
          500: '#FF5A36',
          600: '#E04724',
        },
        emerald: {
          500: '#10B981',
          600: '#059669',
        },
        crimson: {
          500: '#EF4444',
          600: '#DC2626',
        },
        amber: {
          500: '#F59E0B',
          600: '#D97706',
        },
        ivory: '#F8F6F0',
      },
      fontFamily: {
        heading: ['Outfit', 'Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        code: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
