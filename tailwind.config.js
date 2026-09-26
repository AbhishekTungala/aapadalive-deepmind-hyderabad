/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          950: '#06080d',
          900: '#0b0f17',
          850: '#0f1724',
          800: '#141d2e',
          700: '#1e293b',
          600: '#334155',
        },
        triage: {
          critical: '#ef4444',
          high: '#f97316',
          moderate: '#eab308',
          low: '#10b981',
          codeRed: '#dc2626',
        },
        hyderabad: {
          teal: '#06b6d4',
          amber: '#f59e0b',
          police: '#3b82f6',
          ambulance: '#10b981',
          fire: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'flash-amber': 'flashAmber 0.8s ease-in-out infinite alternate',
      },
      keyframes: {
        flashAmber: {
          '0%': { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.4)' },
          '100%': { backgroundColor: 'rgba(245, 158, 11, 0.35)', borderColor: 'rgba(245, 158, 11, 1)' },
        }
      }
    },
  },
  plugins: [],
}
