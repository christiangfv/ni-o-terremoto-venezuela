/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emergency: {
          50: "#fff7ed",
          600: "#ea580c",
          700: "#c2410c"
        }
      }
    }
  },
  plugins: []
};
