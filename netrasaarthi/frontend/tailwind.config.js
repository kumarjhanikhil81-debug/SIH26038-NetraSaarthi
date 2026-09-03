/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical Teal (Primary brand & clinical navigation)
        medical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e', // Primary Brand Medical Teal
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // AI Blue & Purple accents (Distinguishing AI/XAI features)
        ai: {
          blue: '#2563eb',
          'blue-light': '#eff6ff',
          'blue-border': '#bfdbfe',
          purple: '#7c3aed',
          'purple-light': '#f5f3ff',
          'purple-border': '#ddd6fe',
          cyan: '#0891b2',
        },
        // Clinical surface tokens
        surface: {
          bg: '#F0F9FA',
          card: '#FFFFFF',
          muted: '#F8FAFC',
          subtle: '#F1F5F9',
        },
        // Brand alias pointing to medical
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(15, 118, 110, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -4px rgba(15, 23, 42, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)',
        'elevated': '0 10px 30px -5px rgba(15, 118, 110, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'ai': '0 8px 25px -4px rgba(124, 58, 237, 0.15), 0 2px 6px -2px rgba(37, 99, 235, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { transform: 'translateY(100%)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
