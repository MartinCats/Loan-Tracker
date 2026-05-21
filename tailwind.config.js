/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#050609",
        surface: "#0D1420",
        surfaceRaised: "#121C2A",
        border: "#243244",
        muted: "#A7B0AC",
        mint: "#7BE7B2",
        peach: "#F08A66",
        lavender: "#8F86F7",
        gold: "#DDBE75",
        danger: "#F08A66",
        credit: "#8F86F7",
        plasma: "#DDBE75",
        violet: "#8F86F7",
        cyan: "#6ADDD2",
        lime: "#B9E87A",
        auraPurple: "#120913",
        auraBlue: "#071114"
      }
    }
  },
  plugins: []
};
