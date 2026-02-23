import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio:        "#1A1A1A",   // primary background — dark studio walls
        amber:         "#C8860A",   // gold accent — studio instruments
        "amber-light": "#E8A020",   // hover states, highlights
        cream:         "#F5F0E8",   // light surface — aged paper
        "cream-dark":  "#E8DFC8",   // card backgrounds, input fields
        tobacco:       "#7A5C3A",   // secondary text — leather, wood
        "dark-brown":  "#2C1810",   // headings, primary text on light bg
        red:           "#C0392B",   // ON AIR element ONLY — never for errors
        "muted-olive": "#6B7A4A",   // occasional accent
      },
      fontFamily: {
        georgia: ["Georgia", "serif"],
        sans:    ["-apple-system", "BlinkMacSystemFont", "Arial", "sans-serif"],
      },
      keyframes: {
        "on-air-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px 4px rgba(192, 57, 43, 0.6)",
          },
          "50%": {
            boxShadow: "0 0 40px 12px rgba(192, 57, 43, 0.9)",
          },
        },
        "amber-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 12px 2px rgba(200, 134, 10, 0.4)",
          },
          "50%": {
            boxShadow: "0 0 28px 8px rgba(200, 134, 10, 0.7)",
          },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "on-air-pulse": "on-air-pulse 1.8s ease-in-out infinite",
        "amber-pulse":  "amber-pulse 2s ease-in-out infinite",
        "fade-in":      "fade-in 0.4s ease-out forwards",
        "fade-up":      "fade-up 0.5s ease-out forwards",
      },
      transitionDuration: {
        "350": "350ms",
      },
    },
  },
  plugins: [],
};

export default config;
