/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],      // headings
        sans: ['Manrope', 'system-ui', 'sans-serif'], // body
      },
      colors: {
        lagoon: { 50: '#EAF3F1', 100: '#CFE3DF', 500: '#1F6F6B', 700: '#0F4B4A', 900: '#0A2F2F' },
        saffron: { 400: '#F6B445', 500: '#F2A33A', 600: '#D98A1F' },
        linen: '#FAFAF6',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: { marquee: 'marquee 30s linear infinite', float: 'float 6s ease-in-out infinite' },
    },
  },
  plugins: [],
}
