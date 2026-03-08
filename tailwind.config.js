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
        mono: ['"Space Mono"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#07080d',
          secondary: '#0d0f18',
          card: '#0f1120',
          border: '#1a1f35',
        },
        signal: {
          bullish: '#00ff88',
          neutral: '#f5a623',
          bearish: '#ff4560',
        },
        accent: {
          cyan: '#00d4ff',
          purple: '#7c3aed',
        },
        text: {
          primary: '#e8ecf4',
          muted: '#5a6478',
          dim: '#3a4155',
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(26, 31, 53, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 31, 53, 0.4) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 10px #00ff88, 0 0 20px #00ff8844' },
          '100%': { textShadow: '0 0 20px #00ff88, 0 0 40px #00ff8866, 0 0 60px #00ff8833' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(26, 31, 53, 0.8), 0 4px 24px rgba(0, 0, 0, 0.4)',
        'bullish': '0 0 20px rgba(0, 255, 136, 0.15)',
        'bearish': '0 0 20px rgba(255, 69, 96, 0.15)',
        'neutral': '0 0 20px rgba(245, 166, 35, 0.15)',
        'glow-cyan': '0 0 30px rgba(0, 212, 255, 0.2)',
      }
    },
  },
  plugins: [],
};
