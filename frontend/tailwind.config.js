/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-accent)',
        secondary: 'var(--color-accent-hover)',
        accent: 'var(--color-success)',
        dark: 'var(--color-ink)',
        light: 'var(--color-paper)',
        paper: 'var(--color-paper)',
        ink: 'var(--color-ink)',
        gray: { 50: 'var(--color-paper)', 100: 'var(--color-line)', 200: 'var(--color-line)', 300: 'var(--color-line-strong)', 400: 'var(--color-subtle)', 500: 'var(--color-subtle)', 600: 'var(--color-muted)', 700: 'var(--color-muted)', 900: 'var(--color-ink)' },
        slate: { 50: 'var(--color-paper)', 100: 'var(--color-line)', 200: 'var(--color-line)', 300: 'var(--color-line-strong)', 400: 'var(--color-subtle)', 500: 'var(--color-subtle)', 600: 'var(--color-muted)', 700: 'var(--color-muted)', 800: 'var(--color-ink)', 900: 'var(--color-ink)', 950: 'var(--color-ink)' },
        blue: { 50: 'var(--color-accent-soft)', 100: 'var(--color-accent-soft)', 300: 'var(--color-line-strong)', 600: 'var(--color-accent)', 700: 'var(--color-accent)', 800: 'var(--color-accent-hover)', 900: 'var(--color-ink)' },
        indigo: { 100: 'var(--color-accent-soft)', 700: 'var(--color-accent)' },
        green: { 50: 'var(--color-success-soft)', 100: 'var(--color-success-soft)', 200: 'var(--color-line)', 300: 'var(--color-line-strong)', 700: 'var(--color-success)', 800: 'var(--color-success)' },
        red: { 50: 'var(--color-danger-soft)', 200: 'var(--color-line)', 300: 'var(--color-line-strong)', 600: 'var(--color-danger)', 700: 'var(--color-danger)' },
        yellow: { 100: 'var(--color-warning-soft)', 400: 'var(--color-warning)', 500: 'var(--color-warning)' },
        orange: { 50: 'var(--color-warning-soft)', 300: 'var(--color-line-strong)', 600: 'var(--color-warning)', 700: 'var(--color-warning)' },
        white: 'var(--color-white)',
        black: 'var(--color-black)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
