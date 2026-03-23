/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
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
        // AMINO-CHAIN Luxury Purple & Gold Colors
        void: {
          base: '#0f0518',
          surface: '#1a0b2e',
          highlight: '#2d1b4e',
        },
        purple: {
          DEFAULT: '#6e2ea8',
          50: '#f5f0fa',
          100: '#ebe0f5',
          200: '#d7c1eb',
          300: '#c3a2e1',
          400: '#9f64cc',
          500: '#6e2ea8',
          600: '#582486',
          700: '#421a64',
          800: '#2c1142',
          900: '#1a0b2e',
          950: '#0f0518',
        },
        gold: {
          DEFAULT: '#b9893d',
          50: '#fefbf3',
          100: '#fdf5e3',
          200: '#f4e4bc',
          300: '#e8ce8f',
          400: '#d6a85a',
          500: '#b9893d',
          600: '#9a6f2f',
          700: '#7a5624',
          800: '#5a3f1b',
          900: '#3a2912',
        },
        neon: {
          purple: '#8b5cf6',
          gold: '#f4e4bc',
        }
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(110, 46, 168, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(110, 46, 168, 0.6)" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(185, 137, 61, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(185, 137, 61, 0.5)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
      },
      boxShadow: {
        'glow-purple': '0 0 40px -10px rgba(110, 46, 168, 0.5)',
        'glow-gold': '0 0 30px -5px rgba(185, 137, 61, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'luxury': '0 25px 50px -12px rgba(110, 46, 168, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'radial-gradient(circle at 50% 0%, #2d1b4e 0%, #0f0518 70%)',
        'gold-gradient': 'linear-gradient(135deg, #f4e4bc 0%, #b9893d 50%, #f4e4bc 100%)',
        'purple-gradient': 'linear-gradient(135deg, #6e2ea8 0%, #8b5cf6 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
