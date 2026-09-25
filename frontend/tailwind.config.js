/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        ledger: {
          base: "#0E1116",
          panel: "#151A21",
          raised: "#1B222B",
          line: "#262F3A",
          muted: "#7C8798",
          text: "#E7ECF3",
        },
        signal: {
          filed: "#3FCB8C",
          pending: "#E8A33D",
          overdue: "#E55A4A",
          info: "#4E8CF0",
        },
        rupee: {
          DEFAULT: "#C98A3B",
          soft: "#3A2D1B",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
