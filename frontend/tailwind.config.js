/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F4EFE6",
        surface: "#FBF7F1",
        paper: "#FFFCF7",
        border: "#E4D8C8",
        ink: "#1C1712",
        muted: "#74685C",
        accent: "#B44A28",
        "accent-soft": "#F3E0D4",
        sage: "#5C6B52",
        "sage-soft": "#E4EADF",
        risk: "#9C3A2A",
        "risk-soft": "#F5E1DC",
        track: "#4E6A4A",
        "track-soft": "#E3EDE0",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Figtree"', "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "500" }],
        h1: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "500" }],
        h2: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "500" }],
        h3: ["1.125rem", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.65", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.45", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      boxShadow: {
        card: "0 1px 1px rgba(28,23,18,0.04), 0 10px 28px rgba(28,23,18,0.05)",
        lift: "0 16px 40px rgba(28,23,18,0.08)",
      },
      borderRadius: {
        card: "16px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [],
};
