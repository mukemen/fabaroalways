import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0EA5E9',
          dark: '#0C4A6E',
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
} satisfies Config
