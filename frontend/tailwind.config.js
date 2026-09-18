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
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        /*
         * nivo dark palette.
         * `navy` is a foreground ramp on a near-black ground (900 = brightest
         * text, 50 = darkest container), `bone` is the surface/background ramp,
         * and `gold` is the lime accent.
         */
        navy: {
          50: '#171719',
          100: '#1e1e21',
          200: '#303036',
          300: '#86868d',
          500: '#77777d',
          700: '#929198',
          800: '#c6c4bf',
          900: '#e9e7e2',
          950: '#08080a',
        },
        gold: {
          100: '#1a2110',
          400: '#d7f36b',
          500: '#d7f36b',
          600: '#a8bd62',
          800: '#c9e58a',
        },
        bone: {
          DEFAULT: '#0d0d0f',
          border: '#28282b',
          divider: '#242427',
          soft: '#1a1a1d',
        },
        emerald: {
          100: '#1d3022',
          200: '#2a4231',
          600: '#a9c56a',
          700: '#9cc16d',
          800: '#b5d68a',
        },
        rose: {
          50: '#241a1d',
          100: '#281b20',
          200: '#3a2227',
          600: '#e07a7e',
          700: '#cb777b',
          800: '#e08f92',
        },
        amber: {
          100: '#2a2018',
          600: '#ca9a5a',
          800: '#d9b45a',
        },
      },
      boxShadow: {
        glow: '0 5px 18px #d7f36b22',
        card: '0 13px 25px #00000055',
      },
      borderRadius: {
        xl2: '15px',
      },
    },
  },
  plugins: [],
}
