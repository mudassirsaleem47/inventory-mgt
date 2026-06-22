/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#0099ff',
        'primary-hover': '#1188ff',
        accent: '#f97316',
        muted: '#94a3b8',
        success: '#10b981',
        danger: '#ef4444',
        main: 'var(--main-bg)',
        surface: 'var(--surface-bg)',
        'surface-hover': 'var(--surface-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border-color)',
      },
      boxShadow: {
        premium: 'var(--shadow-premium-val)',
      }
    },
  },
  plugins: [],
}
