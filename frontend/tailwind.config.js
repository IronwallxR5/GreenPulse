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

        // ── Custom warm-earth palette ─────────────────────────────────
        forest: {
          950: '#0b1a10',
          900: '#172e1e',
          800: '#1f3f2a',
          700: '#2c5639',
          600: '#3a6e49',
          500: '#4a8a5c',
          400: '#67a87b',
          300: '#8fc4a1',
          200: '#b8dcc5',
          100: '#d9ede3',
          50:  '#edf7f1',
        },
        gold: {
          700: '#8a6015',
          600: '#a87820',
          500: '#c9963d',
          400: '#d4a853',
          300: '#e0bf7a',
          200: '#ecd8a8',
          100: '#f6edcf',
          50:  '#fdf8ee',
        },
        warm: {
          950: '#1c1a17',
          900: '#2c2924',
          800: '#4a4540',
          700: '#6b6458',
          600: '#8a7e74',
          500: '#9e9689',
          400: '#b8b0a4',
          300: '#d0c9bc',
          200: '#e8dcc8',
          100: '#f0e8da',
          50:  '#fdf8f0',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(28,26,23,0.06), 0 1px 2px -1px rgba(28,26,23,0.06)',
        'warm-md': '0 4px 12px -2px rgba(28,26,23,0.08), 0 2px 4px -2px rgba(28,26,23,0.06)',
        'warm-lg': '0 10px 24px -4px rgba(28,26,23,0.10), 0 4px 8px -4px rgba(28,26,23,0.06)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
