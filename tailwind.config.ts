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
        primary: {
          DEFAULT: "#009E60", // Gimmie Vibrant Green - Primary Buttons
          hover: "#007f4d", // 10% darker for hover states
          50: "#e6f7f0",
          100: "#b3e8d1",
          200: "#80d9b2",
          300: "#4dca93",
          400: "#1abb74",
          500: "#009E60",
          600: "#007f4d", // Hover state
          700: "#005e3a",
          800: "#003e27",
          900: "#001e14",
        },
        secondary: {
          DEFAULT: "#D4A056", // Golden Crust - Secondary Buttons
          50: "#faf6f0",
          100: "#f5e8d1",
          200: "#f0dab2",
          300: "#ebcc93",
          400: "#e6be74",
          500: "#D4A056",
          600: "#b88845",
          700: "#9c7034",
          800: "#805823",
          900: "#644012",
        },
        heading: {
          DEFAULT: "#007A4D", // Ooty Forest Green - Headings
        },
        body: {
          DEFAULT: "#2D2D2D", // Deep Charcoal - Body Text
        },
        background: {
          DEFAULT: "#F9F7F2", // Warm Cream - Section Backgrounds
        },
        danger: {
          DEFAULT: "#D32F2F", // Berry Red - Dashboard Error/Danger
        },
        accent: {
          DEFAULT: "#009E60",
          dark: "#007A4D",
          light: "#00B870",
        },
        surface: {
          DEFAULT: "#F9F7F2",
          cream: "#F9F7F2",
        },
        text: {
          dark: "#2D2D2D",
          medium: "#5a574f",
          light: "#9a9588",
        },
        overlay: {
          DEFAULT: "rgba(0, 0, 0, 0.4)",
          dark: "rgba(0, 0, 0, 0.6)",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "surface": "0 4px 15px rgba(0, 0, 0, 0.08)",
        "surface-lg": "0 8px 16px rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        "surface": "15px",
      },
      animation: {
        "slide-in": "slideIn 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-in",
      },
      keyframes: {
        slideIn: {
          from: {
            transform: "translateX(100%)",
            opacity: "0",
          },
          to: {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        fadeIn: {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
