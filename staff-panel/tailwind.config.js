/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        lagoon: {
          50: '#EAF3F1',
          100: '#CFE3DF',
          200: '#9FC7BF',
          300: '#6FAAA0',
          400: '#438D87',
          500: '#1F6F6B',
          600: '#155B58',
          700: '#0F4B4A',
          800: '#0C3C3C',
          900: '#0A2F2F',
          950: '#061C1C',
        },
        saffron: {
          50: '#FEF8EE',
          100: '#FDF0DC',
          200: '#FBE0B9',
          300: '#F8CE8F',
          400: '#F6B445',
          500: '#F2A33A',
          600: '#D98A1F',
          700: '#B56F14',
          800: '#8A5111',
          900: '#663B0E',
        },
        linen: '#FAFAF6',
        // Map amber & gold to saffron/lagoon theme tokens for complete visual harmony
        amber: {
          50: '#FEF8EE',
          100: '#FDF0DC',
          200: '#FBE0B9',
          300: '#F8CE8F',
          400: '#F6B445',
          500: '#F2A33A',
          600: '#D98A1F',
          700: '#B56F14',
          800: '#8A5111',
          900: '#663B0E',
        },
        gold: {
          50: '#FEF8EE',
          100: '#FDF0DC',
          200: '#FBE0B9',
          300: '#F8CE8F',
          400: '#F6B445',
          500: '#F2A33A',
          600: '#D98A1F',
          700: '#B56F14',
          800: '#0F4B4A',
          900: '#0A2F2F',
          950: '#061C1C',
        }
      }
    },
  },
  plugins: [],
}
