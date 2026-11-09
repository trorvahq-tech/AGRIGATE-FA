/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Acorn-Regular", "sans-serif"],
        regular: ["Acorn-Regular", "sans-serif"],
        medium: ["Acorn-Medium", "sans-serif"],
        bold: ["Acorn-Bold", "sans-serif"],
        semibold: ["Acorn-SemiBold", "sans-serif"],
        extrabold: ["Acorn-Bold", "sans-serif"],
        light: ["Acorn-Light", "sans-serif"],
        thin: ["Acorn-Thin", "sans-serif"],
        black: ["Acorn-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
}
