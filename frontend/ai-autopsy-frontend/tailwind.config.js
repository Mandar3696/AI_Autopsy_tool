/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0e1117",
        panel: "#111827",
        accent: "#22c55e",
        danger: "#ef4444",
        warning: "#facc15",
      },
    },
  },
  plugins: [],
}
