/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#fff0f7', 100: '#ffe0ef', 200: '#ffc2df', 300: '#ff94c5', 400: '#fb5fa8',
          500: '#f43397', 600: '#d91e80', 700: '#b3156a', 800: '#8f1355', 900: '#6e0f42',
        },
        ink: '#2a1626',
      },
      boxShadow: {
        card: '0 1px 2px rgba(110,15,66,.06), 0 8px 24px -12px rgba(110,15,66,.18)',
        lift: '0 18px 40px -16px rgba(217,30,128,.35)',
      },
    },
  },
  plugins: [],
};
