/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#050608",
        backgroundLift: "#090D12",
        surface: "#0D141D",
        surfaceRaised: "#121B27",
        surfaceSoft: "#172232",
        border: "#263545",
        borderSoft: "#1A2633",
        muted: "#A7B0AC",
        mutedSoft: "#747F7B",
        mint: "#8BE7B7",
        peach: "#E98A6C",
        lavender: "#9C96F5",
        gold: "#DCC17C",
        danger: "#E98A6C",
        credit: "#9C96F5",
        plasma: "#DCC17C",
        violet: "#9C96F5",
        cyan: "#7ADDD3",
        lime: "#BCE890",
        auraPurple: "#0F090F",
        auraBlue: "#071012",
        auraMint: "#071611"
      }
    }
  },
  plugins: []
};
