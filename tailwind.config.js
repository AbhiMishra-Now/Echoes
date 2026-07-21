/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/app/**/*.{js,ts,jsx,tsx}",
    "./frontend/components/**/*.{js,ts,jsx,tsx}",
    "./frontend/styles/**/*.css",
    "./frontend/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-cormorant)', 'Times New Roman', 'serif'],
        body: ['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['var(--font-great-vibes)', 'cursive'],
      },
      colors: {
        ink: {
          DEFAULT: '#1a1028',
          soft: '#3d2a55',
        },
        parchment: {
          DEFAULT: '#f7f0e4',
          deep: '#ebe0cc',
        },
        gold: {
          DEFAULT: '#d4a853',
          bright: '#f0d78c',
          dim: '#a67c2e',
        },
        royal: {
          DEFAULT: '#5b2d8e',
          deep: '#2a1048',
          mid: '#7b45b5',
        },
        'violet-glow': '#c4a1ff',
        velvet: '#1c0f2e',
        leather: '#3a1f5c',
        mist: 'rgba(247, 240, 228, 0.08)',
      },
    },
  },
  plugins: [],
}
