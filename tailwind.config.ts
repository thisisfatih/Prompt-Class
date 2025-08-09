import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"],
  content: ["./src/app/**/*.{ts,tsx}","./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "1.2rem",
        xl: "1.4rem",
        "2xl": "1.75rem",
      },
      colors: {
        brand: {
          DEFAULT: "#4F46E5", // indigo-600
          fg: "#ffffff",
          soft: "#EEF2FF",
        },
      },
      boxShadow: {
        soft: "0 6px 24px rgba(0,0,0,0.06)",
        card: "0 12px 32px rgba(0,0,0,0.07)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
