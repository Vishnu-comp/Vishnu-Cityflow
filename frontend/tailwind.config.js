/** @type {import('tailwindcss').Config} */
// Design tokens — the cityflo.com palette + fonts.
// (v3-style config: works on Node 18, unlike Tailwind v4's native engine.)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17160f',
        'ink-soft': '#4f4c41',
        muted: '#8b8778',
        paper: '#fbfaf5',
        cream: '#f4f1e4',
        'cream-deep': '#eeeada',
        line: '#eae6d8',
        brand: '#f6c500',
        'brand-soft': '#fff3bf',
        'brand-line': '#efdf96',
        danger: '#b3261e',
        'danger-bg': '#fbeceb',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
