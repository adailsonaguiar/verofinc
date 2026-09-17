/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        navy: {
          50: '#f2f4f8',
          100: '#e2e6ef',
          200: '#c2cadd',
          300: '#93a1c1',
          500: '#3c4d78',
          700: '#1f2a4d',
          800: '#162038',
          900: '#0e1628',
          950: '#080d1a',
        },
        gold: {
          400: '#d9b45a',
          500: '#c99a3b',
          600: '#a97d28',
        },
        bone: {
          DEFAULT: '#f7f6f2',
          border: '#e6e3d9',
          divider: '#eeece3',
          soft: '#faf9f4',
        },
      },
    },
  },
  plugins: [],
}
