import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: "#ed4e08", dark: "#ed4e08" },
        bg: { light: "#fff2d5", dark: "#1a1410" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        serif: ["var(--font-novel)", "Georgia", "serif"],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(237, 78, 8, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [function ({ addUtilities }: any) {
    addUtilities({
      ".scrollbar-none": {
        "-ms-overflow-style": "none",
        "scrollbar-width": "none",
        "&::-webkit-scrollbar": { display: "none" },
      },
    });
  }],
};
export default config;
