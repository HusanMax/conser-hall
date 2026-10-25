/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0E',
        coal: '#0F0F12',
        graphite: '#15141A',
        gold: '#D4AF37',
        champagne: '#E8D5A3',
        wine: '#7A1428',
        velvet: '#5C0F1F',
        turquoise: '#4FD1C5',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(212,175,55,0.28), 0 18px 60px -20px rgba(212,175,55,0.35)',
        panel: '0 40px 120px -40px rgba(0,0,0,0.9)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
