/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#290880',
          light: '#4318C9',
          soft: '#EDE8FB',
          softDark: '#1D1340',
        },
      },
      borderRadius: {
        ios: '18px',
        'ios-sm': '12px',
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Chillax', 'Satoshi', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
