import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // if you have it
    // no repo-root globs; no '**/*' at the root
  ],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      screens: { xs: "360px" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
