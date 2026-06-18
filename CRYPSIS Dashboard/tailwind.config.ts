import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdfff',
          300: '#8ecbff',
          400: '#59afff',
          500: '#3390fa',
          600: '#1d6eef',
          700: '#1758d1',
          800: '#1948a8',
          900: '#1a3f85',
        },
      },
    },
  },
  plugins: [],
}

export default config
