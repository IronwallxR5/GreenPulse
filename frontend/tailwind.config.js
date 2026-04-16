/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── Custom eco-tech palette ──────────────────────────────────
        forest: {
          950: '#061b1f',
          900: '#0a2b30',
          800: '#0f3d45',
          700: '#14515c',
          600: '#1e6672',
          500: '#2f7f8d',
          400: '#4e9da8',
          300: '#77bcc2',
          200: '#aad6d9',
          100: '#d8ecee',
          50:  '#eef7f8',
        },
        gold: {
          700: '#7b4d12',
          600: '#98611a',
          500: '#b97a28',
          400: '#d6943e',
          300: '#ebb269',
          200: '#f2cea1',
          100: '#f7e4ca',
          50:  '#fcf4e7',
        },
        warm: {
          950: '#121718',
          900: '#1b2426',
          800: '#2a383c',
          700: '#3b4d52',
          600: '#51666c',
          500: '#6a7f85',
          400: '#8da1a8',
          300: '#b4c4c9',
          200: '#d2dde0',
          100: '#e7edef',
          50:  '#f4f7f8',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Avenir Next"', '"Segoe UI"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '"Avenir Next"', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'warm-sm': '0 1px 2px rgba(12, 31, 35, 0.06), 0 3px 12px rgba(12, 31, 35, 0.05)',
        'warm-md': '0 8px 24px rgba(12, 31, 35, 0.10), 0 3px 12px rgba(12, 31, 35, 0.07)',
        'warm-lg': '0 24px 48px rgba(10, 43, 48, 0.18), 0 8px 18px rgba(10, 43, 48, 0.08)',
        'glow-forest': '0 0 0 1px rgba(30, 102, 114, 0.20), 0 18px 44px rgba(30, 102, 114, 0.22)',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        drift: 'drift 16s linear infinite',
        pulseSoft: 'pulseSoft 3.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        drift: {
          '0%': { transform: 'translateX(-8%)' },
          '50%': { transform: 'translateX(8%)' },
          '100%': { transform: 'translateX(-8%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
