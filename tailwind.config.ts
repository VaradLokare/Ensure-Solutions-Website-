import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        muted: "#666666",
        paper: "#FFFFFF",
        soft: "#F7F7F5",
        card: "#F1F1EF",
        line: "#E8E8E6",
        orange: "#FF6B1A",
        "orange-hover": "#E95A0C",
        success: "#218653",
        error: "#D93025",
      },
      boxShadow: {
        soft: "0 24px 70px rgba(21, 21, 21, 0.08)",
        card: "0 16px 42px rgba(21, 21, 21, 0.07)",
      },
      borderRadius: {
        xl2: "20px",
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
