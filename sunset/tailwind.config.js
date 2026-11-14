/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#1d1a3a',
        ink: '#2a2350',
        cream: '#fdf3dc',
        tan: '#e7cf9f',
        sunny: '#ffd43b',
        lav: '#dcd7ff',
        go: '#2fb344',
        warn: '#f2a900',
        stop: '#e03131',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        kr: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
