import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      screens: { xs: "360px" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
