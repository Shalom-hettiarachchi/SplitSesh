import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        logo: ["var(--font-logo)", "cursive"],
      },
      colors: {
        // Deep cannabis-leaf green, standing in for the old navy "ink".
        ink: "#132b14",
        // Brand green — every existing `teal-*` class in the app renders in
        // this palette, so the whole UI reads as "weed" without touching
        // each component individually.
        teal: {
          50: "#eef8ec",
          100: "#d7efd1",
          200: "#aedfa3",
          500: "#4b9b34",
          600: "#3c7f29",
          700: "#2f6620",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(19,43,20,0.05), 0 1px 1px rgba(19,43,20,0.04)",
        pop: "0 8px 24px rgba(19,43,20,0.10)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
