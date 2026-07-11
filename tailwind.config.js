/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Emerald-led primary (full scale so every shade used across the app resolves).
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Premium accent trio for gradients & glows.
        premium: {
          indigo: '#6366f1',
          violet: '#8b5cf6',
          pink: '#ec4899',
        },
        // Flat aliases so Tailwind opacity-modifier syntax works:
        // e.g. shadow-premium-violet/30, bg-premium-violet/20, text-premium-indigo
        'premium-violet': '#8b5cf6',
        'premium-indigo': '#6366f1',
        'premium-pink': '#ec4899',
        // Neutral scale for text/surfaces.
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b0f19',
        },
        // Dark glassmorphism tokens.
        dark: {
          bg: '#0b0f19',
          card: 'rgba(15, 23, 42, 0.65)',
          border: 'rgba(255, 255, 255, 0.06)',
          accent: 'rgba(99, 102, 241, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 45%, #047857 100%)',
        'premium-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        // Rich, dark, always-high-contrast hero: brand + indigo glows layered
        // over a deep emerald→indigo→violet base so white text is always crisp
        // regardless of the active (light/dark) theme.
        'hero-radial':
          'radial-gradient(1200px 600px at 12% -15%, rgba(99,102,241,0.55), transparent 60%), radial-gradient(900px 500px at 105% 5%, rgba(16,185,129,0.45), transparent 55%), radial-gradient(700px 500px at 85% 110%, rgba(236,72,153,0.35), transparent 60%), linear-gradient(135deg, #043d33 0%, #065f46 28%, #3730a3 68%, #6d28d9 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.18)',
        'glow-brand': '0 0 24px rgba(16, 185, 129, 0.35)',
        'glow-premium': '0 0 30px rgba(139, 92, 246, 0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgba(16, 185, 129, 0.2), 0 0 10px rgba(16, 185, 129, 0.1)',
          },
          '100%': {
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.3)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
