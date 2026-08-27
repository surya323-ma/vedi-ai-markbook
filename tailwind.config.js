/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#12172b',
          900: '#181f38',
          800: '#232c4d',
          700: '#323d63',
          600: '#4a557f',
          500: '#6a749b',
          400: '#8d96b8',
          300: '#b3bad3',
          200: '#d6dae9',
          100: '#eceff6',
          50: '#f6f7fb'
        },
        paper: {
          DEFAULT: '#faf7f0',
          dim: '#f1ecdf',
          line: '#e3dbc7'
        },
        pen: {
          DEFAULT: '#c23b3b',
          light: '#e8b4b4',
          dark: '#8f2626'
        },
        mark: {
          correct: '#2f7d5f',
          partial: '#b8862b',
          incorrect: '#c23b3b',
          unanswered: '#8d96b8'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,23,43,0.06), 0 8px 24px -8px rgba(18,23,43,0.12)',
        pop: '0 12px 32px -8px rgba(18,23,43,0.28)'
      },
      backgroundImage: {
        'paper-lines': 'repeating-linear-gradient(transparent, transparent 27px, #e3dbc7 28px)'
      }
    }
  },
  plugins: []
};
