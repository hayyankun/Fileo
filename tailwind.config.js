/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'satoshi': ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0D0D0D',
        surface: '#1A1A1A',
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#6C6C6C',
        blue: {
          primary: '#0084FF',
        },
        green: {
          accent: '#00FF99',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#A1A1A1',
        }
      },
      boxShadow: {
        'soft': '0 8px 15px rgba(0, 0, 0, 0.1)',
        'medium': '0 8px 20px rgba(0, 0, 0, 0.15)',
        'strong': '0 8px 25px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
