/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#F2F8F3',
          100: '#E1F0E4',
          200: '#C2E0C7',
          300: '#94C79D',
          400: '#5FA96C',
          500: '#3D8B4B',
          600: '#2E733B',
          700: '#245C30',
          800: '#1F4A28',
          900: '#1A3D22',
          950: '#0C2212',
        },
        harvest: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        civic: {
          50: '#F0F5FA',
          100: '#E0EBF5',
          200: '#BAD5EB',
          300: '#85B6DC',
          400: '#4B92C9',
          500: '#2874B0',
          600: '#1B5B92',
          700: '#174977',
          800: '#163E63',
          900: '#173553',
        },
        warmgray: {
          50: '#FAF9F6',
          100: '#F4F2EC',
          200: '#E8E5DD',
          300: '#D5D0C3',
          400: '#B8B1A0',
          500: '#9C9381',
          600: '#7E7666',
          700: '#635D50',
          800: '#504A41',
          900: '#433E37',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Noto Sans"', 'sans-serif'],
      },
      minHeight: {
        'touch': '48px',
        'touch-lg': '56px',
      },
      minWidth: {
        'touch': '48px',
        'touch-lg': '56px',
      }
    },
  },
  plugins: [],
}
