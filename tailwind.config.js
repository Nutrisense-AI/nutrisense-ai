/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // NutriSense AI Brand Palette
        background: {
          DEFAULT: '#0A0A0F',
          secondary: '#12121A',
          tertiary: '#1A1A26',
          card: '#16161F',
          elevated: '#1E1E2E',
        },
        primary: {
          DEFAULT: '#6C63FF',
          light: '#8B84FF',
          dark: '#4B44CC',
          muted: '#6C63FF33',
        },
        accent: {
          green: '#00D4AA',
          'green-muted': '#00D4AA22',
          orange: '#FF6B35',
          'orange-muted': '#FF6B3522',
          blue: '#4FC3F7',
          'blue-muted': '#4FC3F722',
          pink: '#FF4081',
          'pink-muted': '#FF408122',
          yellow: '#FFD740',
          'yellow-muted': '#FFD74022',
        },
        text: {
          primary: '#F0F0FF',
          secondary: '#A0A0C0',
          muted: '#606080',
          disabled: '#404060',
        },
        border: {
          DEFAULT: '#2A2A3E',
          light: '#3A3A52',
          focus: '#6C63FF',
        },
        macro: {
          protein: '#FF6B35',
          carbs: '#4FC3F7',
          fat: '#FFD740',
          fiber: '#00D4AA',
          calories: '#FF4081',
        },
        status: {
          success: '#00D4AA',
          warning: '#FFD740',
          error: '#FF4081',
          info: '#4FC3F7',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['Courier'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
        '26': '104px',
        '30': '120px',
      },
    },
  },
  plugins: [],
};
