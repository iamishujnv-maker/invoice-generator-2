/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0f1117',
          50: '#f5f5f7',
          100: '#e8e8ed',
          200: '#d1d1db',
          300: '#a8a8b8',
          400: '#6e6e85',
          500: '#4a4a60',
          600: '#2d2d42',
          700: '#1a1a2e',
          800: '#0f0f1e',
          900: '#0f1117',
        },
        slate: {
          ...require('tailwindcss/colors').slate,
        },
        accent: {
          DEFAULT: '#4f6ef7',
          hover: '#3d5ce8',
          light: '#eef0ff',
        },
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 16px 40px rgba(0,0,0,0.06)',
        'input': '0 1px 2px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
